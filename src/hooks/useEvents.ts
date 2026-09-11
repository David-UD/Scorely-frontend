import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/api/public";

export function useEvents(stageId: number | string | undefined) {
  return useQuery({
    queryKey: ["events", stageId],
    queryFn: () => getEvents(stageId as number | string),
    enabled: stageId !== undefined && stageId !== null && stageId !== "",
  });
}