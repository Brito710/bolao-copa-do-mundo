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

// ── Third-place team with group info ─────────────────────────────────────────

export type ThirdPlaced = GroupStanding & { group: string };

export function getBestThirdPlacedTeams(standings: Record<string, GroupStanding[]>): ThirdPlaced[] {
  const thirds: ThirdPlaced[] = [];
  Object.entries(standings).forEach(([group, groupStandings]) => {
    if (groupStandings[2]) thirds.push({ ...groupStandings[2], group });
  });

  return thirds
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    })
    .slice(0, 8);
}

// ── FIFA 2026 Round of 32 bracket ─────────────────────────────────────────────
//
// WEST BLOCK – 1st of A, B, D, E  vs  best 3rd from groups A-F
// EAST BLOCK – 1st of G, I, K, L  vs  best 3rd from groups G-L
//
// Priority matrices (greedy: first available wins):
//   1A: 3C › 3D › 3E › 3F       1G: 3I › 3J › 3K › 3L
//   1B: 3A › 3C › 3D › 3E       1I: 3G › 3H › 3J › 3K
//   1D: 3B › 3E › 3F › 3A       1K: 3H › 3I › 3L › 3G
//   1E: 3D › 3F › 3A › 3B       1L: 3J › 3K › 3G › 3H
//
// FIXED matchups (1st vs 2nd / 2nd vs 2nd):
//   West zone: 1C vs 2D · 1F vs 2E · 2A vs 2B · 2C vs 2F
//   East zone: 1H vs 2G · 1J vs 2I · 2H vs 2J · 2K vs 2L

const WEST_PRIORITY: Record<string, string[]> = {
  A: ['C', 'D', 'E', 'F'],
  B: ['A', 'C', 'D', 'E'],
  D: ['B', 'E', 'F', 'A'],
  E: ['D', 'F', 'A', 'B'],
};

const EAST_PRIORITY: Record<string, string[]> = {
  G: ['I', 'J', 'K', 'L'],
  I: ['G', 'H', 'J', 'K'],
  K: ['H', 'I', 'L', 'G'],
  L: ['J', 'K', 'G', 'H'],
};

/** Greedy assignment: each block winner gets the first available 3rd from its priority list. */
function assignThirds(
  blockWinnerGroups: string[],
  priorityMap: Record<string, string[]>,
  availableThirds: Map<string, string>,   // group → teamId
): Record<string, string> {               // winnerGroup → opponentTeamId
  const result: Record<string, string> = {};
  const used = new Set<string>();

  for (const wg of blockWinnerGroups) {
    for (const pg of priorityMap[wg]) {
      if (availableThirds.has(pg) && !used.has(pg)) {
        result[wg] = availableThirds.get(pg)!;
        used.add(pg);
        break;
      }
    }
  }
  return result;
}

export function generateRoundOf32(standings: Record<string, GroupStanding[]>): Match[] {
  const top2: Record<string, string[]> = {};
  Object.keys(standings).sort().forEach(g => {
    top2[g] = standings[g].slice(0, 2).map(s => s.teamId);
  });

  // ── 1. Collect thirds per zone, ranked by performance ──────────────────────
  const westGroups = ['A', 'B', 'C', 'D', 'E', 'F'];
  const eastGroups = ['G', 'H', 'I', 'J', 'K', 'L'];

  function buildAvailableMap(zoneGroups: string[]): Map<string, string> {
    return new Map(
      zoneGroups
        .filter(g => standings[g]?.[2])
        .map(g => ({ group: g, s: standings[g][2] }))
        .sort((a, b) => {
          if (b.s.pts !== a.s.pts) return b.s.pts - a.s.pts;
          if (b.s.gd !== a.s.gd)  return b.s.gd  - a.s.gd;
          return b.s.gf - a.s.gf;
        })
        .slice(0, 4)
        .map(({ group, s }) => [group, s.teamId] as [string, string])
    );
  }

  const westAvailable = buildAvailableMap(westGroups);
  const eastAvailable = buildAvailableMap(eastGroups);

  // ── 2. Assign 3rds to block winners via priority matrix ───────────────────
  const westMatch = assignThirds(['A', 'B', 'D', 'E'], WEST_PRIORITY, westAvailable);
  const eastMatch = assignThirds(['G', 'I', 'K', 'L'], EAST_PRIORITY, eastAvailable);

  // ── 3. Build all 16 matchups ───────────────────────────────────────────────
  const matchups: [string | undefined, string | undefined][] = [
    // WEST BLOCK (1st vs 3rd) – matches 1-4
    [top2['A']?.[0], westMatch['A']],
    [top2['B']?.[0], westMatch['B']],
    [top2['D']?.[0], westMatch['D']],
    [top2['E']?.[0], westMatch['E']],

    // EAST BLOCK (1st vs 3rd) – matches 5-8
    [top2['G']?.[0], eastMatch['G']],
    [top2['I']?.[0], eastMatch['I']],
    [top2['K']?.[0], eastMatch['K']],
    [top2['L']?.[0], eastMatch['L']],

    // WEST ZONE FIXED – matches 9-12
    [top2['C']?.[0], top2['D']?.[1]],   // 1C vs 2D
    [top2['F']?.[0], top2['E']?.[1]],   // 1F vs 2E
    [top2['A']?.[1], top2['B']?.[1]],   // 2A vs 2B
    [top2['C']?.[1], top2['F']?.[1]],   // 2C vs 2F

    // EAST ZONE FIXED – matches 13-16
    [top2['H']?.[0], top2['G']?.[1]],   // 1H vs 2G
    [top2['J']?.[0], top2['I']?.[1]],   // 1J vs 2I
    [top2['H']?.[1], top2['J']?.[1]],   // 2H vs 2J
    [top2['K']?.[1], top2['L']?.[1]],   // 2K vs 2L
  ];

  return matchups
    .filter((pair): pair is [string, string] => !!pair[0] && !!pair[1])
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
