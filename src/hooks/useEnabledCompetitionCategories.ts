import { useQuery } from "@tanstack/react-query";
import { getEnabledCompetitionCategories } from "@/api/public";

export function useEnabledCompetitionCategories(
  competitionId: number | string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["enabled-competition-categories", competitionId],
    queryFn: () => getEnabledCompetitionCategories(competitionId as number | string),
    enabled:
      enabled &&
      competitionId !== undefined &&
      competitionId !== null &&
      competitionId !== "",
  });
}