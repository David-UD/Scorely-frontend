import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "@/components/common/StatusBadge";
import Badge from "@/components/common/Badge";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import WodList from "@/components/public/WodList";
import CombinedLeaderboardTable from "@/components/public/CombinedLeaderboardTable";
import LeaderboardFilters from "@/components/public/LeaderboardFilters";
import LocationMap from "@/components/public/LocationMap";
import { useCompetition } from "@/hooks/useCompetition";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useEvents } from "@/hooks/useEvents";
import { buildCombinedLeaderboards } from "@/utils/leaderboard";
import { formatDateRange, formatDate } from "@/utils/format";

export default function CompetitionDetail() {
  const { slug } = useParams<{ slug: string }>();

  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");

  const competitionQuery = useCompetition(slug);
  const id = competitionQuery.data?.id;

  const qualifierEventsQuery = useEvents(id, "QUALIFIER");
  const finalEventsQuery = useEvents(id, "FINAL");

  const overallQuery = useLeaderboard(id, "final");

  const qualifierWods = useMemo(
    () => (qualifierEventsQuery.data ?? []).sort((a, b) => a.event_number - b.event_number),
    [qualifierEventsQuery.data],
  );
  const finalWods = useMemo(
    () => (finalEventsQuery.data ?? []).sort((a, b) => a.event_number - b.event_number),
    [finalEventsQuery.data],
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

  return (
    <div className="flex flex-col gap-8">
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

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-title-lg font-semibold text-gray-900">{competition.name}</h1>
          <StatusBadge code={competition.status?.code ?? ""} name={competition.status?.name} />
          {competition.competition_type?.name && (
            <Badge tone="brand">{competition.competition_type.name}</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {formatDateRange(competition.start_date, competition.end_date)}
          {competition.year ? ` · ${competition.year}` : ""}
        </p>
        {competition.description && (
          <p className="max-w-3xl text-sm leading-6 text-gray-600">{competition.description}</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Información general</h2>
          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {affiliation && (
              <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
                <dt className="text-sm font-medium text-gray-500">Organizador</dt>
                <dd className="text-sm font-medium text-gray-900">
                  <span className="block">{affiliation.name}</span>
                  <span className="block text-sm font-normal text-gray-500">
                    {[affiliation.city, affiliation.state, affiliation.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </dd>
              </div>
            )}
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm font-medium text-gray-500">Inicio</dt>
              <dd className="text-sm text-gray-900">{formatDate(competition.start_date)}</dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm font-medium text-gray-500">Fin</dt>
              <dd className="text-sm text-gray-900">{formatDate(competition.end_date)}</dd>
            </div>
            {location?.name && (
              <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
                <dt className="text-sm font-medium text-gray-500">Sede</dt>
                <dd className="text-sm text-gray-900">{location.name}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Ubicación</h2>
          <LocationMap location={location} />
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Workouts</h2>
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

        {!eventsLoading && !eventsError && qualifierWods.length > 0 && (
          <WodList phaseName="Qualifier" wods={qualifierWods} />
        )}

        {!eventsLoading && !eventsError && finalWods.length > 0 && (
          <WodList phaseName="Final" wods={finalWods} />
        )}
      </section>

      <section className="flex flex-col gap-4">
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