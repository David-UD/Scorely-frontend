import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchTeam } from "@/api/admin";
import {
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
  useCreateCompetitor,
  useCreateTeam,
  useUpdateTeam,
} from "@/hooks/useAdminModules";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import type { Team, TeamWritePayload } from "@/types";

const teamSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export default function TeamFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();

  const [error, setError] = useState<string | null>(null);
  const [inscribeOpen, setInscribeOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const createdTeamRef = useRef<Team | null>(null);

  const competitionsQuery = useAdminCompetitions();
  const enabledQuery = useAdminEnabledCategories(
    selectedCompetition ? Number(selectedCompetition) : null,
  );
  const categoriesQuery = useAdminCompetitionCategories();
  const createCompetitorMutation = useCreateCompetitor(
    selectedCompetition ? Number(selectedCompetition) : null,
  );

  const detailQuery = useQuery({
    queryKey: ["admin", "team", id],
    queryFn: () => fetchTeam(Number(id)),
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (detailQuery.data) {
      reset({ name: detailQuery.data.name });
    }
  }, [detailQuery.data, reset]);

  const categoryNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categoriesQuery.data ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    createCompetitorMutation.isPending;

  if (isEditing && detailQuery.isLoading) {
    return <Spinner label="Cargando equipo…" />;
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
    setBlockError(null);

    const payload: TeamWritePayload = {
      name: values.name,
    };
    if (isEditing && id) payload.id = Number(id);

    if (selectedCompetition && !selectedCategory) {
      setBlockError("Seleccioná una categoría para inscribir.");
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        let created = createdTeamRef.current;
        if (!created) {
          created = await createMutation.mutateAsync(payload);
          createdTeamRef.current = created;
        }
        if (selectedCompetition && selectedCategory) {
          try {
            await createCompetitorMutation.mutateAsync({
              competitor_type: "TEAM",
              athlete: null,
              team: created.id,
              registration_number: registrationNumber.trim(),
              competition: Number(selectedCompetition),
              enabled_competition_category: Number(selectedCategory),
            });
          } catch {
            setError(
              "El equipo se guardó, pero la inscripción falló. Corregí los datos de inscripción e intentá de nuevo.",
            );
            return;
          }
        }
      }
      navigate("/admin/teams", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el equipo. Intenta de nuevo.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar equipo" : "Nuevo equipo"}
        parentTitle="Equipos"
        parentPath="/admin/teams"
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
                Nombre del equipo
              </label>
              <input id="name" {...register("name")} className={inputClassName} />
              {errors.name?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {!isEditing && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-4">
                <button
                  type="button"
                  onClick={() => setInscribeOpen((v) => !v)}
                  aria-label="Inscribir en competición (opcional)"
                  aria-expanded={inscribeOpen}
                  className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-gray-800"
                >
                  <span>Inscribir en competición (opcional)</span>
                  <span className="text-xs font-normal text-gray-500">
                    {inscribeOpen ? "Ocultar" : "Mostrar"}
                  </span>
                </button>

                {inscribeOpen && (
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="inscribe_competition"
                          className={labelClassName}
                        >
                          Competición
                        </label>
                        <select
                          id="inscribe_competition"
                          value={selectedCompetition}
                          onChange={(e) => {
                            setSelectedCompetition(e.target.value);
                            setSelectedCategory("");
                          }}
                          className={inputClassName}
                        >
                          <option value="">Seleccioná una competición…</option>
                          {(competitionsQuery.data ?? [])
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name, "es"))
                            .map((competition) => (
                              <option key={competition.id} value={competition.id}>
                                {competition.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="inscribe_category" className={labelClassName}>
                          Categoría
                        </label>
                        <select
                          id="inscribe_category"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          disabled={!selectedCompetition}
                          className={inputClassName}
                        >
                          <option value="">
                            {selectedCompetition
                              ? "Seleccioná una categoría…"
                              : "Elegí primero una competición"}
                          </option>
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
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="inscribe_registration_number"
                        className={labelClassName}
                      >
                        Nº de inscripción (opcional)
                      </label>
                      <input
                        id="inscribe_registration_number"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className={inputClassName}
                        placeholder="Ej. 101"
                      />
                    </div>

                    {blockError && (
                      <p className="text-xs text-error-600" role="alert">
                        {blockError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
                  : "Crear equipo"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/teams")}
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