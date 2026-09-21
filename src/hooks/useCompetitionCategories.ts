import { useQuery } from "@tanstack/react-query";
import { getCompetitionCategories } from "@/api/public";

export function useCompetitionCategories(enabled = true) {
  return useQuery({
    queryKey: ["competition-categories"],
    queryFn: getCompetitionCategories,
    enabled,
  });
}