import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAdminEvents,
  useAdminStages,
  useDeleteEvent,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { stageLabel } from "@/utils/format";

export default function EventsPage() {
  const navigate = useNavigate();
  const competitionId = useAdminScopeStore((s) => s.competitionId);
  const eventsQuery = useAdminEvents(competitionId);
  const stagesQuery = useAdminStages(competitionId);
  const deleteMutation = useDeleteEvent(competitionId);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const stageNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const stage of stagesQuery.data ?? []) {
      map.set(
        stage.id,
        `${stageLabel(stage.stage_type)}${stage.order ? ` · Orden ${stage.order}` : ""}`,
      );
    }
    return map;
  }, [stagesQuery.data]);

  if (eventsQuery.isLoading || (competitionId && stagesQuery.isLoading)) {
    return <Spinner label="Cargando eventos…" />;
  }

  if (eventsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los eventos"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const events = (eventsQuery.data ?? []).sort(
    (a, b) => (stageNames.get(a.competition_stage) ?? "") < (stageNames.get(b.competition_stage) ?? "") ? -1 : 1
  );

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el evento "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Eventos" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CompetitionScopeSelect />
        <button
          onClick={() => navigate("/admin/events/new")}
          disabled={!competitionId}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          Nuevo evento
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="Sin eventos"
          description="Creá el primer evento de la competición para empezar a cargar los WODs."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Etapa
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Nº
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Nombre
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Workout
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Ascendente
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Activo
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-5 py-4 text-gray-500">
                      {stageNames.get(event.competition_stage) ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {event.event_number}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {event.name}
                    </td>
                    <td className="max-w-[260px] truncate px-5 py-4 whitespace-pre-line text-gray-500">
                      {event.workout || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {event.is_ascending ? "Sí" : "No"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {event.is_active ? "Sí" : "No"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/events/${event.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id, event.name)}
                          disabled={deletingId === event.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === event.id ? "Eliminando…" : "Eliminar"}
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