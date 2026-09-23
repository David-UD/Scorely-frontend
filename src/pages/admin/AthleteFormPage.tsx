import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchAthlete } from "@/api/admin";
import {
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
  useCreateAthlete,
  useCreateCompetitor,
  useUpdateAthlete,
} from "@/hooks/useAdminModules";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import type { Athlete, AthleteWritePayload } from "@/types";

const athleteSchema = z.object({
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().min(1, "El apellido es obligatorio"),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
});

type AthleteFormValues = z.infer<typeof athleteSchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export default function AthleteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const createMutation = useCreateAthlete();
  const updateMutation = useUpdateAthlete();

  const [error, setError] = useState<string | null>(null);
  const [inscribeOpen, setInscribeOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const createdAthleteRef = useRef<Athlete | null>(null);

  const competitionsQuery = useAdminCompetitions();
  const enabledQuery = useAdminEnabledCategories(
    selectedCompetition ? Number(selectedCompetition) : null,
  );
  const categoriesQuery = useAdminCompetitionCategories();
  const createCompetitorMutation = useCreateCompetitor(
    selectedCompetition ? Number(selectedCompetition) : null,
  );

  const detailQuery = useQuery({
    queryKey: ["admin", "athlete", id],
    queryFn: () => fetchAthlete(Number(id)),
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      birth_date: "",
      gender: "M",
    },
  });

  useEffect(() => {
    if (detailQuery.data) {
      const a = detailQuery.data;
      reset({
        first_name: a.first_name,
        last_name: a.last_name,
        birth_date: a.birth_date ?? "",
        gender: a.gender || "M",
      });
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
    return <Spinner label="Cargando atleta…" />;
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

    const payload: AthleteWritePayload = {
      first_name: values.first_name,
      last_name: values.last_name,
      birth_date: values.birth_date || undefined,
      gender: values.gender || "",
    };
    if (isEditing && id) payload.id = Number(id);

    const shouldInscribe = Boolean(
      selectedCompetition && selectedCategory,
    );

    if (selectedCompetition && !selectedCategory) {
      setBlockError("Seleccioná una categoría para inscribir.");
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        let created = createdAthleteRef.current;
        if (!created) {
          created = await createMutation.mutateAsync(payload);
          createdAthleteRef.current = created;
        }
        if (shouldInscribe) {
          try {
            await createCompetitorMutation.mutateAsync({
              competitor_type: "INDIVIDUAL",
              athlete: created.id,
              team: null,
              registration_number: registrationNumber.trim(),
              competition: Number(selectedCompetition),
              enabled_competition_category: Number(selectedCategory),
            });
          } catch {
            setError(
              "El atleta se guardó, pero la inscripción falló. Corregí los datos de inscripción e intentá de nuevo.",
            );
            return;
          }
        }
      }
      navigate("/admin/athletes", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el atleta. Intenta de nuevo.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar atleta" : "Nuevo atleta"}
        parentTitle="Atletas"
        parentPath="/admin/athletes"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className={labelClassName}>
                Nombre
              </label>
              <input
                id="first_name"
                {...register("first_name")}
                className={inputClassName}
              />
              {errors.first_name?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className={labelClassName}>
                Apellido
              </label>
              <input
                id="last_name"
                {...register("last_name")}
                className={inputClassName}
              />
              {errors.last_name?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="birth_date" className={labelClassName}>
                Fecha de nacimiento
              </label>
              <input
                id="birth_date"
                type="date"
                {...register("birth_date")}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="gender" className={labelClassName}>
                Sexo
              </label>
              <select
                id="gender"
                {...register("gender")}
                className={inputClassName}
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
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
                      <label htmlFor="inscribe_competition" className={labelClassName}>
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
                  : "Crear atleta"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/athletes")}
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