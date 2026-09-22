import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchTeam } from "@/api/admin";
import {
  useCreateTeam,
  useUpdateTeam,
} from "@/hooks/useAdminModules";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import type { TeamWritePayload } from "@/types";

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

  const detailQuery = useQuery({
    queryKey: ["admin", "team", id],
    queryFn: () => fetchTeam(Number(id)),
    enabled: isEditing,
  });

  const [error, setError] = useState<string | null>(null);

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

  const saving = createMutation.isPending || updateMutation.isPending;

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
    const payload: TeamWritePayload = {
      name: values.name,
    };
    if (isEditing && id) payload.id = Number(id);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
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