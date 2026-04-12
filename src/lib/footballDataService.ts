import type { Match, Prediction } from '../types';

const API_KEY = '4390b38783cc4850b09854c8066ebcc4';
const DIRECT_URL = 'https://api.football-data.org/v4/competitions/WC/matches';


// ── Mappers ───────────────────────────────────────────────────────────────────

const STAGE_MAP: Record<string, Match['stage']> = {
  GROUP_STAGE:    'group',
  LAST_32:        'round_of_32',
  LAST_16:        'round_of_16',
  QUARTER_FINALS: 'quarter_final',
  SEMI_FINALS:    'semi_final',
  THIRD_PLACE:    'third_place',
  FINAL:          'final',
};

function mapStatus(s: string): Match['status'] {
  if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(s)) return 'live';
  if (['FINISHED', 'FT', 'AET', 'PEN'].includes(s)) return 'completed';
  return 'upcoming';
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  groupUpdated: Match[];       // officialMatches updated
  knockoutPreds: Record<string, Prediction>; // officialKnockoutPredictions updated
  liveCount: number;
  completedCount: number;
  lastSync: string;            // ISO timestamp
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function fetchAPI() {
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const url = isDev ? DIRECT_URL : '/api/sync';
  const headers: Record<string, string> = isDev
    ? { 'X-Auth-Token': API_KEY }
    : {};

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Erro na API: HTTP ${res.status}`);
  return res.json();
}

// ── Main sync function ────────────────────────────────────────────────────────

/**
 * Fetches the full tournament from football-data.org and reconciles with our
 * current local match list.
 *
 * Group stage:  matched by team-pair TLA → updates officialMatches
 * Knockout:     matched by team-pair TLA → updates officialKnockoutPredictions
 */
export async function syncFromAPI(
  currentGroupMatches: Match[],
  currentKnockoutMatches: Match[],  // r32 + r16 + qf + sf + final + tp (may be empty)
  currentKnockoutPreds: Record<string, Prediction>,
): Promise<SyncResult> {
  const data = await fetchAPI();
  const apiMatches: any[] = data.matches ?? [];

  let liveCount = 0;
  let completedCount = 0;

  // ── 1. Sync group stage ──────────────────────────────────────────────────
  const groupUpdated: Match[] = currentGroupMatches.map(our => {
    const api = apiMatches.find(a => {
      const h = a.homeTeam?.tla?.toLowerCase();
      const aw = a.awayTeam?.tla?.toLowerCase();
      return (h === our.homeTeamId && aw === our.awayTeamId)
          || (h === our.awayTeamId && aw === our.homeTeamId);
    });
    if (!api) return our;

    const status = mapStatus(api.status);
    if (status === 'live') liveCount++;
    if (status === 'completed') completedCount++;

    // Scores — handle potential home/away swap between API and our data
    const apiHome = api.homeTeam?.tla?.toLowerCase();
    const swapped = apiHome !== our.homeTeamId;
    const rawHome = api.score?.fullTime?.home ?? undefined;
    const rawAway = api.score?.fullTime?.away ?? undefined;

    return {
      ...our,
      status,
      homeScore: rawHome !== null && rawHome !== undefined
        ? (swapped ? rawAway : rawHome)
        : our.homeScore,
      awayScore: rawAway !== null && rawAway !== undefined
        ? (swapped ? rawHome : rawAway)
        : our.awayScore,
      date: api.utcDate ?? our.date,
    };
  });

  // ── 2. Sync knockout stage ───────────────────────────────────────────────
  // Our knockout matches are generated dynamically; match them by team pair
  const knockoutPreds = { ...currentKnockoutPreds };

  for (const our of currentKnockoutMatches) {
    const stage = our.stage;
    const apiStage = Object.entries(STAGE_MAP).find(([, v]) => v === stage)?.[0];
    if (!apiStage) continue;

    const api = apiMatches.find(a => {
      if (a.stage !== apiStage) return false;
      const h  = a.homeTeam?.tla?.toLowerCase();
      const aw = a.awayTeam?.tla?.toLowerCase();
      if (!h || !aw) return false;
      return (h === our.homeTeamId && aw === our.awayTeamId)
          || (h === our.awayTeamId && aw === our.homeTeamId);
    });
    if (!api) continue;

    const status = mapStatus(api.status);
    if (status === 'live') liveCount++;
    if (status !== 'completed') continue; // only write predictions for finished matches

    const apiHome = api.homeTeam?.tla?.toLowerCase();
    const swapped = apiHome !== our.homeTeamId;
    const rawHome: number = api.score?.fullTime?.home ?? 0;
    const rawAway: number = api.score?.fullTime?.away ?? 0;
    const homeScore = swapped ? rawAway : rawHome;
    const awayScore = swapped ? rawHome : rawAway;

    // Determine winner for draws (penalties)
    let winnerId: string | undefined;
    if (homeScore === awayScore) {
      const apiWinner = api.score?.winner; // 'HOME_TEAM' | 'AWAY_TEAM' | null
      if (apiWinner === 'HOME_TEAM') winnerId = our.homeTeamId;
      else if (apiWinner === 'AWAY_TEAM') winnerId = our.awayTeamId;
    }

    knockoutPreds[our.id] = { homeScore, awayScore, ...(winnerId ? { winnerId } : {}) };
    completedCount++;
  }

  return {
    groupUpdated,
    knockoutPreds,
    liveCount,
    completedCount,
    lastSync: new Date().toISOString(),
  };
}

/** Quick check — returns true if any match is currently live */
export async function checkLive(): Promise<boolean> {
  try {
    const data = await fetchAPI();
    return (data.matches ?? []).some((m: any) =>
      ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status)
    );
  } catch {
    return false;
  }
}
