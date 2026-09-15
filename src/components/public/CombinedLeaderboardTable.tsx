import type { CombinedLeaderboardEntry, EventResult, EventWod } from "@/types";
import EmptyState from "@/components/common/EmptyState";
import MedalIcon from "@/components/public/MedalIcon";

interface CombinedLeaderboardTableProps {
  title?: string;
  entries: CombinedLeaderboardEntry[];
  qualifierWods: EventWod[];
  finalWods: EventWod[];
}

function score(value: number | null | undefined): string {
  return value != null ? String(value) : "-";
}

function total(entry: CombinedLeaderboardEntry): string {
  return entry.qualified ? String(entry.total_score) : "-";
}

function resultByEvent(
  entry: CombinedLeaderboardEntry,
  eventId: number,
): EventResult | undefined {
  return entry.event_results.find((r) => r.event_id === eventId);
}

function enrich(event: EventResult | undefined): string {
  if (!event) return "-";
  const parts: string[] = [];
  if (event.event_rank != null) parts.push(`#${event.event_rank}`);
  if (event.result) parts.push(event.result);
  return parts.join(" · ") || "-";
}

function medalFor(rank: number | null | undefined): 1 | 2 | 3 | null {
  if (rank === 1 || rank === 2 || rank === 3) return rank;
  return null;
}

function WodCell({ result }: { result: EventResult | undefined }) {
  if (!result) {
    return <td className="border-l border-gray-50 px-4 py-3.5 text-center text-gray-600">-</td>;
  }

  const medal = medalFor(result.event_rank);

  return (
    <td className="border-l border-gray-50 px-4 py-3.5 text-center text-gray-600">
      <span className="inline-flex items-center justify-center gap-1.5">
        {medal != null && <MedalIcon rank={medal} className="size-4 shrink-0" />}
        {score(result.score)}
      </span>
      <span className="block text-xs text-gray-400">{enrich(result)}</span>
    </td>
  );
}

export default function CombinedLeaderboardTable({
  title,
  entries,
  qualifierWods,
  finalWods,
}: CombinedLeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title={title ? `Sin resultados en ${title}` : "Sin resultados"}
        description="Todavía no hay resultados publicados para esta categoría."
      />
    );
  }

  const sortedQualWods = [...qualifierWods].sort((a, b) => a.event_number - b.event_number);
  const sortedFinalWods = [...finalWods].sort((a, b) => a.event_number - b.event_number);
  const qualCols = Math.max(sortedQualWods.length, 1);
  const finalCols = Math.max(sortedFinalWods.length, 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <th rowSpan={2} className="px-5 py-3.5 font-medium">Pos.</th>
            <th rowSpan={2} className="px-5 py-3.5 font-medium">Atleta</th>
            <th
              colSpan={qualCols}
              className="border-l border-gray-200 px-4 py-3 text-center font-semibold text-gray-500"
            >
              Qualifier
            </th>
            <th
              colSpan={finalCols}
              className="border-l border-gray-200 px-4 py-3 text-center font-semibold text-gray-500"
            >
              Final
            </th>
            <th rowSpan={2} className="px-5 py-3.5 text-center font-medium">Total</th>
          </tr>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            {sortedQualWods.map((wod) => (
              <th key={wod.id} className="border-l border-gray-100 px-4 py-2 text-center font-medium">
                Score {wod.event_number}
              </th>
            ))}
            {sortedQualWods.length === 0 && (
              <th className="border-l border-gray-100 px-4 py-2 text-center font-medium">Score</th>
            )}
            {sortedFinalWods.map((wod) => (
              <th key={wod.id} className="border-l border-gray-100 px-4 py-2 text-center font-medium">
                Score {wod.event_number}
              </th>
            ))}
            {sortedFinalWods.length === 0 && (
              <th className="border-l border-gray-100 px-4 py-2 text-center font-medium">Score</th>
            )}
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
              {sortedQualWods.map((wod) => (
                <WodCell key={wod.id} result={resultByEvent(entry, wod.id)} />
              ))}
              {sortedQualWods.length === 0 && (
                <WodCell result={undefined} />
              )}
              {sortedFinalWods.map((wod) => (
                <WodCell key={wod.id} result={resultByEvent(entry, wod.id)} />
              ))}
              {sortedFinalWods.length === 0 && (
                <WodCell result={undefined} />
              )}
              <td className="px-5 py-3.5 text-center font-semibold text-gray-900">{total(entry)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}