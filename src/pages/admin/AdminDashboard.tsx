import { Link } from "react-router-dom";
import AthletesByAffiliationChart from "@/components/admin/charts/AthletesByAffiliationChart";
import ChartCard from "@/components/admin/charts/ChartCard";
import CompetitorsByCategoryChart from "@/components/admin/charts/CompetitorsByCategoryChart";
import ResultsByEventChart from "@/components/admin/charts/ResultsByEventChart";
import ScoringEvolutionChart from "@/components/admin/charts/ScoringEvolutionChart";
import TeamsByAffiliationChart from "@/components/admin/charts/TeamsByAffiliationChart";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import {
  useAdminAthletes,
  useAdminCompetitors,
  useAdminEvents,
  useAdminTeams,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";

export default function AdminDashboard() {
  const competitionId = useAdminScopeStore((s) => s.competitionId);

  const { data: athletes } = useAdminAthletes();
  const { data: teams } = useAdminTeams();
  const { data: competitors } = useAdminCompetitors(competitionId);
  const { data: events } = useAdminEvents(competitionId);

  const metrics = [
    { label: "Atletas", value: athletes?.length ?? 0, to: "/admin/athletes" },
    { label: "Equipos", value: teams?.length ?? 0, to: "/admin/teams" },
    { label: "Inscripciones", value: competitors?.length ?? 0, to: "/admin/competitors" },
    { label: "Eventos", value: events?.length ?? 0, to: "/admin/events" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-900">
            Panel de administración
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen general de la plataforma.
          </p>
        </div>
        <CompetitionScopeSelect />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            to={m.to}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-200 hover:shadow-theme-md"
          >
            <h2 className="text-sm font-medium text-gray-500">{m.label}</h2>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{m.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AthletesByAffiliationChart />
        <TeamsByAffiliationChart />
        <CompetitorsByCategoryChart competitionId={competitionId} />
        <ScoringEvolutionChart competitionId={competitionId} />
        <ChartCard
          title="Accesos rápidos"
          subtitle="Gestión de competiciones y configuración"
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/competitions"
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:text-brand-600"
            >
              Competiciones
            </Link>
            <Link
              to="/admin/scores"
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:text-brand-600"
            >
              Cargar resultados
            </Link>
            <Link
              to="/admin/scoring"
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:text-brand-600"
            >
              Reglas de puntuación
            </Link>
            <Link
              to="/admin/competition-categories"
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:text-brand-600"
            >
              Categorías por competición
            </Link>
          </div>
        </ChartCard>
        <div className="lg:col-span-2">
          <ResultsByEventChart competitionId={competitionId} />
        </div>
      </div>
    </div>
  );
}
