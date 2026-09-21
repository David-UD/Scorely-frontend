import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAdminAffiliations, useDeleteAffiliation } from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";

export default function AffiliationsPage() {
  const navigate = useNavigate();
  const affiliationsQuery = useAdminAffiliations();
  const deleteMutation = useDeleteAffiliation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la filiación "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onError: (err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo eliminar la filiación. Puede estar en uso por competiciones.",
        );
      },
      onSettled: () => setDeletingId(null),
    });
  };

  if (!isSuperUser) {
    return (
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Filiaciones" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Solo el superusuario puede administrar las filiaciones.
        </div>
      </div>
    );
  }

  if (affiliationsQuery.isLoading) {
    return <Spinner label="Cargando filiaciones…" />;
  }

  if (affiliationsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las filiaciones"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const affiliations = affiliationsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Filiaciones" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Catálogo de filiaciones (boxes/gimnasios) que organizan o participan en las competiciones.
        </p>
        <button
          onClick={() => navigate("/admin/affiliations/new")}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Nueva filiación
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

      {affiliations.length === 0 ? (
        <EmptyState
          title="Sin filiaciones"
          description="Creá la primera filiación para poder asignarla a una competición."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Nombre
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {affiliations.map((affiliation) => (
                  <tr key={affiliation.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {affiliation.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{affiliation.city}</td>
                    <td className="px-5 py-4 text-gray-500">{affiliation.state}</td>
                    <td className="px-5 py-4 text-gray-500">{affiliation.country}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/affiliations/${affiliation.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(affiliation.id, affiliation.name)}
                          disabled={deletingId === affiliation.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === affiliation.id
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