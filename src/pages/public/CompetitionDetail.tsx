import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Toast from "@/components/common/Toast";
import CompetitionHero from "@/components/public/CompetitionHero";
import WodList from "@/components/public/WodList";
import CombinedLeaderboardTable from "@/components/public/CombinedLeaderboardTable";
import LeaderboardFilters from "@/components/public/LeaderboardFilters";
import LocationMap from "@/components/public/LocationMap";
import CategoryInscritos from "@/components/public/CategoryInscritos";
import { useCompetition } from "@/hooks/useCompetition";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useEvents } from "@/hooks/useEvents";
import { useCompetitors } from "@/hooks/useCompetitors";
import { buildCombinedLeaderboards } from "@/utils/leaderboard";
import { formatDateRange } from "@/utils/format";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

function InfoRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-gray-900">
          {value}
          {sub && <span className="block text-sm font-normal text-gray-500">{sub}</span>}
        </dd>
      </div>
    </div>
  );
}

export default function CompetitionDetail() {
  const { slug } = useParams<{ slug: string }>();

  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const competitionQuery = useCompetition(slug);
  const id = competitionQuery.data?.id;

  const qualifierEventsQuery = useEvents(id, "QUALIFIER");
  const finalEventsQuery = useEvents(id, "FINAL");

  const overallQuery = useLeaderboard(id, "final");

  const competitorsQuery = useCompetitors(id);

  const qualifierWods = useMemo(
    () => (qualifierEventsQuery.data ?? []).sort((a, b) => a.event_number - b.event_number),
    [qualifierEventsQuery.data],
  );
  const finalWods = useMemo(
    () => (finalEventsQuery.data ?? []).sort((a, b) => a.event_number - b.event_number),
    [finalEventsQuery.data],
  );

  const allWods = useMemo(
    () =>
      [...qualifierWods, ...finalWods].sort(
        (a, b) =>
          (a.phase === "FINAL" ? 1 : 0) - (b.phase === "FINAL" ? 1 : 0) ||
          a.event_number - b.event_number,
      ),
    [qualifierWods, finalWods],
  );

  const activeWods = useMemo(
    () => allWods.filter((wod) => wod.is_active !== false),
    [allWods],
  );

  const combinedLeaderboards = useMemo(
    () =>
      buildCombinedLeaderboards(
        (overallQuery.data ?? []).filter((lb) => lb.category),
      ),
    [overallQuery.data],
  );

  const categories = useMemo(
    () => combinedLeaderboards.map((lb) => lb.category),
    [combinedLeaderboards],
  );

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.code === selectedCategoryCode)) {
      setSelectedCategoryCode(categories[0].code);
    }
  }, [categories, selectedCategoryCode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedCombinedLeaderboard = combinedLeaderboards.find(
    (lb) => lb.category.code === selectedCategoryCode,
  );

  const eventsLoading = qualifierEventsQuery.isLoading || finalEventsQuery.isLoading;
  const eventsError = qualifierEventsQuery.isError || finalEventsQuery.isError;
  const eventsErrorObject = qualifierEventsQuery.isError
    ? qualifierEventsQuery.error
    : finalEventsQuery.error;

  const leaderboardLoading = overallQuery.isLoading;
  const leaderboardError = overallQuery.isError;

  if (competitionQuery.isLoading) {
    return <Spinner label="Cargando competición…" />;
  }

  if (competitionQuery.isError || !competitionQuery.data) {
    return (
      <ErrorState
        title="No se pudo cargar la competición"
        message={
          competitionQuery.error instanceof Error
            ? competitionQuery.error.message
            : undefined
        }
        onRetry={() => competitionQuery.refetch()}
      />
    );
  }

  const competition = competitionQuery.data;
  const affiliation = competition.affiliation;
  const location = competition.location;

  const stats = {
    athletes: competitorsQuery.data?.length ?? null,
    categories: categories.length,
    wods: activeWods.length,
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Enlace copiado.");
    } catch {
      setToast("No se pudo copiar el enlace.");
    }
  };

  return (
    <div className="flex flex-col gap-12">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M19 12H5m6-6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver a competiciones
      </Link>

      <CompetitionHero competition={competition} stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => scrollToId("workouts")}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Ver Workouts
        </button>
        <button
          type="button"
          onClick={() => scrollToId("leaderboard")}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Ver Leaderboard
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Compartir
        </button>
      </div>

      <section id="info" className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Información general</h2>
            <dl className="flex flex-1 flex-col justify-between divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {affiliation && (
                <InfoRow
                  label="Organizador"
                  value={affiliation.name}
                  sub={[affiliation.city, affiliation.state, affiliation.country]
                    .filter(Boolean)
                    .join(", ")}
                  icon={
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                      <circle cx="9.5" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
                    </svg>
                  }
                />
              )}
              {location?.name && (
                <InfoRow
                  label="Sede"
                  value={location.name}
                  icon={
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  }
                />
              )}
              <InfoRow
                label="Fecha"
                value={formatDateRange(competition.start_date, competition.end_date)}
                icon={
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" strokeLinecap="round" />
                  </svg>
                }
              />
            </dl>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Ubicación</h2>
            <div className="flex flex-1 flex-col">
              <LocationMap location={location} className="h-full" />
            </div>
          </div>
        </div>
      </section>

      {id !== undefined && categories.length > 0 && (
        <section id="categorias" className="flex flex-col gap-4">
          <CategoryInscritos competitionId={id} categories={categories} />
        </section>
      )}

      <section id="workouts" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Workouts</h2>
          {allWods.length > 0 && (
            <div
              role="img"
              aria-label={`${activeWods.length} de ${allWods.length} eventos activos`}
              className="flex items-center gap-1.5"
            >
              {allWods.map((wod) => (
                <span
                  key={wod.id}
                  aria-hidden="true"
                  className={wod.is_active !== false ? "text-brand-500" : "text-gray-300"}
                >
                  {wod.is_active !== false ? "●" : "○"}
                </span>
              ))}
            </div>
          )}
        </div>

        {eventsLoading && <Spinner label="Cargando workouts…" />}

        {eventsError && (
          <ErrorState
            title="No se pudieron cargar los workouts"
            message={
              eventsErrorObject instanceof Error ? eventsErrorObject.message : undefined
            }
            onRetry={() => {
              qualifierEventsQuery.refetch();
              finalEventsQuery.refetch();
            }}
          />
        )}

        {!eventsLoading &&
          !eventsError &&
          qualifierWods.length === 0 &&
          finalWods.length === 0 && (
            <EmptyState
              title="Sin eventos"
              description="Esta competición todavía no tiene eventos publicados."
            />
          )}

        {!eventsLoading && !eventsError && activeWods.length > 0 && (
          <>
            {qualifierWods.length > 0 && (
              <WodList phaseName="Qualifier" wods={qualifierWods} />
            )}
            {finalWods.length > 0 && (
              <WodList phaseName="Final" wods={finalWods} />
            )}
          </>
        )}
      </section>

      <section id="leaderboard" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>

        {leaderboardLoading && <Spinner label="Cargando leaderboard…" />}

        {leaderboardError && (
          <ErrorState
            title="No se pudo cargar el leaderboard"
            message={
              overallQuery.error instanceof Error ? overallQuery.error.message : undefined
            }
            onRetry={() => overallQuery.refetch()}
          />
        )}

        {!leaderboardLoading &&
          !leaderboardError &&
          categories.length > 0 && (
            <LeaderboardFilters
              categories={categories}
              selectedCategoryCode={selectedCategoryCode}
              onChange={setSelectedCategoryCode}
            />
          )}

        {!leaderboardLoading && !leaderboardError && selectedCombinedLeaderboard && (
          <CombinedLeaderboardTable
            title={selectedCombinedLeaderboard.category.name}
            entries={selectedCombinedLeaderboard.entries}
            qualifierWods={qualifierWods}
            finalWods={finalWods}
          />
        )}

        {!leaderboardLoading && !leaderboardError && combinedLeaderboards.length === 0 && (
          <EmptyState
            title="Leaderboard sin resultados"
            description="Todavía no hay leaderboard publicado para esta competición."
          />
        )}
      </section>
    </div>
  );
}