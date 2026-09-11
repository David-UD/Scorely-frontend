export interface CompetitionType {
  code: string;
  name: string;
}

export interface CompetitionStatus {
  code: string;
  name: string;
}

export interface Affiliation {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface CompetitionSummary {
  id: number;
  name: string;
  description: string;
  slug: string;
  competition_type: CompetitionType;
  status: CompetitionStatus;
  affiliation: Affiliation;
  year: number;
  start_date: string;
  end_date: string;
}

export interface Competition extends CompetitionSummary {
  location?: Location;
}

export interface CompetitionStage {
  id: number;
  competition: number;
  name: string;
  code?: string;
  stage_type?: string;
}

export interface EventWod {
  id: number;
  competition_stage: number;
  event_number: number;
  name: string;
  workout: string;
  description?: string;
  is_ascending: boolean;
  is_active: boolean;
}

export interface CategoryRef {
  id?: number;
  code: string;
  name: string;
}

export interface LeaderboardEntry {
  rank: number;
  competitor_id: number;
  display_name: string;
  final_score: string;
  event_ranks: Array<number | null>;
  event_scores?: Array<number | null>;
}

export type LeaderboardStage = "qualifier" | "final";

export interface Leaderboard {
  competition_id: number;
  stage: LeaderboardStage;
  category: CategoryRef;
  entries: LeaderboardEntry[];
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuthUser {
  id?: number;
  email?: string;
  role?: string;
  [key: string]: unknown;
}