import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import StatusBadge from "@/components/common/StatusBadge";
import Badge from "@/components/common/Badge";
import Tabs from "@/components/common/Tabs";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import WodList from "@/components/public/WodList";
import LeaderboardTable from "@/components/public/LeaderboardTable";
import LeaderboardFilters from "@/components/public/LeaderboardFilters";
import LocationMap from "@/components/public/LocationMap";
import { useCompetition } from "@/hooks/useCompetition";
import { useCompetitionStages } from "@/hooks/useCompetitionStages";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getEvents } from "@/api/public";
import type { CompetitionStage, EventWod, LeaderboardStage } from "@/types";
import { formatDateRange, formatDate } from "@/utils/format";

const STAGE_TABS: { key: LeaderboardStage; label: string }[] = [
  { key: "qualifier", label: "Qualifier" },
  { key: "final", label: "Final" },
];

function pickStageFor(
  stages: CompetitionStage[],
  leaderboardStage: LeaderboardStage,
): CompetitionStage | undefined {
  const needle = leaderboardStage === "qualifier" ? /qual/i : /final/i;
  return stages.find((stage) => needle.test(`${stage.name ?? ""} ${stage.code ?? ""}`));
}

function stageLabel(stage: CompetitionStage): string {
  if (stage.name) return stage.name;
  if (stage.code === "qualifier") return "Qualifier";
  if (stage.code === "final") return "Final";
  return stage.code || "Etapa";
}

export default function CompetitionDetail() {
  const { slug } = useParams<{ slug: string }>();

  const [stageTab, setStageTab] = useState<LeaderboardStage>("qualifier");
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");

  const competitionQuery = useCompetition(slug);
  const id = competitionQuery.data?.id;
  const stagesQuery = useCompetitionStages(id, Boolean(id));
  const stages = useMemo(() => stagesQuery.data ?? [], [stagesQuery.data]);

  const eventQueries = useQueries({
    queries: (stages.length > 0 ? stages : []).map((stage) => ({
      queryKey: ["events", stage.id, "detail"],
      queryFn: () => getEvents(stage.id),
    })),
  });

  const eventsByStage = useMemo(() => {
    const map = new Map<number, EventWod[]>();
    stages.forEach((stage, index) => map.set(stage.id, eventQueries[index]?.data ?? []));
    return map;
  }, [stages, eventQueries]);

  const qualifierQuery = useLeaderboard(id, "qualifier");
  const finalQuery = useLeaderboard(id, "final");
  const activeLeaderboardQuery = stageTab === "qualifier" ? qualifierQuery : finalQuery;

  const leaderboards = useMemo(() => {
    const data = activeLeaderboardQuery.data ?? [];
    return data.filter((lb) => lb.category);
  }, [activeLeaderboardQuery.data]);

  const categories = useMemo(
    () => leaderboards.map((lb) => lb.category),
    [leaderboards],
  );

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.code === selectedCategoryCode)) {
      setSelectedCategoryCode(categories[0].code);
    }
  }, [categories, selectedCategoryCode]);

  const selectedLeaderboard = leaderboards.find(
    (lb) => lb.category.code === selectedCategoryCode,
  );

  const activeStage = pickStageFor(stages, stageTab);
  const activeWods = activeStage ? eventsByStage.get(activeStage.id) ?? [] : [];

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
        {stagesQuery.isLoading && <Spinner label="Cargando etapas…" />}
        {stagesQuery.isError && (
          <ErrorState
            title="No se pudieron cargar las etapas"
            message={
              stagesQuery.error instanceof Error ? stagesQuery.error.message : undefined
            }
            onRetry={() => stagesQuery.refetch()}
          />
        )}
        {!stagesQuery.isLoading &&
          !stagesQuery.isError &&
          stages.length === 0 && (
            <EmptyState
              title="Sin etapas"
              description="Esta competición todavía no tiene etapas publicadas."
            />
          )}
        {stages.length > 0 &&
          stages.map((stage, index) => {
            const query = eventQueries[index];
            if (query?.isLoading) {
              return (
                <Spinner key={stage.id} label={`Cargando workouts de ${stageLabel(stage)}…`} />
              );
            }
            if (query?.isError) {
              return (
                <ErrorState
                  key={stage.id}
                  title={`No se pudieron cargar los workouts de ${stageLabel(stage)}`}
                  onRetry={() => query.refetch()}
                />
              );
            }
            return (
              <WodList
                key={stage.id}
                stageName={stageLabel(stage)}
                wods={eventsByStage.get(stage.id) ?? []}
              />
            );
          })}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
          <Tabs
            tabs={STAGE_TABS}
            activeKey={stageTab}
            onChange={(key) => setStageTab(key as LeaderboardStage)}
            ariaLabel="Etapa del leaderboard"
          />
        </div>

        {activeLeaderboardQuery.isLoading && <Spinner label="Cargando leaderboard…" />}

        {activeLeaderboardQuery.isError && (
          <ErrorState
            title="No se pudo cargar el leaderboard"
            message={
              activeLeaderboardQuery.error instanceof Error
                ? activeLeaderboardQuery.error.message
                : undefined
            }
            onRetry={() => activeLeaderboardQuery.refetch()}
          />
        )}

        {!activeLeaderboardQuery.isLoading &&
          !activeLeaderboardQuery.isError &&
          categories.length > 0 && (
            <LeaderboardFilters
              categories={categories}
              selectedCategoryCode={selectedCategoryCode}
              onChange={setSelectedCategoryCode}
            />
          )}

        {!activeLeaderboardQuery.isLoading &&
          !activeLeaderboardQuery.isError &&
          selectedLeaderboard && (
            <LeaderboardTable
              title={`${selectedLeaderboard.category.name}`}
              entries={selectedLeaderboard.entries}
              wods={activeWods}
            />
          )}

        {!activeLeaderboardQuery.isLoading &&
          !activeLeaderboardQuery.isError &&
          leaderboards.length === 0 && (
            <EmptyState
              title="Leaderboard sin resultados"
              description="Todavía no hay leaderboard publicado para esta etapa."
            />
          )}
      </section>
    </div>
  );
}