import { request } from "./client";
import type {
  Affiliation,
  Athlete,
  AthleteWritePayload,
  Competition,
  CompetitionStatus,
  CompetitionType,
  CompetitionWritePayload,
  EnabledCompetitionCategory,
  EventWod,
  EventWritePayload,
  Location,
  Team,
  TeamWritePayload,
} from "@/types";

export interface AdminCatalogs {
  competitionTypes: CompetitionType[];
  statuses: CompetitionStatus[];
  affiliations: Affiliation[];
  locations: Location[];
}

interface Page<T> {
  results: T[];
}

async function fetchCatalog<T>(path: string): Promise<T[]> {
  const data = await request<T[] | Page<T>>(path);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as Page<T>).results)) {
    return (data as Page<T>).results;
  }
  return [];
}

export async function getAdminCatalogs(): Promise<AdminCatalogs> {
  const [competitionTypes, statuses, affiliations, locations] = await Promise.all([
    fetchCatalog<CompetitionType>("/competition-types/"),
    fetchCatalog<CompetitionStatus>("/status-competitions/"),
    fetchCatalog<Affiliation>("/affiliations/"),
    fetchCatalog<Location>("/locations/"),
  ]);
  return { competitionTypes, statuses, affiliations, locations };
}

export function fetchAdminCompetitions(): Promise<Competition[]> {
  return fetchCatalog<Competition>("/competitions/?page_size=100");
}

export async function createCompetition(
  payload: CompetitionWritePayload,
): Promise<Competition> {
  return request<Competition>("/competitions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCompetition(
  payload: CompetitionWritePayload,
): Promise<Competition> {
  return request<Competition>(`/competitions/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCompetition(id: number): Promise<void> {
  await request<void>(`/competitions/${id}/`, { method: "DELETE" });
}

// ── Competition categories ───────────────────────────────────────────────────

export async function fetchEnabledCompetitionCategories(
  competitionId: number,
): Promise<EnabledCompetitionCategory[]> {
  return fetchCatalog<EnabledCompetitionCategory>(
    `/enabled-competition-categories/?competition=${competitionId}&page_size=100`,
  );
}

// ── Events ───────────────────────────────────────────────────────────────────

export async function fetchEvents(
  competitionId: number,
): Promise<EventWod[]> {
  return fetchCatalog<EventWod>(
    `/events/?competition=${competitionId}&page_size=100`,
  );
}

export async function fetchEvent(id: number): Promise<EventWod> {
  return request<EventWod>(`/events/${id}/`);
}

export async function createEvent(payload: EventWritePayload): Promise<EventWod> {
  return request<EventWod>("/events/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(payload: EventWritePayload): Promise<EventWod> {
  return request<EventWod>(`/events/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(id: number): Promise<void> {
  await request<void>(`/events/${id}/`, { method: "DELETE" });
}

// ── Athletes ─────────────────────────────────────────────────────────────────

export async function fetchAthletes(): Promise<Athlete[]> {
  return fetchCatalog<Athlete>("/athletes/?page_size=100");
}

export async function fetchAthlete(id: number): Promise<Athlete> {
  return request<Athlete>(`/athletes/${id}/`);
}

export async function createAthlete(payload: AthleteWritePayload): Promise<Athlete> {
  return request<Athlete>("/athletes/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAthlete(payload: AthleteWritePayload): Promise<Athlete> {
  return request<Athlete>(`/athletes/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAthlete(id: number): Promise<void> {
  await request<void>(`/athletes/${id}/`, { method: "DELETE" });
}

// ── Teams ────────────────────────────────────────────────────────────────────

export async function fetchTeams(competitionId: number): Promise<Team[]> {
  return fetchCatalog<Team>(`/teams/?competition=${competitionId}&page_size=100`);
}

export async function fetchTeam(id: number): Promise<Team> {
  return request<Team>(`/teams/${id}/`);
}

export async function createTeam(payload: TeamWritePayload): Promise<Team> {
  return request<Team>("/teams/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTeam(payload: TeamWritePayload): Promise<Team> {
  return request<Team>(`/teams/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTeam(id: number): Promise<void> {
  await request<void>(`/teams/${id}/`, { method: "DELETE" });
}