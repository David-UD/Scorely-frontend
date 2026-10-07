import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/admin/charts/ChartCard";
import EmptyState from "@/components/common/EmptyState";
import Spinner from "@/components/common/Spinner";
import {
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
} from "@/hooks/useAdminModules";

interface CompetitorsByCategoryChartProps {
  competitionId: number | null;
}

export default function CompetitorsByCategoryChart({
  competitionId,
}: CompetitorsByCategoryChartProps) {
  const { data: competitors, isLoading } = useAdminCompetitors(competitionId);
  const { data: enabled } = useAdminEnabledCategories(competitionId);
  const { data: catalog } = useAdminCompetitionCategories();

  const data = useMemo(() => {
    const nameById = new Map((catalog ?? []).map((c) => [c.id, c.name]));
    const enabledIds = new Set((enabled ?? []).map((e) => e.competition_category));
    const counts = new Map<number, number>();
    for (const comp of competitors ?? []) {
      if (!enabledIds.has(comp.enabled_competition_category)) continue;
      const id = comp.enabled_competition_category;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ name: nameById.get(id) ?? `Categoría ${id}`, count }))
      .sort((a, b) => b.count - a.count);
  }, [competitors, enabled, catalog]);

  return (
    <ChartCard
      title="Inscripciones por categoría"
      subtitle="Cantidad de inscripciones en las categorías habilitadas de la competición"
    >
      {isLoading ? (
        <Spinner label="Cargando inscripciones…" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Sin inscripciones"
          description="Aún no hay inscripciones en las categorías habilitadas."
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e7ec" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#667085" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12, fill: "#667085" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f2f7ff" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e7ec",
                  fontSize: 13,
                }}
              />
              <Bar
                dataKey="count"
                name="Inscripciones"
                fill="#0ba5ec"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
