import { describe, it, expect } from "vitest";
import { makeLeaderboard, makeEventResult } from "./fixtures";
import { buildCombinedLeaderboards } from "@/utils/leaderboard";

describe("buildCombinedLeaderboards", () => {
  it("mapea entradas del overall con event_results y total aditivo", () => {
    const combined = buildCombinedLeaderboards([
      makeLeaderboard({
        category: { code: "rx", name: "RX" },
        entries: [
          {
            rank: 1,
            competitor_id: 10,
            display_name: "Ana",
            final_score: "500",
            event_ranks: [1, 2, 3, 4, 1],
            event_scores: [100, 100, 100, 100, 100],
            event_results: [
              ...Array.from({ length: 4 }, (_, i) =>
                makeEventResult({ event_id: i + 1, event_number: i + 1, phase: "QUALIFIER", score: 100, result: "03:00" }),
              ),
              makeEventResult({ event_id: 5, event_number: 5, phase: "FINAL", score: 100, result: "04:00" }),
            ],
          },
        ],
      }),
    ]);

    expect(combined).toHaveLength(1);
    const [lb] = combined;
    expect(lb.category.code).toBe("rx");

    const ana = lb.entries[0];
    expect(ana.display_name).toBe("Ana");
    expect(ana.rank).toBe(1);
    expect(ana.total_score).toBe(500);
    expect(ana.qualified).toBe(true);
    expect(ana.event_results).toHaveLength(5);
  });

  it("marca como no finalista (qualified false) a quien no tiene resultados FINAL", () => {
    const combined = buildCombinedLeaderboards([
      makeLeaderboard({
        category: { code: "rx", name: "RX" },
        entries: [
          {
            rank: 1,
            competitor_id: 30,
            display_name: "Pedro",
            final_score: "350",
            event_ranks: [2, 3, 4, 5],
            event_scores: [100, 100, 100, 50],
            event_results: [
              ...Array.from({ length: 4 }, (_, i) =>
                makeEventResult({ event_id: i + 1, event_number: i + 1, phase: "QUALIFIER", score: 100, result: null }),
              ),
            ],
          },
        ],
      }),
    ]);

    const [lb] = combined;
    const pedro = lb.entries[0];
    expect(pedro.qualified).toBe(false);
    expect(pedro.total_score).toBe(350);
  });

  it("conserva categorías y mantiene el orden del backend", () => {
    const combined = buildCombinedLeaderboards([
      makeLeaderboard({ category: { code: "scaled", name: "Scaled" }, entries: [] }),
      makeLeaderboard({ category: { code: "rx", name: "RX" }, entries: [] }),
    ]);

    expect(combined.map((lb) => lb.category.code)).toEqual(["scaled", "rx"]);
  });

  it("tolera entradas sin event_results", () => {
    const combined = buildCombinedLeaderboards([
      makeLeaderboard({
        category: { code: "rx", name: "RX" },
        entries: [
          {
            rank: 1,
            competitor_id: 1,
            display_name: "Ana",
            final_score: "100",
            event_ranks: [1],
            event_scores: [100],
          },
        ],
      }),
    ]);

    const [lb] = combined;
    expect(lb.entries[0].event_results).toEqual([]);
    expect(lb.entries[0].qualified).toBe(false);
    expect(lb.entries[0].total_score).toBe(100);
  });

  it("devuelve lista vacía cuando no hay leaderboard", () => {
    expect(buildCombinedLeaderboards([])).toEqual([]);
  });
});