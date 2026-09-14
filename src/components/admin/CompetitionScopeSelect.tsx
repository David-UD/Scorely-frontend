import { useEffect, useMemo } from "react";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";
import { useAdminScopeStore } from "@/store/adminScopeStore";

interface CompetitionScopeSelectProps {
  className?: string;
}

export default function CompetitionScopeSelect({
  className = "",
}: CompetitionScopeSelectProps) {
  const { data: competitions, isLoading, isError } = useAdminCompetitions();
  const competitionId = useAdminScopeStore((s) => s.competitionId);
  const setCompetitionId = useAdminScopeStore((s) => s.setCompetitionId);

  const effectiveId = useMemo(() => {
    if (!competitions || competitions.length === 0) return null;
    if (competitionId && competitions.some((c) => c.id === competitionId)) {
      return competitionId;
    }
    return competitions[0].id;
  }, [competitions, competitionId]);

  useEffect(() => {
    if (effectiveId && effectiveId !== competitionId) {
      setCompetitionId(effectiveId);
    }
  }, [effectiveId, competitionId, setCompetitionId]);

  if (isLoading) {
    return (
      <div className="h-10 w-full max-w-xs animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
    );
  }

  if (isError || !competitions || competitions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
        No hay competiciones disponibles.
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor="competition-scope"
        className="whitespace-nowrap text-sm font-medium text-gray-700"
      >
        Competición:
      </label>
      <select
        id="competition-scope"
        value={effectiveId ?? ""}
        onChange={(e) => setCompetitionId(Number(e.target.value) || null)}
        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10"
      >
        {competitions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}