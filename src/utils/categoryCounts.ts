import type {
  CategoryRef,
  CompetitionCategory,
  Competitor,
  EnabledCompetitionCategory,
} from "@/types";

export interface CategoryCount {
  code: string;
  name: string;
  count: number;
}

export function buildCategoryCounts(args: {
  categories: CategoryRef[];
  enabled: EnabledCompetitionCategory[];
  catalog: CompetitionCategory[];
  competitors: Competitor[];
}): CategoryCount[] {
  const { categories, enabled, catalog, competitors } = args;

  const countsByEnabledId = new Map<number, number>();
  for (const competitor of competitors) {
    const id = competitor.enabled_competition_category;
    countsByEnabledId.set(id, (countsByEnabledId.get(id) ?? 0) + 1);
  }

  const nameById = new Map<number, string>();
  for (const category of catalog) {
    nameById.set(category.id, category.name);
  }

  const enabledIdByName = new Map<string, number>();
  for (const entry of enabled) {
    const name = nameById.get(entry.competition_category);
    if (name !== undefined && !enabledIdByName.has(name)) {
      enabledIdByName.set(name, entry.id);
    }
  }

  return categories.map((category) => {
    const enabledId = enabledIdByName.get(category.name);
    const count = enabledId !== undefined ? (countsByEnabledId.get(enabledId) ?? 0) : 0;
    return { code: category.code, name: category.name, count };
  });
}