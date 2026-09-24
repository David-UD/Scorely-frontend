import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import {
  useAdminScoringRules,
  useCreateScoringRule,
  useDeleteScoringRule,
  useUpdateScoringRule,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Toast from "@/components/common/Toast";
import { ChevronDownIcon } from "@/components/admin/icons";

interface ScoringRow {
  localId: number;
  id?: number;
  position: number;
  points: number;
  removed?: boolean;
}

export default function ScoringPage() {
  const competitionId = useAdminScopeStore((s) => s.competitionId);
  const rulesQuery = useAdminScoringRules(competitionId);
  const createMutation = useCreateScoringRule(competitionId);
  const updateMutation = useUpdateScoringRule(competitionId);
  const deleteMutation = useDeleteScoringRule(competitionId);
  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const [rows, setRows] = useState<ScoringRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [genBase, setGenBase] = useState<number>(100);
  const [genStep, setGenStep] = useState<number>(2);
  const [genTo, setGenTo] = useState<number>(5);

  const nextLocalId = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.localId), 0) + 1,
    [rows],
  );

  const previewValues = useMemo(() => {
    if (genBase < 0 || genStep < 0 || genTo < 1) return [];
    const count = Math.floor(genTo);
    return Array.from({ length: count }, (_, i) =>
      Math.max(0, genBase - i * genStep),
    );
  }, [genBase, genStep, genTo]);

  useEffect(() => {
    setRows([]);
    setError(null);
    setToast(null);
    setTableOpen(false);
    setGenBase(100);
    setGenStep(2);
    setGenTo(5);
  }, [competitionId]);

  useEffect(() => {
    if (!rulesQuery.data) return;
    setRows(
      [...rulesQuery.data]
        .sort((a, b) => a.position - b.position)
        .map((rule) => ({
          localId: rule.id,
          id: rule.id,
          position: rule.position,
          points: rule.points,
        })),
    );
  }, [rulesQuery.data]);

  if (rulesQuery.isLoading) {
    return <Spinner label="Cargando reglas…" />;
  }

  if (rulesQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las reglas"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const sortedRows = [...rows].sort((a, b) => a.position - b.position);

  const handleAddRow = () => {
    setError(null);
    const maxPosition = rows.reduce(
      (max, row) => Math.max(max, row.position),
      0,
    );
    setRows((prev) => [
      ...prev,
      {
        localId: nextLocalId,
        position: maxPosition + 1,
        points: 0,
      },
    ]);
  };

  const handleChange = (localId: number, field: "position" | "points", value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.localId === localId
          ? { ...row, [field]: Number(value) || 0 }
          : row,
      ),
    );
  };

  const handleRemoveRow = (localId: number) => {
    setError(null);
    setRows((prev) =>
      prev.map((row) =>
        row.localId === localId ? { ...row, removed: true } : row,
      ),
    );
  };

  const buildGeneratedRows = (): ScoringRow[] => {
    let nextId = nextLocalId;
    const generated: ScoringRow[] = [];
    for (let position = 1; position <= genTo; position += 1) {
      const match = rows.find(
        (row) => !row.removed && row.position === position,
      );
      generated.push({
        localId: match ? match.localId : nextId++,
        id: match?.id,
        position,
        points: Math.max(0, genBase - (position - 1) * genStep),
      });
    }
    const keptIds = new Set(generated.map((row) => row.localId));
    const displaced = rows
      .filter((row) => !row.removed && !keptIds.has(row.localId) && row.id)
      .map((row) => ({ ...row, removed: true }));
    return [...generated, ...displaced];
  };

  const handleSave = async (target: ScoringRow[] = sortedRows) => {
    if (!competitionId) return;
    setError(null);
    setToast(null);
    try {
      for (const row of target) {
        if (row.removed) {
          if (row.id) {
            await deleteMutation.mutateAsync(row.id);
          }
          continue;
        }
        if (row.position < 1 || row.points < 0) {
          throw new Error(
            "La posición debe ser mayor o igual a 1 y los puntos mayor o igual a 0.",
          );
        }
        if (row.id) {
          await updateMutation.mutateAsync({
            id: row.id,
            position: row.position,
            points: row.points,
          });
        } else {
          await createMutation.mutateAsync({
            competition: competitionId,
            position: row.position,
            points: row.points,
          });
        }
      }
      setToast("Reglas guardadas correctamente.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron guardar las reglas. Intenta de nuevo.",
      );
    }
  };

  const handleGenerateAndSave = () => {
    if (!competitionId) return;
    setError(null);
    if (genBase < 0 || genStep < 0 || genTo < 1) {
      setError(
        "El primer puesto debe ser mayor o igual a 0, el descenso mayor o igual a 0 y el último puesto al menos 1.",
      );
      return;
    }
    const target = buildGeneratedRows();
    setRows(target);
    setTableOpen(true);
    void handleSave(target);
  };

  const gridReady = Boolean(competitionId);

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Scoring" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <CompetitionScopeSelect />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-800">Regla general</h2>
        <p className="mt-1 text-sm text-gray-500">
          Los puntos bajan en progresión aritmética: el 1.er puesto recibe la
          base y cada puesto siguiente resta el descenso.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-1 flex-col gap-1.5 sm:flex-none">
            <label
              htmlFor="rule-base"
              className="text-xs font-medium text-gray-500 text-theme-sm"
            >
              Puntos 1.er puesto
            </label>
            <input
              id="rule-base"
              type="number"
              min={0}
              value={genBase}
              onChange={(e) => setGenBase(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 sm:w-32"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 sm:flex-none">
            <label
              htmlFor="rule-step"
              className="text-xs font-medium text-gray-500 text-theme-sm"
            >
              Descenso por puesto
            </label>
            <input
              id="rule-step"
              type="number"
              min={0}
              value={genStep}
              onChange={(e) => setGenStep(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 sm:w-32"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 sm:flex-none">
            <label
              htmlFor="rule-to"
              className="text-xs font-medium text-gray-500 text-theme-sm"
            >
              Hasta posición
            </label>
            <input
              id="rule-to"
              type="number"
              min={1}
              value={genTo}
              onChange={(e) => setGenTo(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 sm:w-32"
            />
          </div>
          <button
            onClick={handleGenerateAndSave}
            disabled={!gridReady || saving}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Guardando…" : "Generar y guardar"}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium text-gray-500">
            Secuencia que se generará
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-800">
            {previewValues.length > 0 ? (
              previewValues.map((value, index) => (
                <span key={index}>
                  <span className="text-gray-500">{index + 1}º</span>
                  {" = "}
                  <span className="font-semibold">{value}</span>
                </span>
              ))
            ) : (
              <span className="text-gray-500">
                Completá los campos para ver la secuencia.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setTableOpen((prev) => !prev)}
          aria-expanded={tableOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start transition hover:bg-gray-50"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            Tabla de posiciones
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              {sortedRows.filter((row) => !row.removed).length}
            </span>
          </span>
          <ChevronDownIcon
            className={`size-5 text-gray-400 transition-transform ${
              tableOpen ? "" : "rotate-180"
            }`}
          />
        </button>

        {tableOpen && (
          <div className="border-t border-gray-100 p-4">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <button
                onClick={handleAddRow}
                disabled={!gridReady || saving}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Añadir posición
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={!gridReady || saving}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar reglas"}
              </button>
            </div>

            {sortedRows.length === 0 ? (
              <div className="pt-5">
                <EmptyState
                  title="Sin reglas de puntuación"
                  description="Usá &quot;Regla general&quot; o &quot;Añadir posición&quot; para definir cuántos puntos vale cada puesto."
                />
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                        Posición
                      </th>
                      <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                        Puntos
                      </th>
                      <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedRows
                      .filter((row) => !row.removed)
                      .map((row) => (
                        <tr key={row.localId}>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              min={1}
                              value={row.position}
                              onChange={(e) =>
                                handleChange(row.localId, "position", e.target.value)
                              }
                              aria-label={`Posición de la regla ${row.localId}`}
                              className="w-full min-w-[100px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              min={0}
                              value={row.points}
                              onChange={(e) =>
                                handleChange(row.localId, "points", e.target.value)
                              }
                              aria-label={`Puntos de la regla ${row.localId}`}
                              className="w-full min-w-[100px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleRemoveRow(row.localId)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}