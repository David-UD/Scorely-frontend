import { useQuery } from "@tanstack/react-query";
import { getCompetition } from "@/api/public";

export function useCompetition(id: number | string | undefined) {
  return useQuery({
    queryKey: ["competition", id],
    queryFn: () => getCompetition(id as number | string),
    enabled: id !== undefined && id !== null && id !== "",
  });
}