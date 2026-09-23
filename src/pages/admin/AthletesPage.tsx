import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Athlete } from "@/types";
import {
  useAdminAthletes,
  useDeleteAthlete,
} from "@/hooks/useAdminModules";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { formatBirthDate } from "@/utils/format";
import { filterByName, sortByName, type SortDir } from "@/utils/sortFilter";

export default function AthletesPage() {
  const navigate = useNavigate();
  const athletesQuery = useAdminAthletes();
  const deleteMutation = useDeleteAthlete();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const athleteName = (a: Athlete) => `${a.first_name} ${a.last_name}`;

  const athletes = useMemo(
    () =>
      sortByName(
        filterByName(athletesQuery.data ?? [], search, athleteName),
        sortDir,
        athleteName,
      ),
    [athletesQuery.data, search, sortDir],
  );

  if (athletesQuery.isLoading) {
    return <Spinner label="Cargando atletas…" />;
  }

  if (athletesQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los atletas"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar al atleta "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Atletas" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Atletas registrados en la plataforma.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar por nombre"
            className="w-full max-w-xs rounded-lg border border-gray-200 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 sm:w-auto"
          />
          <button
            onClick={() => navigate("/admin/athletes/new")}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Nuevo atleta
          </button>
        </div>
      </div>

      {athletes.length === 0 && search ? (
        <EmptyState
          title="Sin coincidencias"
          description="No se encontraron atletas que coincidan con la búsqueda."
        />
      ) : athletes.length === 0 ? (
        <EmptyState
          title="Sin atletas"
          description="Creá el primer atleta para después inscribirlo en una competición."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th
                    onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                    aria-sort={sortDir === "asc" ? "ascending" : "descending"}
                    className="cursor-pointer select-none px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase"
                  >
                    <span className="inline-flex items-center gap-1">
                      Atleta
                      <span className="text-gray-400" aria-hidden="true">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    </span>
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Sexo
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Fecha de nacimiento
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {athletes.map((athlete) => (
                  <tr key={athlete.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {athlete.first_name} {athlete.last_name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {athlete.gender || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatBirthDate(athlete.birth_date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/athletes/${athlete.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(
                              athlete.id,
                              `${athlete.first_name} ${athlete.last_name}`,
                            )
                          }
                          disabled={deletingId === athlete.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === athlete.id ? "Eliminando…" : "Eliminar"}
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