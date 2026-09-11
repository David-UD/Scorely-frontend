import { useQuery } from "@tanstack/react-query";
import {
  getCompetitions,
  type CompetitionFilters,
} from "@/api/public";

export function useCompetitions(filters?: CompetitionFilters) {
  return useQuery({
    queryKey: ["competitions", filters],
    queryFn: () => getCompetitions(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}