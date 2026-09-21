import { useQuery } from "@tanstack/react-query";
import { getCompetitors } from "@/api/public";

export function useCompetitors(
  competitionId: number | string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["competitors", competitionId],
    queryFn: () => getCompetitors(competitionId as number | string),
    enabled:
      enabled &&
      competitionId !== undefined &&
      competitionId !== null &&
      competitionId !== "",
  });
}