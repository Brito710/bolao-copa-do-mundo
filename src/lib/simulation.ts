import type { Match, Team, GroupStanding, Prediction } from '../types';

export function generateGroupMatches(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const groups = Array.from(new Set(teams.map(t => t.group))).sort();

  groups.forEach(group => {
    const groupTeams = teams.filter(t => t.group === group);
    let matchNum = 1;
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          id: `group-${group}-${groupTeams[i].id}-${groupTeams[j].id}`,
          homeTeamId: groupTeams[i].id,
          awayTeamId: groupTeams[j].id,
          status: 'upcoming',
          stage: 'group',
          date: '2026-06-11',
          venue: 'TBD',
          group,
        });
        matchNum++;
      }
    }
  });

  return matches;
}

export function calculateStandings(matches: Match[], teams: Team[]): Record<string, GroupStanding[]> {
  const standings: Record<string, GroupStanding[]> = {};
  const groups = Array.from(new Set(teams.map(t => t.group))).sort();

  groups.forEach(group => {
    const groupTeams = teams.filter(t => t.group === group);
    const standingsMap: Record<string, GroupStanding> = {};

    groupTeams.forEach(team => {
      standingsMap[team.id] = {
        teamId: team.id,
        played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, pts: 0,
      };
    });

    matches
      .filter(m => m.group === group && m.status === 'completed')
      .forEach(match => {
        const home = standingsMap[match.homeTeamId];
        const away = standingsMap[match.awayTeamId];
        if (!home || !away) return;

        const hg = match.homeScore ?? 0;
        const ag = match.awayScore ?? 0;

        home.played++; away.played++;
        home.gf += hg; home.ga += ag;
        away.gf += ag; away.ga += hg;
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;

        if (hg > ag) {
          home.won++; home.pts += 3;
          away.lost++;
        } else if (hg < ag) {
          away.won++; away.pts += 3;
          home.lost++;
        } else {
          home.drawn++; home.pts++;
          away.drawn++; away.pts++;
        }
      });

    standings[group] = Object.values(standingsMap).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  });

  return standings;
}

export function getBestThirdPlacedTeams(standings: Record<string, GroupStanding[]>): GroupStanding[] {
  const thirds: GroupStanding[] = [];
  Object.values(standings).forEach(groupStandings => {
    if (groupStandings[2]) thirds.push(groupStandings[2]);
  });

  return thirds
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    })
    .slice(0, 8);
}

export function generateRoundOf32(standings: Record<string, GroupStanding[]>): Match[] {
  const groups = Object.keys(standings).sort();
  const top2: Record<string, string[]> = {};
  groups.forEach(g => {
    top2[g] = standings[g].slice(0, 2).map(s => s.teamId);
  });

  const bestThirds = getBestThirdPlacedTeams(standings).map(s => s.teamId);

  // Standard FIFA 48-team format: 16 matches in Round of 32
  // Groups A-L, top 2 from each + 8 best thirds
  const matchups: [string, string][] = [
    [top2['A']?.[0], top2['B']?.[1]],
    [top2['C']?.[0], top2['D']?.[1]],
    [top2['E']?.[0], top2['F']?.[1]],
    [top2['G']?.[0], top2['H']?.[1]],
    [top2['I']?.[0], top2['J']?.[1]],
    [top2['K']?.[0], top2['L']?.[1]],
    [top2['A']?.[1], top2['B']?.[0]],
    [top2['C']?.[1], top2['D']?.[0]],
    [top2['E']?.[1], bestThirds[0]],
    [top2['F']?.[0], bestThirds[1]],
    [top2['G']?.[1], bestThirds[2]],
    [top2['H']?.[0], bestThirds[3]],
    [top2['I']?.[1], bestThirds[4]],
    [top2['J']?.[0], bestThirds[5]],
    [top2['K']?.[1], bestThirds[6]],
    [top2['L']?.[0], bestThirds[7]],
  ];

  return matchups
    .filter(([h, a]) => h && a)
    .map(([homeTeamId, awayTeamId], i) => ({
      id: `r32-${i + 1}`,
      homeTeamId,
      awayTeamId,
      status: 'upcoming' as const,
      stage: 'round_of_32' as const,
      date: '2026-06-27',
      venue: 'TBD',
    }));
}

function getWinner(match: Match, predictions: Record<string, Prediction>): string | null {
  const pred = predictions[match.id];
  if (!pred) return null;

  if (pred.homeScore > pred.awayScore) return match.homeTeamId;
  if (pred.awayScore > pred.homeScore) return match.awayTeamId;
  return pred.winnerId || null;
}

export function generateNextStage(
  prevMatches: Match[],
  predictions: Record<string, Prediction>,
  stage: Match['stage']
): Match[] {
  const winners: string[] = [];
  for (const m of prevMatches) {
    const w = getWinner(m, predictions);
    if (!w) return [];
    winners.push(w);
  }

  const matches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i] && winners[i + 1]) {
      matches.push({
        id: `${stage}-${i / 2 + 1}`,
        homeTeamId: winners[i],
        awayTeamId: winners[i + 1],
        status: 'upcoming',
        stage,
        date: '2026-07-01',
        venue: 'TBD',
      });
    }
  }
  return matches;
}

export function generateThirdPlaceMatch(
  semiFinals: Match[],
  predictions: Record<string, Prediction>
): Match | null {
  if (semiFinals.length < 2) return null;

  const losers: string[] = [];
  for (const m of semiFinals) {
    const pred = predictions[m.id];
    if (!pred) return null;

    let loser: string;
    if (pred.homeScore > pred.awayScore) loser = m.awayTeamId;
    else if (pred.awayScore > pred.homeScore) loser = m.homeTeamId;
    else {
      loser = pred.winnerId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
    }
    losers.push(loser);
  }

  if (losers.length < 2) return null;

  return {
    id: 'third-place',
    homeTeamId: losers[0],
    awayTeamId: losers[1],
    status: 'upcoming',
    stage: 'third_place',
    date: '2026-07-18',
    venue: 'TBD',
  };
}

export function getScoringDetails(
  prediction: Prediction,
  actual: Match,
  isGolden: boolean = false
): { points: number; type: 'exact' | 'outcome' | 'wrong' | 'none' } {
  if (actual.status !== 'completed') return { points: 0, type: 'none' };

  const ah = actual.homeScore ?? 0;
  const aa = actual.awayScore ?? 0;
  const ph = prediction.homeScore;
  const pa = prediction.awayScore;

  const multiplier = isGolden ? 2 : 1;

  if (ph === ah && pa === aa) {
    return { points: 10 * multiplier, type: 'exact' };
  }

  const actualOutcome = ah > aa ? 'home' : aa > ah ? 'away' : 'draw';
  const predOutcome = ph > pa ? 'home' : pa > ph ? 'away' : 'draw';

  if (actualOutcome === predOutcome) {
    return { points: 5 * multiplier, type: 'outcome' };
  }

  return { points: -2 * multiplier, type: 'wrong' };
}
