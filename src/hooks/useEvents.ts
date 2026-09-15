import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/api/public";
import type { EventPhase } from "@/types";

export function useEvents(
  competitionId: number | string | undefined,
  phase?: EventPhase,
) {
  return useQuery({
    queryKey: ["events", competitionId, phase],
    queryFn: () => getEvents(competitionId as number | string, phase),
    enabled:
      competitionId !== undefined &&
      competitionId !== null &&
      competitionId !== "",
  });
}