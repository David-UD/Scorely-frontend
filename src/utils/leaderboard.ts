import type {
  CombinedLeaderboard,
  CombinedLeaderboardEntry,
  EventResult,
  Leaderboard,
} from "@/types";

/**
 * Construye el leaderboard unificado por categoría a partir del leaderboard
 * overall (endpoint `/final/`), que ya trae todos los eventos con su `phase`.
 *
 * Modelo de puntuación aditivo: `entry.final_score` es la suma de los puntos
 * de todas las fases. Un atleta es considerado **finalista** si tiene al menos
 * un resultado en un evento de fase FINAL; de lo contrario sus celdas de la
 * fase final y su total se renderizan como `-`.
 */
export function buildCombinedLeaderboards(
  overall: Leaderboard[],
): CombinedLeaderboard[] {
  return overall.map((leaderboard) => ({
    category: leaderboard.category,
    entries: (leaderboard.entries ?? []).map(
      (entry): CombinedLeaderboardEntry => {
        const eventResults: EventResult[] = entry.event_results ?? [];
        const qualified = eventResults.some(
          (r) => r.phase === "FINAL" && r.score != null,
        );
        return {
          rank: entry.rank,
          competitor_id: entry.competitor_id,
          display_name: entry.display_name,
          event_results: eventResults,
          total_score: toNumber(entry.final_score),
          qualified,
        };
      },
    ),
  }));
}

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}