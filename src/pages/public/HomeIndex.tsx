import { useEffect, useMemo, useState } from "react";
import Tabs from "@/components/common/Tabs";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import CompetitionCard from "@/components/public/CompetitionCard";
import { useCompetitions } from "@/hooks/useCompetitions";

const TABS = [
  { key: "recientes", label: "Recientes" },
  { key: "todas", label: "Todas" },
];

export default function HomeIndex() {
  const [tab, setTab] = useState("recientes");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useCompetitions(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  );

  const competitions = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );
    return tab === "recientes" ? sorted.slice(0, 6) : sorted;
  }, [data, tab]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-title-md font-semibold text-gray-900">Competiciones</h1>
        <p className="text-sm text-gray-500">
          Resultados y leaderboards públicos de competiciones CrossFit y HYROX.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={TABS}
          activeKey={tab}
          onChange={setTab}
          ariaLabel="Listado de competiciones"
        />

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar competiciones por nombre"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:w-64"
          />
        </div>
      </div>

      {isLoading && <Spinner label="Cargando competiciones…" />}

      {isError && (
        <ErrorState
          title="No se pudieron cargar las competiciones"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && competitions.length === 0 && (
        <EmptyState
          title={search ? "Sin resultados" : "Aún no hay competiciones"}
          description={
            search
              ? `No se encontraron competiciones que coincidan con "${search}".`
              : "Cuando se publiquen competiciones aparecerán aquí."
          }
        />
      )}

      {!isLoading && !isError && competitions.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">
            {tab === "recientes" ? "Competiciones recientes" : "Todas las competiciones"}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}