import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAdminAthletes,
  useDeleteAthlete,
} from "@/hooks/useAdminModules";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { formatBirthDate } from "@/utils/format";

export default function AthletesPage() {
  const navigate = useNavigate();
  const athletesQuery = useAdminAthletes();
  const deleteMutation = useDeleteAthlete();
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const athletes = [...(athletesQuery.data ?? [])].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "es"),
  );

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

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Atletas registrados en la plataforma.
        </p>
        <button
          onClick={() => navigate("/admin/athletes/new")}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Nuevo atleta
        </button>
      </div>

      {athletes.length === 0 ? (
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
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Atleta
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