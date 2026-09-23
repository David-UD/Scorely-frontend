import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAffiliation,
  createAthlete,
  createCompetitionCategory,
  createCompetitor,
  createEnabledCompetitionCategory,
  createEvent,
  createEventCompetitor,
  createLocation,
  createTeam,
  deleteAffiliation,
  deleteAthlete,
  deleteCompetitionCategory,
  deleteCompetitor,
  deleteEnabledCompetitionCategory,
  deleteEvent,
  deleteEventCompetitor,
  deleteLocation,
  deleteTeam,
  fetchAffiliations,
  fetchAthletes,
  fetchCompetitionCategories,
  fetchCompetitors,
  fetchEnabledCompetitionCategories,
  fetchEvents,
  fetchEventCompetitors,
  fetchLocations,
  fetchTeams,
  updateAffiliation,
  updateAthlete,
  updateCompetitionCategory,
  updateCompetitor,
  updateEnabledCompetitionCategory,
  updateEvent,
  updateEventCompetitorResult,
  updateLocation,
  updateTeam,
} from "@/api/admin";
import type {
  AffiliationWritePayload,
  CompetitionCategoryWritePayload,
  CompetitorWritePayload,
  EnabledCompetitionCategoryWritePayload,
  EventCompetitorWritePayload,
  LocationWritePayload,
} from "@/types";

export function useAdminEvents(competitionId: number | null) {
  return useQuery({
    queryKey: ["admin", "events", competitionId],
    queryFn: () => fetchEvents(competitionId as number),
    enabled: Boolean(competitionId),
    staleTime: 30_000,
  });
}

export function useCreateEvent(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "events", competitionId],
      });
    },
  });
}

export function useUpdateEvent(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "events", competitionId],
      });
    },
  });
}

export function useDeleteEvent(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "events", competitionId],
      });
    },
  });
}

export function useAdminAthletes() {
  return useQuery({
    queryKey: ["admin", "athletes"],
    queryFn: fetchAthletes,
    staleTime: 30_000,
  });
}

export function useCreateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "athletes"] });
    },
  });
}

export function useUpdateAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "athletes"] });
    },
  });
}

export function useDeleteAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "athletes"] });
    },
  });
}

export function useAdminTeams() {
  return useQuery({
    queryKey: ["admin", "teams"],
    queryFn: fetchTeams,
    staleTime: 30_000,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "teams"],
      });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "teams"],
      });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "teams"],
      });
    },
  });
}

// ── Affiliations (superadmin catalog) ───────────────────────────────────────

export function useAdminAffiliations() {
  return useQuery({
    queryKey: ["admin", "affiliations"],
    queryFn: fetchAffiliations,
    staleTime: 30_000,
  });
}

export function useCreateAffiliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAffiliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliations"] });
    },
  });
}

export function useUpdateAffiliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AffiliationWritePayload) => updateAffiliation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliations"] });
    },
  });
}

export function useDeleteAffiliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAffiliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliations"] });
    },
  });
}

// ── Locations / Sedes (superadmin catalog) ──────────────────────────────────

export function useAdminLocations() {
  return useQuery({
    queryKey: ["admin", "locations"],
    queryFn: fetchLocations,
    staleTime: 30_000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LocationWritePayload) => updateLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
    },
  });
}

// ── Competition category catalog (superadmin) ───────────────────────────────

export function useAdminCompetitionCategories() {
  return useQuery({
    queryKey: ["admin", "competition-categories"],
    queryFn: fetchCompetitionCategories,
    staleTime: 30_000,
  });
}

export function useCreateCompetitionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompetitionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "competition-categories"],
      });
    },
  });
}

export function useUpdateCompetitionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompetitionCategoryWritePayload) =>
      updateCompetitionCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "competition-categories"],
      });
    },
  });
}

export function useDeleteCompetitionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompetitionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "competition-categories"],
      });
    },
  });
}

// ── Enabled competition categories (admin scope) ────────────────────────────

export function useAdminEnabledCategories(competitionId: number | null) {
  return useQuery({
    queryKey: ["admin", "enabled-competition-categories", competitionId],
    queryFn: () => fetchEnabledCompetitionCategories(competitionId as number),
    enabled: Boolean(competitionId),
    staleTime: 30_000,
  });
}

export function useCreateEnabledCategory(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEnabledCompetitionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "enabled-competition-categories", competitionId],
      });
    },
  });
}

export function useUpdateEnabledCategory(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EnabledCompetitionCategoryWritePayload) =>
      updateEnabledCompetitionCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "enabled-competition-categories", competitionId],
      });
    },
  });
}

export function useDeleteEnabledCategory(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEnabledCompetitionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "enabled-competition-categories", competitionId],
      });
    },
  });
}

// ── Competitors (admin scope) ────────────────────────────────────────────────

export function useAdminCompetitors(competitionId: number | null) {
  return useQuery({
    queryKey: ["admin", "competitors", competitionId],
    queryFn: () => fetchCompetitors(competitionId as number),
    enabled: Boolean(competitionId),
    staleTime: 30_000,
  });
}

export function useCreateCompetitor(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompetitorWritePayload) => createCompetitor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "competitors", competitionId],
      });
    },
  });
}

export function useUpdateCompetitor(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompetitorWritePayload) => updateCompetitor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "competitors", competitionId],
      });
    },
  });
}

export function useDeleteCompetitor(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompetitor,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "competitors", competitionId],
      });
    },
  });
}

// ── Results / EventCompetitor (admin scope) ─────────────────────────────────

export function useAdminEventCompetitors(eventId: number | null) {
  return useQuery({
    queryKey: ["admin", "event-competitors", eventId],
    queryFn: () => fetchEventCompetitors(eventId as number),
    enabled: Boolean(eventId),
    staleTime: 30_000,
  });
}

export function useCreateEventCompetitor(
  eventId: number | null,
  competitionId: number | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventCompetitorWritePayload) =>
      createEventCompetitor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "event-competitors", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard", competitionId],
      });
    },
  });
}

export function useUpdateEventCompetitor(
  eventId: number | null,
  competitionId: number | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: number; result: string }) =>
      updateEventCompetitorResult(args.id, args.result),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "event-competitors", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard", competitionId],
      });
    },
  });
}

export function useDeleteEventCompetitor(
  eventId: number | null,
  competitionId: number | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEventCompetitor,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "event-competitors", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard", competitionId],
      });
    },
  });
}