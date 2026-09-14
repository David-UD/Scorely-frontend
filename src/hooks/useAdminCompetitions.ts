import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCompetition,
  deleteCompetition,
  fetchAdminCompetitions,
  getAdminCatalogs,
  updateCompetition,
} from "@/api/admin";
import type { CompetitionWritePayload } from "@/types";

const adminCompetitionsKey = ["admin", "competitions"] as const;
const adminCatalogsKey = ["admin", "catalogs"] as const;

export function useAdminCompetitions() {
  return useQuery({
    queryKey: adminCompetitionsKey,
    queryFn: fetchAdminCompetitions,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminCatalogs() {
  return useQuery({
    queryKey: adminCatalogsKey,
    queryFn: getAdminCatalogs,
    staleTime: 60_000,
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompetition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCompetitionsKey });
    },
  });
}

export function useUpdateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompetitionWritePayload) => updateCompetition(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCompetitionsKey });
    },
  });
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCompetitionsKey });
    },
  });
}