import { Link } from "react-router-dom";
import StatusBadge from "@/components/common/StatusBadge";
import type { CompetitionSummary } from "@/types";
import { formatDateRange } from "@/utils/format";

export default function CompetitionCard({ competition }: { competition: CompetitionSummary }) {
  const typeName = competition.competition_type?.name ?? competition.competition_type?.code ?? "";
  const location = competition.affiliation
    ? [competition.affiliation.city, competition.affiliation.state, competition.affiliation.country]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <Link
      to={`/competitions/${competition.slug || competition.id}/`}
      className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-200 hover:shadow-theme-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
          {competition.name}
        </h3>
        <StatusBadge code={competition.status?.code ?? ""} name={competition.status?.name} />
      </div>

      <p className="text-sm text-gray-500">
        {formatDateRange(competition.start_date, competition.end_date)}
      </p>

      <div className="flex flex-col gap-1 text-sm text-gray-500">
        {typeName && <span>Competición: {typeName}</span>}
        {competition.affiliation?.name && (
          <span>Organiza: {competition.affiliation.name}</span>
        )}
        {location && <span>{location}</span>}
      </div>

      {competition.description && (
        <p className="line-clamp-2 text-sm text-gray-500">{competition.description}</p>
      )}

      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-brand-600">
        Ver detalle
        <svg
          className="size-4 transition group-hover:translate-x-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}