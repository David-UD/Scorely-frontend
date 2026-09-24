import StatusBadge from "@/components/common/StatusBadge";
import Badge from "@/components/common/Badge";
import { formatDateRange } from "@/utils/format";
import type { Competition } from "@/types";

interface CompetitionHeroProps {
  competition: Competition;
  stats: {
    athletes: number | null;
    categories: number;
    wods: number;
  };
}

function formatStat(value: number | null): string {
  return value === null || value === undefined ? "—" : String(value);
}

const STAT_CARDS: { key: keyof CompetitionHeroProps["stats"]; label: string }[] = [
  { key: "athletes", label: "Atletas" },
  { key: "categories", label: "Categorías" },
  { key: "wods", label: "WODs" },
];

export default function CompetitionHero({ competition, stats }: CompetitionHeroProps) {
  const city =
    competition.location?.city || competition.affiliation?.city || undefined;

  return (
    <section
      aria-label="Información de la competición"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:p-8"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-title-md font-semibold text-gray-900 sm:text-title-lg">
            {competition.name}
          </h1>
          <StatusBadge code={competition.status?.code ?? ""} name={competition.status?.name} />
          {competition.competition_type?.name && (
            <Badge tone="brand">{competition.competition_type.name}</Badge>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {[city, formatDateRange(competition.start_date, competition.end_date)]
            .filter(Boolean)
            .join(" · ")}
          {competition.year ? ` · ${competition.year}` : ""}
        </p>

        {competition.description && (
          <p className="max-w-3xl text-sm leading-6 text-gray-600">
            {competition.description}
          </p>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {STAT_CARDS.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="text-title-sm font-semibold text-gray-900">
              {formatStat(stats[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}