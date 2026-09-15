import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAthlete,
  createEvent,
  createTeam,
  deleteAthlete,
  deleteEvent,
  deleteTeam,
  fetchAthletes,
  fetchEvents,
  fetchTeams,
  updateAthlete,
  updateEvent,
  updateTeam,
} from "@/api/admin";

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

export function useAdminTeams(competitionId: number | null) {
  return useQuery({
    queryKey: ["admin", "teams", competitionId],
    queryFn: () => fetchTeams(competitionId as number),
    enabled: Boolean(competitionId),
    staleTime: 30_000,
  });
}

export function useCreateTeam(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "teams", competitionId],
      });
    },
  });
}

export function useUpdateTeam(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "teams", competitionId],
      });
    },
  });
}

export function useDeleteTeam(competitionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "teams", competitionId],
      });
    },
  });
}