import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAdminLocations, useDeleteLocation } from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { filterByName, sortByName, type SortDir } from "@/utils/sortFilter";

export default function LocationsPage() {
  const navigate = useNavigate();
  const locationsQuery = useAdminLocations();
  const deleteMutation = useDeleteLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const formatCoords = (lat?: number | string | null, lng?: number | string | null) => {
    if (lat == null || lat === "" || lng == null || lng === "") return "—";
    return `${lat}, ${lng}`;
  };

  const locations = useMemo(
    () =>
      sortByName(
        filterByName(locationsQuery.data ?? [], search, (l) => l.name),
        sortDir,
        (l) => l.name,
      ),
    [locationsQuery.data, search, sortDir],
  );

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la sede "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onError: (err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo eliminar la sede. Puede estar en uso por competiciones.",
        );
      },
      onSettled: () => setDeletingId(null),
    });
  };

  if (!isSuperUser) {
    return (
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Sedes" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Solo el superusuario puede administrar las sedes.
        </div>
      </div>
    );
  }

  if (locationsQuery.isLoading) {
    return <Spinner label="Cargando sedes…" />;
  }

  if (locationsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las sedes"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Sedes" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Catálogo de sedes (lugares donde se disputan las competiciones).
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
            onClick={() => navigate("/admin/sedes/new")}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Nueva sede
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      {locations.length === 0 && search ? (
        <EmptyState
          title="Sin coincidencias"
          description="No se encontraron sedes que coincidan con la búsqueda."
        />
      ) : locations.length === 0 ? (
        <EmptyState
          title="Sin sedes"
          description="Creá la primera sede para poder asignarla a una competición."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th
                    onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                    aria-sort={sortDir === "asc" ? "ascending" : "descending"}
                    className="cursor-pointer select-none px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase"
                  >
                    <span className="inline-flex items-center gap-1">
                      Nombre
                      <span className="text-gray-400" aria-hidden="true">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    </span>
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Dirección
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Ciudad
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Estado/Provincia
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    País
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Coordenadas
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map((location) => (
                  <tr key={location.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {location.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{location.address || "—"}</td>
                    <td className="px-5 py-4 text-gray-500">{location.city}</td>
                    <td className="px-5 py-4 text-gray-500">{location.state}</td>
                    <td className="px-5 py-4 text-gray-500">{location.country}</td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatCoords(location.latitude, location.longitude)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/sedes/${location.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(location.id, location.name)}
                          disabled={deletingId === location.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === location.id
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