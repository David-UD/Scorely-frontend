import { request } from "./client";
import { useAuthStore } from "@/store/authStore";
import type {
  Affiliation,
  AffiliationWritePayload,
  Athlete,
  AthleteWritePayload,
  Competition,
  CompetitionCategory,
  CompetitionCategoryWritePayload,
  CompetitionStatus,
  CompetitionType,
  CompetitionWritePayload,
  Competitor,
  CompetitorWritePayload,
  EnabledCompetitionCategory,
  EnabledCompetitionCategoryWritePayload,
  EventCompetitor,
  EventCompetitorWritePayload,
  EventWod,
  EventWritePayload,
  Location,
  LocationWritePayload,
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

function assertSuperUser(): void {
  if (!useAuthStore.getState().user?.is_superuser) {
    throw new Error("No tenés permisos para realizar esta acción.");
  }
}

export async function getAdminCatalogs(): Promise<AdminCatalogs> {
  const [competitionTypes, statuses] = await Promise.all([
    fetchCatalog<CompetitionType>("/competition-types/"),
    fetchCatalog<CompetitionStatus>("/status-competitions/"),
  ]);
  const [affiliations, locations] = await Promise.all([
    fetchAffiliations(),
    fetchLocations(),
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

// ── Affiliations (superadmin catalog) ────────────────────────────────────────

export async function fetchAffiliations(): Promise<Affiliation[]> {
  return fetchCatalog<Affiliation>("/affiliations/?page_size=100");
}

export async function fetchAffiliation(id: number): Promise<Affiliation> {
  return request<Affiliation>(`/affiliations/${id}/`);
}

export async function createAffiliation(
  payload: AffiliationWritePayload,
): Promise<Affiliation> {
  assertSuperUser();
  return request<Affiliation>("/affiliations/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAffiliation(
  payload: AffiliationWritePayload,
): Promise<Affiliation> {
  assertSuperUser();
  return request<Affiliation>(`/affiliations/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAffiliation(id: number): Promise<void> {
  assertSuperUser();
  await request<void>(`/affiliations/${id}/`, { method: "DELETE" });
}

// ── Locations / Sedes (superadmin catalog) ───────────────────────────────────

export async function fetchLocations(): Promise<Location[]> {
  return fetchCatalog<Location>("/locations/?page_size=100");
}

export async function fetchLocation(id: number): Promise<Location> {
  return request<Location>(`/locations/${id}/`);
}

export async function createLocation(
  payload: LocationWritePayload,
): Promise<Location> {
  assertSuperUser();
  return request<Location>("/locations/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLocation(
  payload: LocationWritePayload,
): Promise<Location> {
  assertSuperUser();
  return request<Location>(`/locations/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteLocation(id: number): Promise<void> {
  assertSuperUser();
  await request<void>(`/locations/${id}/`, { method: "DELETE" });
}

// ── Competition category catalog ────────────────────────────────────────────

export async function fetchCompetitionCategories(): Promise<CompetitionCategory[]> {
  return fetchCatalog<CompetitionCategory>("/competition-categories/?page_size=100");
}

export async function fetchCompetitionCategory(id: number): Promise<CompetitionCategory> {
  return request<CompetitionCategory>(`/competition-categories/${id}/`);
}

export async function createCompetitionCategory(
  payload: CompetitionCategoryWritePayload,
): Promise<CompetitionCategory> {
  assertSuperUser();
  return request<CompetitionCategory>("/competition-categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCompetitionCategory(
  payload: CompetitionCategoryWritePayload,
): Promise<CompetitionCategory> {
  assertSuperUser();
  return request<CompetitionCategory>(`/competition-categories/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCompetitionCategory(id: number): Promise<void> {
  assertSuperUser();
  await request<void>(`/competition-categories/${id}/`, { method: "DELETE" });
}

// ── Enabled competition categories ──────────────────────────────────────────

export async function fetchEnabledCompetitionCategories(
  competitionId: number,
): Promise<EnabledCompetitionCategory[]> {
  return fetchCatalog<EnabledCompetitionCategory>(
    `/enabled-competition-categories/?competition=${competitionId}&page_size=100`,
  );
}

export async function createEnabledCompetitionCategory(
  payload: EnabledCompetitionCategoryWritePayload,
): Promise<EnabledCompetitionCategory> {
  return request<EnabledCompetitionCategory>("/enabled-competition-categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEnabledCompetitionCategory(
  payload: EnabledCompetitionCategoryWritePayload,
): Promise<EnabledCompetitionCategory> {
  return request<EnabledCompetitionCategory>(
    `/enabled-competition-categories/${payload.id}/`,
    { method: "PATCH", body: JSON.stringify({ finalist_slots: payload.finalist_slots }) },
  );
}

export async function deleteEnabledCompetitionCategory(id: number): Promise<void> {
  await request<void>(`/enabled-competition-categories/${id}/`, { method: "DELETE" });
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

export async function fetchTeams(): Promise<Team[]> {
  return fetchCatalog<Team>("/teams/?page_size=100");
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

// ── Competitors ───────────────────────────────────────────────────────────────

export async function fetchCompetitors(competitionId: number): Promise<Competitor[]> {
  return fetchCatalog<Competitor>(
    `/competitors/?competition=${competitionId}&page_size=100`,
  );
}

export async function fetchCompetitor(id: number): Promise<Competitor> {
  return request<Competitor>(`/competitors/${id}/`);
}

export async function createCompetitor(
  payload: CompetitorWritePayload,
): Promise<Competitor> {
  return request<Competitor>("/competitors/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCompetitor(
  payload: CompetitorWritePayload,
): Promise<Competitor> {
  return request<Competitor>(`/competitors/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCompetitor(id: number): Promise<void> {
  await request<void>(`/competitors/${id}/`, { method: "DELETE" });
}

// ── Results / EventCompetitor (admin scope) ─────────────────────────────────

export async function fetchEventCompetitors(eventId: number): Promise<EventCompetitor[]> {
  return fetchCatalog<EventCompetitor>(
    `/event-competitors/?event=${eventId}&page_size=100`,
  );
}

export async function createEventCompetitor(
  payload: EventCompetitorWritePayload,
): Promise<EventCompetitor> {
  return request<EventCompetitor>("/event-competitors/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEventCompetitorResult(
  id: number,
  result: string,
): Promise<EventCompetitor> {
  return request<EventCompetitor>(`/event-competitors/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ result }),
  });
}

export async function deleteEventCompetitor(id: number): Promise<void> {
  await request<void>(`/event-competitors/${id}/`, { method: "DELETE" });
}