import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchCompetitor } from "@/api/admin";
import {
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
  useAdminTeams,
  useCreateCompetitor,
  useUpdateCompetitor,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import CompetitionScopeSelect from "@/components/admin/CompetitionScopeSelect";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import type { CompetitorWritePayload } from "@/types";

const competitorSchema = z
  .object({
    competitor_type: z.enum(["INDIVIDUAL", "TEAM"]),
    registration_number: z
      .string()
      .min(1, "El número de inscripción es obligatorio"),
    athlete: z.string(),
    team: z.string(),
    enabled_competition_category: z
      .string()
      .min(1, "Seleccioná una categoría"),
  })
  .superRefine((values, ctx) => {
    if (values.competitor_type === "INDIVIDUAL" && !values.athlete) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["athlete"],
        message: "Seleccioná un atleta",
      });
    }
    if (values.competitor_type === "TEAM" && !values.team) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["team"],
        message: "Seleccioná un equipo",
      });
    }
  });

type CompetitorFormValues = z.infer<typeof competitorSchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export default function CompetitorFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const scopeCompetitionId = useAdminScopeStore((s) => s.competitionId);
  const createMutation = useCreateCompetitor(scopeCompetitionId);
  const updateMutation = useUpdateCompetitor(scopeCompetitionId);

  const detailQuery = useQuery({
    queryKey: ["admin", "competitor", id],
    queryFn: () => fetchCompetitor(Number(id)),
    enabled: isEditing,
  });

  const effectiveCompetitionId = isEditing
    ? detailQuery.data?.competition ?? null
    : scopeCompetitionId;

  const athletesQuery = useAdminAthletes();
  const teamsQuery = useAdminTeams();
  const enabledQuery = useAdminEnabledCategories(effectiveCompetitionId);
  const categoriesQuery = useAdminCompetitionCategories();

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CompetitorFormValues>({
    resolver: zodResolver(competitorSchema),
    defaultValues: {
      competitor_type: "INDIVIDUAL",
      registration_number: "",
      athlete: "",
      team: "",
      enabled_competition_category: "",
    },
  });

  const competitorType = watch("competitor_type");

  const categoryNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categoriesQuery.data ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categoriesQuery.data]);

  useEffect(() => {
    if (detailQuery.data) {
      const c = detailQuery.data;
      reset({
        competitor_type: c.competitor_type,
        registration_number: c.registration_number,
        athlete: c.athlete ? String(c.athlete) : "",
        team: c.team ? String(c.team) : "",
        enabled_competition_category: String(c.enabled_competition_category),
      });
    }
  }, [detailQuery.data, reset]);

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && detailQuery.isLoading) {
    return <Spinner label="Cargando competidor…" />;
  }

  if (isEditing && detailQuery.isError) {
    return (
      <ErrorState
        title="No se pudo cargar la información"
        message="Verifica tu conexión e intenta de nuevo."
      />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    if (!effectiveCompetitionId) {
      setError("Seleccioná una competición para inscribir.");
      return;
    }
    const payload: CompetitorWritePayload = {
      competitor_type: values.competitor_type,
      registration_number: values.registration_number.trim(),
      enabled_competition_category: Number(values.enabled_competition_category),
      competition: effectiveCompetitionId,
      athlete:
        values.competitor_type === "INDIVIDUAL" && values.athlete
          ? Number(values.athlete)
          : null,
      team:
        values.competitor_type === "TEAM" && values.team
          ? Number(values.team)
          : null,
    };
    if (isEditing && id) payload.id = Number(id);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/admin/competitors", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el competidor. Intenta de nuevo.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar competidor" : "Nuevo competidor"}
        parentTitle="Competidores"
        parentPath="/admin/competitors"
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

      {!effectiveCompetitionId ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Seleccioná una competición para inscribir un competidor.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="competitor_type" className={labelClassName}>
                  Tipo
                </label>
                <select
                  id="competitor_type"
                  {...register("competitor_type")}
                  className={inputClassName}
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="TEAM">Equipo</option>
                </select>
              </div>

              <div>
                <label htmlFor="registration_number" className={labelClassName}>
                  Nº de inscripción
                </label>
                <input
                  id="registration_number"
                  {...register("registration_number")}
                  className={inputClassName}
                  placeholder="Ej. 101"
                />
                {errors.registration_number?.message && (
                  <p className="mt-1 text-xs text-error-600" role="alert">
                    {errors.registration_number.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={competitorType === "INDIVIDUAL" ? "athlete" : "team"} className={labelClassName}>
                {competitorType === "INDIVIDUAL" ? "Atleta" : "Equipo"}
              </label>
              {competitorType === "INDIVIDUAL" ? (
                <select
                  id="athlete"
                  {...register("athlete")}
                  className={inputClassName}
                >
                  <option value="">Seleccioná un atleta…</option>
                  {(athletesQuery.data ?? [])
                    .slice()
                    .sort((a, b) =>
                      `${a.first_name} ${a.last_name}`.localeCompare(
                        `${b.first_name} ${b.last_name}`,
                        "es",
                      ),
                    )
                    .map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.first_name} {athlete.last_name}
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  id="team"
                  {...register("team")}
                  className={inputClassName}
                >
                  <option value="">Seleccioná un equipo…</option>
                  {(teamsQuery.data ?? [])
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name, "es"))
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              )}
              {(competitorType === "INDIVIDUAL" ? errors.athlete : errors.team)
                ?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {(competitorType === "INDIVIDUAL" ? errors.athlete : errors.team)
                    ?.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="enabled_competition_category" className={labelClassName}>
                Categoría
              </label>
              <select
                id="enabled_competition_category"
                {...register("enabled_competition_category")}
                className={inputClassName}
              >
                <option value="">Seleccioná una categoría…</option>
                {(enabledQuery.data ?? [])
                  .slice()
                  .sort((a, b) =>
                    (categoryNames.get(a.competition_category) ?? "").localeCompare(
                      categoryNames.get(b.competition_category) ?? "",
                      "es",
                    ),
                  )
                  .map((enabled) => (
                    <option key={enabled.id} value={enabled.id}>
                      {categoryNames.get(enabled.competition_category) ?? enabled.id}
                    </option>
                  ))}
              </select>
              {errors.enabled_competition_category?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.enabled_competition_category.message}
                </p>
              )}
              {(enabledQuery.data ?? []).length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  No hay categorías habilitadas para esta competición. Habilitalas en
                  "Categorías por competición".
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {saving
                  ? "Guardando…"
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear competidor"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/competitors")}
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