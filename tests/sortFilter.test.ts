import { describe, it, expect } from "vitest";
import {
  normalizeText,
  filterByName,
  sortByName,
} from "@/utils/sortFilter";

describe("normalizeText", () => {
  it("lowercases, trims and removes accents", () => {
    expect(normalizeText("  Atlético ÁB  ")).toBe("atletico ab");
  });
});

describe("filterByName", () => {
  const items = [
    { id: 1, name: "Atlético" },
    { id: 2, name: "Box Barcelona" },
    { id: 3, name: "Hyrox" },
  ];

  it("returns the original array when query is empty", () => {
    expect(filterByName(items, "   ", (i) => i.name)).toBe(items);
  });

  it("filters case and accent insensitive", () => {
    const result = filterByName(items, "ATLETICO", (i) => i.name);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe("sortByName", () => {
  const items = [
    { id: 1, name: "néstor" },
    { id: 2, name: "Ana" },
    { id: 3, name: "Bravo" },
  ];

  it("sorts ascending using es locale", () => {
    const result = sortByName(items, "asc", (i) => i.name);
    expect(result.map((i) => i.name)).toEqual(["Ana", "Bravo", "néstor"]);
  });

  it("sorts descending", () => {
    const result = sortByName(items, "desc", (i) => i.name);
    expect(result.map((i) => i.name)).toEqual(["néstor", "Bravo", "Ana"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...items];
    sortByName(items, "desc", (i) => i.name);
    expect(items).toEqual(copy);
  });
});