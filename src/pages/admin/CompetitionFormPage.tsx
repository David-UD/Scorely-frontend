import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { getCompetition } from "@/api/public";
import {
  useAdminCatalogs,
  useCreateCompetition,
  useUpdateCompetition,
} from "@/hooks/useAdminCompetitions";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import type { CompetitionWritePayload } from "@/types";

const competitionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  slug: z.string().optional(),
  description: z.string().optional(),
  competition_type: z.coerce.number().min(1, "Selecciona un tipo"),
  status: z.coerce.number().min(1, "Selecciona un estado"),
  affiliation: z.coerce.number().min(1, "Selecciona una filiación"),
  location: z.coerce.number().min(1, "Selecciona una sede"),
  start_date: z.string().min(1, "La fecha de inicio es obligatoria"),
  end_date: z.string().optional(),
});

type CompetitionFormValues = z.infer<typeof competitionSchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const lockedFieldClassName =
  "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";
const lockHint = "Solo lo modifica el superusuario.";

export default function CompetitionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));
  const locked = isEditing && !isSuperUser;

  const catalogsQuery = useAdminCatalogs();
  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition();

  const detailQuery = useQuery({
    queryKey: ["admin", "competition", id],
    queryFn: () => getCompetition(id as string),
    enabled: isEditing,
  });

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      competition_type: 0,
      status: 0,
      affiliation: 0,
      location: 0,
      start_date: "",
      end_date: "",
    },
  });

  useEffect(() => {
    if (detailQuery.data) {
      const c = detailQuery.data;
      reset({
        name: c.name,
        slug: c.slug,
        description: c.description,
        competition_type: c.competition_type.id ?? 0,
        status: c.status.id ?? 0,
        affiliation: c.affiliation.id ?? 0,
        location: c.location?.id ?? 0,
        start_date: c.start_date,
        end_date: c.end_date,
      });
    }
  }, [detailQuery.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    const payload: CompetitionWritePayload = {
      name: values.name,
      description: values.description || "",
      competition_type: values.competition_type,
      status: values.status,
      affiliation: values.affiliation,
      location: values.location,
      start_date: values.start_date,
      end_date: values.end_date || undefined,
    };
    if (!locked) {
      if (values.slug?.trim()) payload.slug = values.slug.trim().toLowerCase();
    }
    if (locked) {
      delete payload.competition_type;
      delete payload.affiliation;
      delete payload.location;
    }
    if (isEditing && id) payload.id = Number(id);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/admin/competitions", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la competición. Intenta de nuevo.",
      );
    }
  });

  if (!isSuperUser && !isEditing) {
    return (
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Nueva competición" />
        <EmptyState
          title="Acceso denegado"
          description="Solo el superusuario puede crear competiciones. Como admin de competición podés editar las que tenés asignadas."
        />
      </div>
    );
  }

  if ((isEditing && detailQuery.isLoading) || catalogsQuery.isLoading) {
    return <Spinner label="Cargando…" />;
  }

  if ((isEditing && detailQuery.isError) || catalogsQuery.isError) {
    return (
      <ErrorState
        title="No se pudo cargar la información"
        message="Verifica tu conexión e intenta de nuevo."
      />
    );
  }

  const catalogs = catalogsQuery.data;
  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar competición" : "Nueva competición"}
        parentTitle={isSuperUser ? "Competiciones" : "Mis competiciones"}
        parentPath="/admin/competitions"
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6"
      >
        <div className="flex flex-col gap-4">
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

          <div>
            <label htmlFor="slug" className={labelClassName}>
              Slug (se usa en la URL pública)
            </label>
            <input
              id="slug"
              {...register("slug")}
              disabled={locked}
              aria-readonly={locked}
              className={`${inputClassName} ${locked ? lockedFieldClassName : ""}`}
            />
            {errors.slug?.message && (
              <p className="mt-1 text-xs text-error-600" role="alert">
                {errors.slug.message}
              </p>
            )}
            {locked && <p className="mt-1 text-xs text-gray-400">{lockHint}</p>}
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
            <div>
              <label htmlFor="competition_type" className={labelClassName}>
                Tipo
              </label>
              <select
                id="competition_type"
                {...register("competition_type", { valueAsNumber: true })}
                disabled={locked}
                className={`${inputClassName} ${locked ? lockedFieldClassName : ""}`}
              >
                <option value="0">Selecciona…</option>
                {catalogs?.competitionTypes.map((t) => (
                  <option key={t.id} value={t.id ?? ""}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.competition_type?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.competition_type.message}
                </p>
              )}
              {locked && <p className="mt-1 text-xs text-gray-400">{lockHint}</p>}
            </div>

            <div>
              <label htmlFor="status" className={labelClassName}>
                Estado
              </label>
              <select
                id="status"
                {...register("status", { valueAsNumber: true })}
                className={inputClassName}
              >
                <option value="0">Selecciona…</option>
                {catalogs?.statuses.map((s) => (
                  <option key={s.id} value={s.id ?? ""}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.status?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="affiliation" className={labelClassName}>
                Filiación
              </label>
              <select
                id="affiliation"
                {...register("affiliation", { valueAsNumber: true })}
                disabled={locked}
                className={`${inputClassName} ${locked ? lockedFieldClassName : ""}`}
              >
                <option value="0">Selecciona…</option>
                {catalogs?.affiliations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.affiliation?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.affiliation.message}
                </p>
              )}
              {locked && <p className="mt-1 text-xs text-gray-400">{lockHint}</p>}
            </div>

            <div>
              <label htmlFor="location" className={labelClassName}>
                Sede
              </label>
              <select
                id="location"
                {...register("location", { valueAsNumber: true })}
                disabled={locked}
                className={`${inputClassName} ${locked ? lockedFieldClassName : ""}`}
              >
                <option value="0">Selecciona…</option>
                {catalogs?.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.city}
                  </option>
                ))}
              </select>
              {errors.location?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.location.message}
                </p>
              )}
              {locked && <p className="mt-1 text-xs text-gray-400">{lockHint}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className={labelClassName}>
                Fecha de inicio
              </label>
              <input
                id="start_date"
                type="date"
                {...register("start_date")}
                className={inputClassName}
              />
              {errors.start_date?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="end_date" className={labelClassName}>
                Fecha de fin
              </label>
              <input
                id="end_date"
                type="date"
                {...register("end_date")}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear competición"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/competitions")}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}