import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "@/components/admin/charts/ChartCard";
import EmptyState from "@/components/common/EmptyState";
import Spinner from "@/components/common/Spinner";
import { useAdminAffiliations, useAdminTeams } from "@/hooks/useAdminModules";
import { countByAffiliation } from "@/utils/dashboard";

const COLORS = ["#465fff", "#0ba5ec", "#9cb9ff", "#f79009", "#12b76a", "#f04438"];

export default function TeamsByAffiliationChart() {
  const { data: teams, isLoading } = useAdminTeams();
  const { data: affiliations } = useAdminAffiliations();

  const data = useMemo(
    () => countByAffiliation(teams ?? [], affiliations ?? []),
    [teams, affiliations],
  );

  return (
    <ChartCard
      title="Equipos por afiliación"
      subtitle="Distribución de equipos según su afiliación"
    >
      {isLoading ? (
        <Spinner label="Cargando equipos…" />
      ) : data.length === 0 ? (
        <EmptyState title="Sin equipos" description="Aún no hay equipos registrados." />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e7ec",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
