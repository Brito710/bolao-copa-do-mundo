export type Team = {
  id: string;
  name: string;
  code: string;
  flag: string;
  crest: string;
  strength: number;
  group: string;
};

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'upcoming' | 'live' | 'completed';
  stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final';
  date: string;
  venue: string;
  group?: string;
};

export type Prediction = {
  homeScore: number;
  awayScore: number;
  winnerId?: string;
};

export type UserPrediction = {
  id: string;
  userName: string;
  betAmount?: number;
  predictions: Record<string, Prediction>;
  totalPoints: number;
  exactScores: number;
  correctOutcomes: number;
  wrongResults: number;
  isTest?: boolean;
  goldenMatchIds?: string[];
};

export type GroupStanding = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export type AppUser = {
  id: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
};

export type LiveRound = {
  id: string;
  name: string;
  status: 'upcoming' | 'open' | 'closed';
  matchIds: string[];
};

export type LiveMatchPrediction = {
  homeScore: number;
  awayScore: number;
  points?: number;
};

export type UserLiveEntry = {
  id: string;
  userId: string;
  userName: string;
  roundId: string;
  predictions: Record<string, LiveMatchPrediction>;
  totalPoints: number;
  savedAt: string;
};

export type TournamentState = {
  teams: Team[];
  matches: Match[];
  standings: Record<string, GroupStanding[]>;
  currentStage: Match['stage'];
};
