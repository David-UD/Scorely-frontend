import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
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
import { fetchEventCompetitors } from "@/api/admin";
import { useAdminEvents } from "@/hooks/useAdminModules";
import { averageScore } from "@/utils/dashboard";

interface ResultsByEventChartProps {
  competitionId: number | null;
}

export default function ResultsByEventChart({ competitionId }: ResultsByEventChartProps) {
  const { data: events, isLoading } = useAdminEvents(competitionId);

  const queries = useQueries({
    queries: (events ?? []).map((e) => ({
      queryKey: ["admin", "event-competitors", e.id],
      queryFn: () => fetchEventCompetitors(e.id),
      enabled: Boolean(competitionId),
      staleTime: 30_000,
    })),
  });

  const isLoadingResults = queries.some((q) => q.isLoading);

  const data = useMemo(() => {
    return (events ?? [])
      .map((e, i) => {
        const results = queries[i]?.data ?? [];
        return {
          name: e.phase === "FINAL" ? "Final" : `WOD ${e.event_number}`,
          promedio: averageScore(results),
        };
      })
      .filter((d) => d.promedio != null);
  }, [events, queries]);

  return (
    <ChartCard
      title="Resultados por evento"
      subtitle="Puntaje promedio de los competidores con resultados cargados"
    >
      {isLoading || isLoadingResults ? (
        <Spinner label="Cargando resultados…" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Aún no hay resultados cargados en los eventos de esta competición."
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7ec" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#667085" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
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
                dataKey="promedio"
                name="Puntaje promedio"
                fill="#12b76a"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
