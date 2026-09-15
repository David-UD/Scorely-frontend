import { useMemo, useState } from "react";
import {
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
  useCreateEnabledCategory,
  useDeleteEnabledCategory,
  useUpdateEnabledCategory,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { ApiError } from "@/api/client";
import type { EnabledCompetitionCategoryWritePayload } from "@/types";

const inputClassName =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs outline-none transition focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const buttonPrimaryClassName =
  "rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

export default function CompetitionCategoriesPage() {
  const competitionId = useAdminScopeStore((s) => s.competitionId);

  const enabledQuery = useAdminEnabledCategories(competitionId);
  const catalogQuery = useAdminCompetitionCategories();

  const createMutation = useCreateEnabledCategory(competitionId);
  const updateMutation = useUpdateEnabledCategory(competitionId);
  const deleteMutation = useDeleteEnabledCategory(competitionId);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [newSlots, setNewSlots] = useState<string>("0");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSlots, setEditingSlots] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);

  const categoryName = useMemo(() => {
    const map = new Map<number, string>();
    catalog.forEach((category) => map.set(category.id, category.name));
    return (id: number) => map.get(id) ?? "—";
  }, [catalog]);

  const availableCategories = useMemo(() => {
    const enabledIds = new Set(
      (enabledQuery.data ?? []).map((entry) => entry.competition_category),
    );
    return catalog.filter((category) => !enabledIds.has(category.id));
  }, [catalog, enabledQuery.data]);

  if (enabledQuery.isLoading || catalogQuery.isLoading) {
    return <Spinner label="Cargando categorías…" />;
  }

  if (enabledQuery.isError || catalogQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las categorías"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const enabled = enabledQuery.data ?? [];

  const handleCreate = async () => {
    setFormError(null);
    if (!competitionId) {
      setFormError("Seleccioná una competición para habilitar categorías.");
      return;
    }
    if (!selectedCategoryId) {
      setFormError("Seleccioná una categoría del catálogo.");
      return;
    }
    const slots = Number(newSlots);
    if (!Number.isFinite(slots) || slots < 0) {
      setFormError("La cantidad de finalistas debe ser un número mayor o igual a 0.");
      return;
    }
    const payload: EnabledCompetitionCategoryWritePayload = {
      competition: competitionId,
      competition_category: Number(selectedCategoryId),
      finalist_slots: slots,
    };
    try {
      await createMutation.mutateAsync(payload);
      setSelectedCategoryId("");
      setNewSlots("0");
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "No se pudo habilitar la categoría. Intenta de nuevo.",
      );
    }
  };

  const startEdit = (id: number, currentSlots: number) => {
    setEditingId(id);
    setEditingSlots(String(currentSlots));
  };

  const handleUpdate = async (id: number) => {
    setFormError(null);
    const slots = Number(editingSlots);
    if (!Number.isFinite(slots) || slots < 0) {
      setFormError("La cantidad de finalistas debe ser un número mayor o igual a 0.");
      return;
    }
    const entry = enabled.find((e) => e.id === id);
    if (!entry) return;
    const payload: EnabledCompetitionCategoryWritePayload = {
      id,
      competition: entry.competition,
      competition_category: entry.competition_category,
      finalist_slots: slots,
    };
    try {
      await updateMutation.mutateAsync(payload);
      setEditingId(null);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar la categoría. Intenta de nuevo.",
      );
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Quitar la categoría "${name}" de esta competición?`)) {
      return;
    }
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Categorías por competición" />

      <div className="flex flex-wrap items-center gap-3">
        <CompetitionScopeSelect />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-800">
          Habilitar categoría en la competición
        </h3>
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700"
          >
            {formError}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {availableCategories.length === 0 ? (
            <p className="text-sm text-gray-500">
              No quedan categorías del catálogo para habilitar.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="category-select"
                  className="text-sm font-medium text-gray-700"
                >
                  Categoría
                </label>
                <select
                  id="category-select"
                  value={selectedCategoryId}
                  onChange={(e) =>
                    setSelectedCategoryId(e.target.value ? Number(e.target.value) : "")
                  }
                  className={inputClassName}
                >
                  <option value="">Seleccionar…</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="slots-input"
                  className="text-sm font-medium text-gray-700"
                >
                  Clasificados a la Final (0 = sin Final)
                </label>
                <input
                  id="slots-input"
                  type="number"
                  min={0}
                  value={newSlots}
                  onChange={(e) => setNewSlots(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!competitionId}
                className={buttonPrimaryClassName}
              >
                Habilitar
              </button>
            </>
          )}
        </div>
      </div>

      {enabled.length === 0 ? (
        <EmptyState
          title="Sin categorías habilitadas"
          description="Habilitá categorías del catálogo para esta competición."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Categoría
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Clasificados a la Final
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enabled.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {categoryName(entry.competition_category)}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {editingId === entry.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editingSlots}
                          onChange={(e) => setEditingSlots(e.target.value)}
                          className={`${inputClassName} w-28`}
                          aria-label={`Clasificados a la Final para ${categoryName(
                            entry.competition_category,
                          )}`}
                        />
                      ) : (
                        entry.finalist_slots
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {editingId === entry.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(entry.id)}
                              disabled={updateMutation.isPending}
                              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                startEdit(entry.id, entry.finalist_slots)
                              }
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(
                                  entry.id,
                                  categoryName(entry.competition_category),
                                )
                              }
                              disabled={deletingId === entry.id}
                              className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                            >
                              {deletingId === entry.id ? "Quitando…" : "Quitar"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}