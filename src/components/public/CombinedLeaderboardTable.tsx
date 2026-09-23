import { useState } from "react";
import type {
  CombinedLeaderboardEntry,
  EventResult,
  EventWod,
} from "@/types";
import EmptyState from "@/components/common/EmptyState";
import MedalIcon from "@/components/public/MedalIcon";

interface CombinedLeaderboardTableProps {
  title?: string;
  entries: CombinedLeaderboardEntry[];
  qualifierWods: EventWod[];
  finalWods: EventWod[];
}

type SortKey = "position" | "athlete" | `qual-${number}` | `final-${number}` | "total";
type SortDir = "asc" | "desc" | null;

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
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

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value ?? NaN);
  return Number.isFinite(n) ? n : NaN;
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

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <span className="text-gray-300" aria-hidden="true">
        ↕
      </span>
    );
  }
  return (
    <span className="text-gray-400" aria-hidden="true">
      {dir === "asc" ? "▲" : "▼"}
    </span>
  );
}

export default function CombinedLeaderboardTable({
  title,
  entries,
  qualifierWods,
  finalWods,
}: CombinedLeaderboardTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);

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

  const handleSort = (nextKey: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== nextKey) return { key: nextKey, dir: "asc" };
      return { key: nextKey, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  const sortedEntries = [...entries];
  if (sort) {
    const dirFactor = sort.dir === "asc" ? 1 : -1;
    const compareMissingLast = (a: number, b: number, missingA: boolean, missingB: boolean) => {
      if (missingA && missingB) return 0;
      if (missingA) return 1;
      if (missingB) return -1;
      return (a - b) * dirFactor;
    };
    const compareText = (a: string, b: string) => a.localeCompare(b, "es") * dirFactor;

    sortedEntries.sort((x, y) => {
      if (sort.key === "position") {
        const a = toNumber(x.rank);
        const b = toNumber(y.rank);
        return compareMissingLast(a, b, Number.isNaN(a), Number.isNaN(b));
      }
      if (sort.key === "athlete") {
        return compareText(x.display_name, y.display_name);
      }
      if (sort.key === "total") {
        return compareMissingLast(
          x.total_score,
          y.total_score,
          !x.qualified,
          !y.qualified,
        );
      }
      const eventId = Number(sort.key.split("-")[1]);
      const a = resultByEvent(x, eventId);
      const b = resultByEvent(y, eventId);
      const aScore = a?.score != null ? toNumber(a.score) : NaN;
      const bScore = b?.score != null ? toNumber(b.score) : NaN;
      return compareMissingLast(
        aScore,
        bScore,
        !a || Number.isNaN(aScore),
        !b || Number.isNaN(bScore),
      );
    });
  }

  const eventSortKey = (wod: EventWod): SortKey =>
    sortedQualWods.includes(wod)
      ? `qual-${wod.id}`
      : `final-${wod.id}`;

  const thClass =
    "cursor-pointer select-none px-5 py-3.5 font-medium hover:text-gray-600";
  const indicator = (key: SortKey) => (
    <SortIndicator active={sort?.key === key} dir={sort?.key === key ? sort.dir : null} />
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <th
              rowSpan={2}
              onClick={() => handleSort("position")}
              aria-sort={sort?.key === "position" ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
              className={thClass}
            >
              <span className="inline-flex items-center gap-1">
                Pos.
                {indicator("position")}
              </span>
            </th>
            <th
              rowSpan={2}
              onClick={() => handleSort("athlete")}
              aria-sort={sort?.key === "athlete" ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
              className={thClass}
            >
              <span className="inline-flex items-center gap-1">
                Atleta
                {indicator("athlete")}
              </span>
            </th>
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
            <th
              rowSpan={2}
              onClick={() => handleSort("total")}
              aria-sort={sort?.key === "total" ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
              className={`${thClass} text-center`}
            >
              <span className="inline-flex items-center justify-center gap-1">
                Total
                {indicator("total")}
              </span>
            </th>
          </tr>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            {sortedQualWods.map((wod) => (
              <th
                key={wod.id}
                onClick={() => handleSort(eventSortKey(wod))}
                aria-sort={sort?.key === eventSortKey(wod) ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                className="cursor-pointer select-none border-l border-gray-100 px-4 py-2 text-center font-medium hover:text-gray-600"
              >
                <span className="inline-flex items-center gap-1">
                  Score {wod.event_number}
                  {indicator(eventSortKey(wod))}
                </span>
              </th>
            ))}
            {sortedQualWods.length === 0 && (
              <th className="border-l border-gray-100 px-4 py-2 text-center font-medium">
                Score
              </th>
            )}
            {sortedFinalWods.map((wod) => (
              <th
                key={wod.id}
                onClick={() => handleSort(eventSortKey(wod))}
                aria-sort={sort?.key === eventSortKey(wod) ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                className="cursor-pointer select-none border-l border-gray-100 px-4 py-2 text-center font-medium hover:text-gray-600"
              >
                <span className="inline-flex items-center gap-1">
                  Score {wod.event_number}
                  {indicator(eventSortKey(wod))}
                </span>
              </th>
            ))}
            {sortedFinalWods.length === 0 && (
              <th className="border-l border-gray-100 px-4 py-2 text-center font-medium">Score</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedEntries.map((entry) => (
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