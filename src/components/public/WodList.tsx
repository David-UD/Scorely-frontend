import Badge from "@/components/common/Badge";
import EmptyState from "@/components/common/EmptyState";
import type { EventWod } from "@/types";

export default function WodList({ phaseName, wods }: { phaseName: string; wods: EventWod[] }) {
  const visibleWods = wods.filter((wod) => wod.is_active !== false);

  if (visibleWods.length === 0) {
    return (
      <EmptyState
        title={`Sin workouts en ${phaseName}`}
        description="No hay eventos registrados para esta fase todavía."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {visibleWods.map((wod) => (
        <details
          key={wod.id}
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-semibold text-brand-600">WOD {wod.event_number}</span>
            {wod.name && (
              <h3 className="text-base font-semibold text-gray-900">{wod.name}</h3>
            )}
            {phaseName.toLowerCase() === "final" && <Badge tone="success">Final</Badge>}
            <svg
              className="ml-auto size-4 text-gray-400 transition group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {wod.workout && (
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800 sm:flex-1 sm:basis-1/2">
                {wod.workout}
              </p>
            )}

            {wod.description && (
              <p className="whitespace-pre-wrap text-sm text-gray-500 sm:flex-1 sm:basis-1/2">
                {wod.description}
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}