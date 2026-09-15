import type { EventWod } from "@/types";
import EmptyState from "@/components/common/EmptyState";

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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3.5 font-medium">Nº</th>
            <th className="px-5 py-3.5 font-medium">Workouts</th>
            <th className="px-5 py-3.5 font-medium">Workout</th>
            <th className="px-5 py-3.5 font-medium">Descripción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visibleWods.map((wod) => (
            <tr key={wod.id} className="align-top">
              <td className="px-5 py-3.5 font-medium text-gray-900">{wod.event_number}</td>
              <td className="px-5 py-3.5 font-medium text-gray-800">{wod.name}</td>
              <td className="whitespace-pre-wrap px-5 py-3.5 text-gray-600">
                {wod.workout || "—"}
              </td>
              <td className="whitespace-pre-wrap px-5 py-3.5 text-gray-600">
                {wod.description || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}