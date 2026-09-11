import type { EventWod, LeaderboardEntry } from "@/types";
import EmptyState from "@/components/common/EmptyState";

interface LeaderboardTableProps {
  title?: string;
  entries: LeaderboardEntry[];
  wods?: EventWod[];
}

export default function LeaderboardTable({ title, entries, wods }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title={title ? `Sin resultados en ${title}` : "Sin resultados"}
        description="Todavía no hay resultados publicados para esta categoría."
      />
    );
  }

  const sortedWods = wods ? [...wods].sort((a, b) => a.event_number - b.event_number) : [];
  const showEvents = entries.some(
    (entry) => (entry.event_scores?.length ?? entry.event_ranks?.length ?? 0) > 0,
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3.5 font-medium">Pos.</th>
            <th className="px-5 py-3.5 font-medium">Atleta</th>
            {showEvents &&
              sortedWods.map((wod) => (
                <th key={wod.id} className="px-4 py-3.5 text-center font-medium">
                  Score {wod.event_number}
                </th>
              ))}
            <th className="px-5 py-3.5 text-right font-medium">Puntuación final</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr key={`${entry.competitor_id}`} className={entry.rank === 1 ? "bg-brand-25/60" : undefined}>
              <td className="px-5 py-3.5">
                <span
                  className={
                    entry.rank === 1
                      ? "inline-flex size-7 items-center justify-center rounded-full bg-brand-500 font-semibold text-white"
                      : "inline-flex size-7 items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600"
                  }
                >
                  {entry.rank}
                </span>
              </td>
              <td className="px-5 py-3.5 font-medium text-gray-800">{entry.display_name}</td>
              {showEvents &&
                sortedWods.map((wod) => {
                  const value = entry.event_scores?.[wod.event_number - 1];
                  return (
                    <td key={wod.id} className="px-4 py-3.5 text-center text-gray-600">
                      {value ?? "—"}
                    </td>
                  );
                })}
              <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                {entry.final_score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}