import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";
import {
  useAdminTeams,
  useDeleteTeam,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";

export default function TeamsPage() {
  const navigate = useNavigate();
  const competitionId = useAdminScopeStore((s) => s.competitionId);
  const teamsQuery = useAdminTeams(competitionId);
  const deleteMutation = useDeleteTeam(competitionId);
  const competitionsQuery = useAdminCompetitions();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const competitionNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of competitionsQuery.data ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [competitionsQuery.data]);

  if (teamsQuery.isLoading) {
    return <Spinner label="Cargando equipos…" />;
  }

  if (teamsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los equipos"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const teams = [...(teamsQuery.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el equipo "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Equipos" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CompetitionScopeSelect />
        <button
          onClick={() => navigate("/admin/teams/new")}
          disabled={!competitionId}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          Nuevo equipo
        </button>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="Sin equipos"
          description="Creá el primer equipo de la competición para después inscribirlo."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Equipo
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Competición
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {team.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {competitionNames.get(team.competition) ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/teams/${team.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(team.id, team.name)}
                          disabled={deletingId === team.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === team.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}