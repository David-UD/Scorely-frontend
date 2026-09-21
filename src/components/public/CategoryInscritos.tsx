import { useMemo } from "react";
import Spinner from "@/components/common/Spinner";
import Badge from "@/components/common/Badge";
import type { CategoryRef } from "@/types";
import { useEnabledCompetitionCategories } from "@/hooks/useEnabledCompetitionCategories";
import { useCompetitionCategories } from "@/hooks/useCompetitionCategories";
import { useCompetitors } from "@/hooks/useCompetitors";
import { buildCategoryCounts } from "@/utils/categoryCounts";

interface CategoryInscritosProps {
  competitionId: number;
  categories: CategoryRef[];
}

export default function CategoryInscritos({
  competitionId,
  categories,
}: CategoryInscritosProps) {
  const enabledQuery = useEnabledCompetitionCategories(competitionId);
  const catalogQuery = useCompetitionCategories();
  const competitorsQuery = useCompetitors(competitionId);

  const counts = useMemo(() => {
    if (!enabledQuery.data || !catalogQuery.data || !competitorsQuery.data) {
      return [];
    }
    return buildCategoryCounts({
      categories,
      enabled: enabledQuery.data,
      catalog: catalogQuery.data,
      competitors: competitorsQuery.data,
    });
  }, [categories, enabledQuery.data, catalogQuery.data, competitorsQuery.data]);

  if (categories.length === 0) return null;

  const failed =
    enabledQuery.isError || catalogQuery.isError || competitorsQuery.isError;
  if (failed) return null;

  if (enabledQuery.isLoading || catalogQuery.isLoading || competitorsQuery.isLoading) {
    return (
      <section className="flex flex-col gap-4" aria-label="Categorías e inscritos">
        <h2 className="text-lg font-semibold text-gray-900">Categorías e inscritos</h2>
        <Spinner label="Cargando inscritos…" />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Categorías e inscritos">
      <h2 className="text-lg font-semibold text-gray-900">Categorías e inscritos</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((item) => (
          <li
            key={item.code}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-theme-xs"
          >
            <span className="text-sm font-medium text-gray-800">{item.name}</span>
            <Badge tone="brand">
              {item.count} {item.count === 1 ? "inscrito" : "inscritos"}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}