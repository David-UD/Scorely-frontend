import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import {
  useAdminTeams,
  useDeleteTeam,
} from "@/hooks/useAdminModules";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { filterByName, sortByName, type SortDir } from "@/utils/sortFilter";

export default function TeamsPage() {
  const navigate = useNavigate();
  const teamsQuery = useAdminTeams();
  const deleteMutation = useDeleteTeam();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [error, setError] = useState<string | null>(null);

  const teams = useMemo(
    () =>
      sortByName(
        filterByName(teamsQuery.data ?? [], search, (t) => t.name),
        sortDir,
        (t) => t.name,
      ),
    [teamsQuery.data, search, sortDir],
  );

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

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el equipo "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onError: (err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo eliminar el equipo.",
        );
      },
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Equipos" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar por nombre"
          className="w-full max-w-xs rounded-lg border border-gray-200 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 sm:w-auto"
        />
        <button
          onClick={() => navigate("/admin/teams/new")}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Nuevo equipo
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

      {teams.length === 0 && search ? (
        <EmptyState
          title="Sin coincidencias"
          description="No se encontraron equipos que coincidan con la búsqueda."
        />
      ) : teams.length === 0 ? (
        <EmptyState
          title="Sin equipos"
          description="Creá el primer equipo para después inscribirlo en una competición."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th
                    onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                    aria-sort={sortDir === "asc" ? "ascending" : "descending"}
                    className="cursor-pointer select-none px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase"
                  >
                    <span className="inline-flex items-center gap-1">
                      Equipo
                      <span className="text-gray-400" aria-hidden="true">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    </span>
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