import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchCompetitionCategory } from "@/api/admin";
import {
  useCreateCompetitionCategory,
  useUpdateCompetitionCategory,
} from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import type { CompetitionCategoryWritePayload } from "@/types";

const categorySchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    min_members: z.coerce.number().min(0, "Mínimo de integrantes inválido"),
    max_members: z.coerce.number().min(0, "Máximo de integrantes inválido"),
  })
  .refine((values) => values.max_members >= values.min_members, {
    message: "El máximo de integrantes debe ser mayor o igual al mínimo",
    path: ["max_members"],
  });

type CategoryFormValues = z.infer<typeof categorySchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export default function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));

  const createMutation = useCreateCompetitionCategory();
  const updateMutation = useUpdateCompetitionCategory();

  const detailQuery = useQuery({
    queryKey: ["admin", "competition-category", id],
    queryFn: () => fetchCompetitionCategory(Number(id)),
    enabled: isEditing,
  });

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      min_members: 1,
      max_members: 1,
    },
  });

  useEffect(() => {
    if (detailQuery.data) {
      const category = detailQuery.data;
      reset({
        name: category.name,
        min_members: category.min_members,
        max_members: category.max_members,
      });
    }
  }, [detailQuery.data, reset]);

  const saving = createMutation.isPending || updateMutation.isPending;
  const loadingEdit = isEditing && detailQuery.isLoading;

  if (!isSuperUser) {
    return (
      <div className="flex flex-col gap-6">
        <PageBreadcrumb
          pageTitle={isEditing ? "Editar categoría" : "Nueva categoría"}
          parentTitle="Categorías"
          parentPath="/admin/categories"
        />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Solo el superusuario puede administrar el catálogo de categorías.
        </div>
      </div>
    );
  }

  if (loadingEdit) {
    return <Spinner label="Cargando categoría…" />;
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
    const payload: CompetitionCategoryWritePayload = {
      name: values.name,
      min_members: values.min_members,
      max_members: values.max_members,
    };
    if (isEditing && id) payload.id = Number(id);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/admin/categories", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la categoría. Intenta de nuevo.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar categoría" : "Nueva categoría"}
        parentTitle="Categorías"
        parentPath="/admin/categories"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="min_members" className={labelClassName}>
                Mínimo de integrantes
              </label>
              <input
                id="min_members"
                type="number"
                min={0}
                {...register("min_members", { valueAsNumber: true })}
                className={inputClassName}
              />
              {errors.min_members?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.min_members.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="max_members" className={labelClassName}>
                Máximo de integrantes
              </label>
              <input
                id="max_members"
                type="number"
                min={0}
                {...register("max_members", { valueAsNumber: true })}
                className={inputClassName}
              />
              {errors.max_members?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.max_members.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear categoría"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/categories")}
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