import { describe, it, expect } from "vitest";
import { averageScore, countByAffiliation } from "@/utils/dashboard";
import { makeAffiliation, makeEventCompetitor } from "./fixtures";

describe("countByAffiliation", () => {
  it("groups items by affiliation name and sorts desc", () => {
    const affiliations = [
      makeAffiliation({ id: 1, name: "Box Norte" }),
      makeAffiliation({ id: 2, name: "Box Sur" }),
    ];
    const items = [
      { id: 1, affiliation: 2 },
      { id: 2, affiliation: 1 },
      { id: 3, affiliation: 2 },
      { id: 4, affiliation: null },
    ];
    expect(countByAffiliation(items, affiliations)).toEqual([
      { name: "Box Sur", count: 2 },
      { name: "Box Norte", count: 1 },
      { name: "Sin afiliación", count: 1 },
    ]);
  });

  it("uses 'Desconocida' for affiliations missing from the catalog", () => {
    const items = [{ id: 1, affiliation: 99 }];
    expect(countByAffiliation(items, [])).toEqual([
      { name: "Desconocida", count: 1 },
    ]);
  });

  it("returns an empty array when there are no items", () => {
    expect(countByAffiliation([], [])).toEqual([]);
  });
});

describe("averageScore", () => {
  it("averages non-null scores", () => {
    const results = [
      makeEventCompetitor({ id: 1, score: 100 }),
      makeEventCompetitor({ id: 2, score: 50 }),
      makeEventCompetitor({ id: 3, score: null }),
    ];
    expect(averageScore(results)).toBe(75);
  });

  it("returns null when no score is present", () => {
    expect(averageScore([makeEventCompetitor({ score: null })])).toBeNull();
    expect(averageScore([])).toBeNull();
  });
});
