import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import {
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
  useAdminTeams,
  useDeleteCompetitor,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";

export default function CompetitorsPage() {
  const navigate = useNavigate();
  const competitionId = useAdminScopeStore((s) => s.competitionId);
  const competitorsQuery = useAdminCompetitors(competitionId);
  const teamsQuery = useAdminTeams();
  const athletesQuery = useAdminAthletes();
  const enabledQuery = useAdminEnabledCategories(competitionId);
  const categoriesQuery = useAdminCompetitionCategories();
  const deleteMutation = useDeleteCompetitor(competitionId);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const athleteNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const a of athletesQuery.data ?? []) {
      map.set(a.id, `${a.first_name} ${a.last_name}`);
    }
    return map;
  }, [athletesQuery.data]);

  const teamNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const team of teamsQuery.data ?? []) {
      map.set(team.id, team.name);
    }
    return map;
  }, [teamsQuery.data]);

  const enabledCategoryIds = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of enabledQuery.data ?? []) {
      map.set(e.id, e.competition_category);
    }
    return map;
  }, [enabledQuery.data]);

  const categoryNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categoriesQuery.data ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categoriesQuery.data]);

  if (competitorsQuery.isLoading) {
    return <Spinner label="Cargando competidores…" />;
  }

  if (competitorsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los competidores"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const competitors = [...(competitorsQuery.data ?? [])].sort((a, b) =>
    a.registration_number.localeCompare(b.registration_number, "es"),
  );

  const resolveCompetitorName = (competitor: (typeof competitors)[number]): string => {
    if (competitor.competitor_type === "INDIVIDUAL") {
      if (competitor.athlete) return athleteNames.get(competitor.athlete) ?? "—";
    } else if (competitor.team) {
      return teamNames.get(competitor.team) ?? "—";
    }
    return "—";
  };

  const resolveCategoryName = (competitor: (typeof competitors)[number]): string => {
    const categoryId = enabledCategoryIds.get(
      competitor.enabled_competition_category,
    );
    if (!categoryId) return "—";
    return categoryNames.get(categoryId) ?? "—";
  };

  const handleDelete = (id: number, registrationNumber: string) => {
    if (
      !window.confirm(
        `¿Eliminar la inscripción "${registrationNumber}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onError: (err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo eliminar la inscripción. Puede estar en uso por competiciones.",
        );
      },
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Competidores" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CompetitionScopeSelect />
        <button
          onClick={() => navigate("/admin/competitors/new")}
          disabled={!competitionId}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          Nuevo competidor
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      {competitors.length === 0 ? (
        <EmptyState
          title="Sin competidores"
          description="Inscribí el primer atleta o equipo de la competición para verlo acá."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Nº inscripción
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Competidor
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Tipo
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Categoría
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {competitors.map((competitor) => (
                  <tr key={competitor.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {competitor.registration_number}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {resolveCompetitorName(competitor)}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {competitor.competitor_type === "INDIVIDUAL"
                        ? "Individual"
                        : "Equipo"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {resolveCategoryName(competitor)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/competitors/${competitor.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(
                              competitor.id,
                              competitor.registration_number,
                            )
                          }
                          disabled={deletingId === competitor.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === competitor.id
                            ? "Eliminando…"
                            : "Eliminar"}
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