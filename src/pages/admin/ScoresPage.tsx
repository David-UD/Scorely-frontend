import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import {
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
  useAdminEventCompetitors,
  useAdminEvents,
  useAdminTeams,
  useCreateEventCompetitor,
  useDeleteEventCompetitor,
  useUpdateEventCompetitor,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Toast from "@/components/common/Toast";
import type { EventWod } from "@/types";

interface ResultEntry {
  id?: number;
  value: string;
}

function wodLabel(event: EventWod): string {
  return event.phase === "FINAL"
    ? `WOD Final — ${event.name}`
    : `WOD ${event.event_number} — ${event.name}`;
}

export default function ScoresPage() {
  const competitionId = useAdminScopeStore((s) => s.competitionId);
  const eventsQuery = useAdminEvents(competitionId);
  const competitorsQuery = useAdminCompetitors(competitionId);
  const teamsQuery = useAdminTeams();
  const athletesQuery = useAdminAthletes();
  const enabledQuery = useAdminEnabledCategories(competitionId);
  const categoriesQuery = useAdminCompetitionCategories();

  const [eventId, setEventId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [resultsMap, setResultsMap] = useState<Record<number, ResultEntry>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const resultsQuery = useAdminEventCompetitors(eventId);
  const createMutation = useCreateEventCompetitor(eventId, competitionId);
  const updateMutation = useUpdateEventCompetitor(eventId, competitionId);
  const deleteMutation = useDeleteEventCompetitor(eventId, competitionId);
  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

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

  const events = useMemo(() => {
    const phaseOrder = { QUALIFIER: 0, FINAL: 1 };
    return [...(eventsQuery.data ?? [])].sort(
      (a, b) =>
        phaseOrder[a.phase] - phaseOrder[b.phase] ||
        a.event_number - b.event_number,
    );
  }, [eventsQuery.data]);

  useEffect(() => {
    setEventId(null);
    setCategoryFilter(null);
    setResultsMap({});
    setError(null);
    setToast(null);
  }, [competitionId]);

  useEffect(() => {
    if (competitionId && eventId === null && events.length > 0) {
      setEventId(events[0].id);
    }
  }, [competitionId, eventId, events]);

  useEffect(() => {
    setResultsMap({});
    setError(null);
    setToast(null);
  }, [eventId]);

  useEffect(() => {
    if (!resultsQuery.data) return;
    const next: Record<number, ResultEntry> = {};
    for (const ec of resultsQuery.data) {
      next[ec.competitor] = { id: ec.id, value: ec.result };
    }
    setResultsMap(next);
  }, [resultsQuery.data]);

  const categoryOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const competitor of competitorsQuery.data ?? []) {
      const enabledId = competitor.enabled_competition_category;
      if (seen.has(enabledId)) continue;
      const categoryId = enabledCategoryIds.get(enabledId);
      const name = categoryId ? categoryNames.get(categoryId) : undefined;
      if (!name) continue;
      seen.set(enabledId, name);
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [competitorsQuery.data, enabledCategoryIds, categoryNames]);

  if (eventsQuery.isLoading || competitorsQuery.isLoading) {
    return <Spinner label="Cargando resultados…" />;
  }

  if (eventsQuery.isError || competitorsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los resultados"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  if (resultsQuery.isLoading) {
    return <Spinner label="Cargando resultados…" />;
  }

  if (resultsQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los resultados"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const competitors = [...(competitorsQuery.data ?? [])].sort((a, b) =>
    a.registration_number.localeCompare(b.registration_number, "es"),
  );

  const visibleCompetitors = categoryFilter
    ? competitors.filter(
        (c) => c.enabled_competition_category === categoryFilter,
      )
    : competitors;

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

  const handleChange = (competitorId: number, value: string) => {
    setResultsMap((prev) => ({
      ...prev,
      [competitorId]: { ...prev[competitorId], value },
    }));
  };

  const handleSave = async () => {
    if (!eventId) return;
    setError(null);
    setToast(null);
    try {
      for (const competitor of competitors) {
        const entry = resultsMap[competitor.id];
        const value = (entry?.value ?? "").trim();
        if (!value) {
          if (entry?.id) {
            await deleteMutation.mutateAsync(entry.id);
          }
          continue;
        }
        if (entry?.id) {
          await updateMutation.mutateAsync({
            id: entry.id,
            result: value,
          });
        } else {
          await createMutation.mutateAsync({
            competitor: competitor.id,
            event: eventId,
            result: value,
          });
        }
      }
      setToast("Resultados guardados correctamente.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron guardar los resultados. Intenta de nuevo.",
      );
    }
  };

  const gridReady = Boolean(competitionId) && Boolean(eventId);

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Resultados" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <CompetitionScopeSelect />
          <div>
            <label
              htmlFor="category-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Categoría <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <select
              id="category-filter"
              value={categoryFilter ?? ""}
              onChange={(e) =>
                setCategoryFilter(Number(e.target.value) || null)
              }
              disabled={!competitionId}
              className="w-full min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 disabled:opacity-50"
            >
              <option value="">Todas</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="event-select"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Evento (WOD)
            </label>
            <select
              id="event-select"
              value={eventId ?? ""}
              onChange={(e) =>
                setEventId(Number(e.target.value) || null)
              }
              disabled={!competitionId}
              className="w-full min-w-[260px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 disabled:opacity-50"
            >
              {!eventId && <option value="">Seleccioná un evento…</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {wodLabel(event)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={!gridReady || saving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar resultados"}
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

      {events.length === 0 ? (
        <EmptyState
          title="Sin eventos"
          description="Creá el primer evento de la competición para cargar resultados."
        />
      ) : competitors.length === 0 ? (
        <EmptyState
          title="Sin competidores"
          description="Inscribí el primer atleta o equipo de la competición para cargar resultados."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
          {visibleCompetitors.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-gray-500">
              Sin competidores en esta categoría.
            </div>
          ) : (
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
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleCompetitors.map((competitor) => {
                  const entry = resultsMap[competitor.id];
                  return (
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
                        <input
                          value={entry?.value ?? ""}
                          onChange={(e) =>
                            handleChange(competitor.id, e.target.value)
                          }
                          placeholder="Ej: 03:20 o 150"
                          aria-label={`Resultado de ${resolveCompetitorName(competitor)}`}
                          className="w-full min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}