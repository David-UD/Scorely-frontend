import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/api/public";
import type { LeaderboardStage } from "@/types";

export function useLeaderboard(
  competitionId: number | string | undefined,
  stage: LeaderboardStage | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["leaderboard", competitionId, stage],
    queryFn: () => getLeaderboard(competitionId as number | string, stage as LeaderboardStage),
    enabled:
      enabled &&
      competitionId !== undefined &&
      competitionId !== null &&
      stage !== undefined,
  });
}