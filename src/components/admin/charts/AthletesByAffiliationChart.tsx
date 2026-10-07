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
import { useAdminAffiliations, useAdminAthletes } from "@/hooks/useAdminModules";
import { countByAffiliation } from "@/utils/dashboard";

export default function AthletesByAffiliationChart() {
  const { data: athletes, isLoading } = useAdminAthletes();
  const { data: affiliations } = useAdminAffiliations();

  const data = useMemo(
    () => countByAffiliation(athletes ?? [], affiliations ?? []),
    [athletes, affiliations],
  );

  return (
    <ChartCard
      title="Atletas por afiliación"
      subtitle="Cantidad de atletas registrados por afiliación"
    >
      {isLoading ? (
        <Spinner label="Cargando atletas…" />
      ) : data.length === 0 ? (
        <EmptyState title="Sin atletas" description="Aún no hay atletas registrados." />
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
                allowDecimals={false}
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
                name="Atletas"
                fill="#465fff"
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
