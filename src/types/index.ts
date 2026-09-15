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

export type EventPhase = "QUALIFIER" | "FINAL";

export interface EnabledCompetitionCategory {
  id: number;
  competition: number;
  competition_category: { id: number; code: string; name: string };
  finalist_slots: number;
}

export interface EventWod {
  id: number;
  competition: number;
  phase: EventPhase;
  event_number: number;
  name: string;
  workout: string;
  description?: string;
  is_ascending: boolean;
  is_active: boolean;
}

export interface EventWritePayload {
  id?: number;
  competition: number;
  phase: EventPhase;
  event_number: number;
  name: string;
  workout: string;
  description?: string;
  is_ascending: boolean;
  is_active: boolean;
}

export interface EventResult {
  event_id: number;
  event_number: number;
  event_name: string;
  phase: EventPhase;
  result: string | null;
  event_rank: number | null;
  score: number | null;
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
  event_results?: EventResult[];
}

export type LeaderboardStage = "qualifier" | "final";

export interface Leaderboard {
  competition_id: number;
  stage: LeaderboardStage;
  category: CategoryRef;
  entries: LeaderboardEntry[];
}

export interface CombinedLeaderboardEntry {
  rank: number;
  competitor_id: number;
  display_name: string;
  event_results: EventResult[];
  total_score: number;
  qualified: boolean;
}

export interface CombinedLeaderboard {
  category: CategoryRef;
  entries: CombinedLeaderboardEntry[];
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
