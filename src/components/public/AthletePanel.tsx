import { useEffect, useId, useRef } from "react";
import Spinner from "@/components/common/Spinner";
import { useAthleteProfile, type ParticipantType } from "@/hooks/useAthleteProfile";
import { initials } from "@/utils/initials";
import type { CombinedLeaderboardEntry } from "@/types";

interface AthletePanelProps {
  entry: CombinedLeaderboardEntry;
  participantId: number | null;
  participantType?: ParticipantType;
  onClose: () => void;
}

export default function AthletePanel({
  entry,
  participantId,
  participantType = "athlete",
  onClose,
}: AthletePanelProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const profileQuery = useAthleteProfile(participantId, participantType);
  const profile = profileQuery.data ?? null;
  const eventResults = [...entry.event_results].sort(
    (a, b) => a.event_number - b.event_number,
  );

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar panel del atleta"
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-sm flex-col gap-6 overflow-y-auto bg-white p-6 shadow-xl"
      >
        <div className="flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={entry.display_name}
              className="size-40 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-40 shrink-0 items-center justify-center rounded-full bg-brand-50 text-4xl font-semibold text-brand-600">
              {initials(entry.display_name)}
            </span>
          )}

          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">
              {entry.display_name}
            </h2>
            {profileQuery.isLoading ? (
              <Spinner label="Cargando datos del atleta…" />
            ) : (
              profile?.box && (
                <p className="mt-1 text-sm text-gray-500">{profile.box}</p>
              )
            )}
          </div>
        </div>

        <div className="rounded-xl bg-brand-50 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Posición general
          </p>
          <p className="mt-1 text-4xl font-bold text-brand-600">{entry.rank}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Eventos
          </p>
          {eventResults.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">Sin eventos registrados.</p>
          ) : (
            <ul>
              {eventResults.map((event) => (
                <li
                  key={event.event_id}
                  className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-b-0"
                >
                  <span className="truncate text-sm text-gray-700">
                    {event.event_name || `Evento ${event.event_number}`}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-gray-900">
                    {event.event_rank != null ? `#${event.event_rank}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
