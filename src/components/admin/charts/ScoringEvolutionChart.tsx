import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/admin/charts/ChartCard";
import EmptyState from "@/components/common/EmptyState";
import Spinner from "@/components/common/Spinner";
import { useAdminScoringRules } from "@/hooks/useAdminModules";

interface ScoringEvolutionChartProps {
  competitionId: number | null;
}

export default function ScoringEvolutionChart({
  competitionId,
}: ScoringEvolutionChartProps) {
  const { data: rules, isLoading } = useAdminScoringRules(competitionId);

  const data = useMemo(
    () =>
      [...(rules ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((r) => ({ name: `${r.position}º`, puntos: r.points })),
    [rules],
  );

  return (
    <ChartCard
      title="Evolución del scoring"
      subtitle="Puntos asignados por posición en la competición"
    >
      {isLoading ? (
        <Spinner label="Cargando reglas de puntuación…" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Sin reglas de puntuación"
          description="Aún no se definieron reglas de puntuación para esta competición."
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7ec" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#667085" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#667085" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e7ec",
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="puntos"
                name="Puntos"
                stroke="#465fff"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#465fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
