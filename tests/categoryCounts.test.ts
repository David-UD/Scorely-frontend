import { describe, it, expect } from "vitest";
import { buildCategoryCounts } from "@/utils/categoryCounts";
import {
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
} from "./fixtures";

describe("buildCategoryCounts", () => {
  it("counts competitors per category joining by name (catalog → enabled)", () => {
    const catalog = [
      makeCompetitionCategory({ id: 1, name: "RX Individual" }),
      makeCompetitionCategory({ id: 2, name: "Scaled" }),
    ];
    const enabled = [
      makeEnabledCompetitionCategory({
        id: 10,
        competition: 1,
        competition_category: 1,
      }),
      makeEnabledCompetitionCategory({
        id: 20,
        competition: 1,
        competition_category: 2,
      }),
    ];
    const competitors = [
      makeCompetitor({ enabled_competition_category: 10 }),
      makeCompetitor({ id: 2, enabled_competition_category: 10 }),
      makeCompetitor({ id: 3, enabled_competition_category: 20 }),
    ];

    const result = buildCategoryCounts({
      categories: [
        { code: "rx-individual", name: "RX Individual" },
        { code: "scaled", name: "Scaled" },
      ],
      enabled,
      catalog,
      competitors,
    });

    expect(result).toEqual([
      { code: "rx-individual", name: "RX Individual", count: 2 },
      { code: "scaled", name: "Scaled", count: 1 },
    ]);
  });

  it("preserves the order of the leaderboard categories", () => {
    const catalog = [makeCompetitionCategory({ id: 1, name: "RX" })];
    const enabled = [
      makeEnabledCompetitionCategory({ id: 10, competition: 1, competition_category: 1 }),
    ];
    const competitors = [makeCompetitor({ enabled_competition_category: 10 })];

    const result = buildCategoryCounts({
      categories: [
        { code: "scaled", name: "Scaled" },
        { code: "rx", name: "RX" },
      ],
      enabled,
      catalog,
      competitors,
    });

    expect(result.map((r) => r.name)).toEqual(["Scaled", "RX"]);
  });

  it("returns 0 for a category without a match (name not in catalog)", () => {
    const catalog = [makeCompetitionCategory({ id: 1, name: "RX" })];
    const enabled = [
      makeEnabledCompetitionCategory({ id: 10, competition: 1, competition_category: 1 }),
    ];
    const competitors = [makeCompetitor({ enabled_competition_category: 10 })];

    const result = buildCategoryCounts({
      categories: [{ code: "scaled", name: "Scaled" }],
      enabled,
      catalog,
      competitors,
    });

    expect(result).toEqual([{ code: "scaled", name: "Scaled", count: 0 }]);
  });

  it("returns 0 for an enabled category with no competitors", () => {
    const catalog = [makeCompetitionCategory({ id: 1, name: "RX" })];
    const enabled = [
      makeEnabledCompetitionCategory({ id: 10, competition: 1, competition_category: 1 }),
    ];

    const result = buildCategoryCounts({
      categories: [{ code: "rx", name: "RX" }],
      enabled,
      catalog,
      competitors: [],
    });

    expect(result).toEqual([{ code: "rx", name: "RX", count: 0 }]);
  });
});