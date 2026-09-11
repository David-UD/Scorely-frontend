import { useQuery } from "@tanstack/react-query";
import { getCompetitionStages } from "@/api/public";

export function useCompetitionStages(
  competitionId: number | string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["competition-stages", competitionId],
    queryFn: () => getCompetitionStages(competitionId as number | string),
    enabled:
      enabled &&
      competitionId !== undefined &&
      competitionId !== null &&
      competitionId !== "",
  });
}