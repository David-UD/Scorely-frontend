import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAdminCompetitions,
  useDeleteCompetition,
} from "@/hooks/useAdminCompetitions";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDateRange } from "@/utils/format";

export default function CompetitionsPage() {
  const navigate = useNavigate();
  const competitionsQuery = useAdminCompetitions();
  const deleteMutation = useDeleteCompetition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));

  if (competitionsQuery.isLoading) {
    return <Spinner label="Cargando competiciones…" />;
  }

  if (competitionsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las competiciones"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const competitions = competitionsQuery.data ?? [];

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la competición "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isSuperUser ? "Competiciones" : "Mis competiciones"}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isSuperUser
            ? "Administrá todas las competiciones de la plataforma."
            : "Estas son las competiciones que tenés asignadas."}
        </p>
        {isSuperUser && (
          <button
            onClick={() => navigate("/admin/competitions/new")}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Nueva competición
          </button>
        )}
      </div>

      {competitions.length === 0 ? (
        <EmptyState
          title={isSuperUser ? "Sin competiciones" : "Sin competiciones asignadas"}
          description={
            isSuperUser
              ? "Crea la primera competición para empezar a cargar categorías, etapas, eventos y participantes."
              : "Ponete en contacto con el superusuario para que te asigne una competición."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Nombre
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Tipo
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Estado
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Sede
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Fechas
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {competitions.map((competition) => (
                  <tr key={competition.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {competition.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {competition.competition_type.name}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        code={competition.status.code}
                        name={competition.status.name}
                      />
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {competition.location?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatDateRange(competition.start_date, competition.end_date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/competitions/${competition.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        {isSuperUser && (
                          <button
                            onClick={() => handleDelete(competition.id, competition.name)}
                            disabled={deletingId === competition.id}
                            className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                          >
                            {deletingId === competition.id
                              ? "Eliminando…"
                              : "Eliminar"}
                          </button>
                        )}
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