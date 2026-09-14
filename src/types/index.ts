export interface CompetitionType {
  id?: number;
  code: string;
  name: string;
}

export interface CompetitionStatus {
  id?: number;
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

export interface CompetitionWritePayload {
  id?: number;
  name: string;
  description?: string;
  competition_type?: number;
  status: number;
  affiliation?: number;
  location?: number;
  start_date: string;
  end_date?: string;
  slug?: string;
}

export interface CompetitionStage {
  id: number;
  competition: number;
  name?: string;
  code?: string;
  stage_type?: string;
  qualification_count?: number;
  order?: number;
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

export interface EventWritePayload {
  id?: number;
  competition_stage: number;
  event_number: number;
  name: string;
  workout: string;
  description?: string;
  is_ascending: boolean;
  is_active: boolean;
}

export interface Athlete {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: string;
  profile_photo?: string | null;
  affiliation?: number | null;
}

export interface AthleteWritePayload {
  id?: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: string;
}

export interface Team {
  id: number;
  name: string;
  competition: number;
  affiliation?: number | null;
}

export interface TeamWritePayload {
  id?: number;
  name: string;
  competition: number;
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
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  [key: string]: unknown;
}