import type { Affiliation, EventCompetitor } from "@/types";

export interface AffiliationCount {
  name: string;
  count: number;
}

export function countByAffiliation<T extends { affiliation?: number | null }>(
  items: T[],
  affiliations: Affiliation[],
): AffiliationCount[] {
  const nameById = new Map(affiliations.map((a) => [a.id, a.name]));
  const counts = new Map<string, number>();
  for (const item of items) {
    const name =
      item.affiliation != null
        ? (nameById.get(item.affiliation) ?? "Desconocida")
        : "Sin afiliación";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function averageScore(results: EventCompetitor[]): number | null {
  const scores = results
    .map((r) => r.score)
    .filter((s): s is number => s != null);
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}
