export type Role = "admin" | "participant";
export type MatchStatus = "open" | "locked" | "finished";

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
}

export interface Match {
  id: string;
  stage: "group" | "round32" | "round16" | "quarterfinal" | "semifinal" | "third_place" | "final";
  stageLabel: string;
  groupName?: string;
  kickoffAtUtc: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  officialScore?: {
    homeScore: number;
    awayScore: number;
  };
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  position: number;
  points: number;
  exactHits: number;
  resultHits: number;
}
