import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchEvent, fetchStage, fetchStages } from "@/api/admin";
import {
  useCreateEvent,
  useUpdateEvent,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import { stageLabel } from "@/utils/format";
import type { EventWritePayload } from "@/types";

const eventSchema = z.object({
  competition_stage: z.coerce.number().min(1, "Selecciona una etapa"),
  event_number: z.coerce.number().min(1, "Número de evento inválido"),
  name: z.string().min(1, "El nombre es obligatorio"),
  workout: z.string().min(1, "El workout es obligatorio"),
  description: z.string().optional(),
  is_ascending: z.boolean(),
  is_active: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";
const checkClassName =
  "size-5 rounded border border-gray-300 text-brand-500 focus:ring-brand-500/30";

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const scopeCompetitionId = useAdminScopeStore((s) => s.competitionId);
  const createMutation = useCreateEvent(scopeCompetitionId);
  const updateMutation = useUpdateEvent(scopeCompetitionId);

  const detailQuery = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchEvent(Number(id)),
    enabled: isEditing,
  });

  const stageId = detailQuery.data?.competition_stage;
  const stageQuery = useQuery({
    queryKey: ["admin", "stage", stageId],
    queryFn: () => fetchStage(stageId as number),
    enabled: isEditing && Boolean(stageId),
  });

  const editCompetitionId = stageQuery.data?.competition;
  const stagesQuery = useQuery({
    queryKey: ["admin", "stages", editCompetitionId],
    queryFn: () => fetchStages(editCompetitionId as number),
    enabled: isEditing && Boolean(editCompetitionId),
  });

  const createStagesQuery = useQuery({
    queryKey: ["admin", "stages", "scope", scopeCompetitionId],
    queryFn: () => fetchStages(scopeCompetitionId as number),
    enabled: !isEditing && Boolean(scopeCompetitionId),
    staleTime: 30_000,
  });

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      competition_stage: 0,
      event_number: 1,
      name: "",
      workout: "",
      description: "",
      is_ascending: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (detailQuery.data) {
      const e = detailQuery.data;
      reset({
        competition_stage: e.competition_stage,
        event_number: e.event_number,
        name: e.name,
        workout: e.workout,
        description: e.description ?? "",
        is_ascending: e.is_ascending,
        is_active: e.is_active,
      });
    }
  }, [detailQuery.data, reset]);

  const saving = createMutation.isPending || updateMutation.isPending;
  const loadingEdit =
    isEditing &&
    (detailQuery.isLoading || (detailQuery.isSuccess && stageQuery.isLoading) ||
      (stageQuery.isSuccess && stagesQuery.isLoading));

  if (loadingEdit) {
    return <Spinner label="Cargando evento…" />;
  }

  if (
    (isEditing && (detailQuery.isError || stageQuery.isError || stagesQuery.isError)) ||
    (!isEditing && createStagesQuery.isError)
  ) {
    return (
      <ErrorState
        title="No se pudo cargar la información"
        message="Verifica tu conexión e intenta de nuevo."
      />
    );
  }

  const stages = isEditing ? (stagesQuery.data ?? []) : (createStagesQuery.data ?? []);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const payload: EventWritePayload = {
      ...values,
      description: values.description || "",
    };
    if (isEditing && id) payload.id = Number(id);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/admin/events", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el evento. Intenta de nuevo.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar evento" : "Nuevo evento"}
        parentTitle="Eventos"
        parentPath="/admin/events"
      />

      {!isEditing && <CompetitionScopeSelect />}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      {!isEditing && !scopeCompetitionId ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Seleccioná una competición para crear un evento.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="competition_stage" className={labelClassName}>
                Etapa
              </label>
              <select
                id="competition_stage"
                {...register("competition_stage", { valueAsNumber: true })}
                className={inputClassName}
              >
                <option value="0">Selecciona…</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stageLabel(stage.stage_type)}
                    {stage.order ? ` · Orden ${stage.order}` : ""}
                  </option>
                ))}
              </select>
              {errors.competition_stage?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.competition_stage.message}
                </p>
              )}
              {stages.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  Esta competición aún no tiene etapas.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="event_number" className={labelClassName}>
                  Número de evento
                </label>
                <input
                  id="event_number"
                  type="number"
                  min={1}
                  {...register("event_number", { valueAsNumber: true })}
                  className={inputClassName}
                />
                {errors.event_number?.message && (
                  <p className="mt-1 text-xs text-error-600" role="alert">
                    {errors.event_number.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="name" className={labelClassName}>
                  Nombre
                </label>
                <input id="name" {...register("name")} className={inputClassName} />
                {errors.name?.message && (
                  <p className="mt-1 text-xs text-error-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="workout" className={labelClassName}>
                Workout
              </label>
              <textarea
                id="workout"
                rows={4}
                {...register("workout")}
                className={inputClassName}
              />
              {errors.workout?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.workout.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={labelClassName}>
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  {...register("is_ascending")}
                  className={checkClassName}
                />
                Ascendente (las repeticiones suben)
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  {...register("is_active")}
                  className={checkClassName}
                />
                Evento activo
              </label>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || stages.length === 0}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {saving
                  ? "Guardando…"
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear evento"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/events")}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}