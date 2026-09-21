import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { fetchLocation } from "@/api/admin";
import {
  useCreateLocation,
  useUpdateLocation,
} from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import type { LocationWritePayload } from "@/types";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : Number(v)),
  z.number().optional(),
);

const locationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().min(1, "La dirección es obligatoria"),
  city: z.string().min(1, "La ciudad es obligatoria"),
  state: z.string().min(1, "El estado/provincia es obligatorio"),
  country: z.string().min(1, "El país es obligatorio"),
  latitude: optionalNumber,
  longitude: optionalNumber,
});

type LocationFormValues = z.infer<typeof locationSchema>;

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export default function LocationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();

  const detailQuery = useQuery({
    queryKey: ["admin", "location", id],
    queryFn: () => fetchLocation(Number(id)),
    enabled: isEditing,
  });

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  useEffect(() => {
    if (detailQuery.data) {
      const location = detailQuery.data;
      reset({
        name: location.name,
        address: location.address ?? "",
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: location.latitude == null ? undefined : Number(location.latitude),
        longitude: location.longitude == null ? undefined : Number(location.longitude),
      });
    }
  }, [detailQuery.data, reset]);

  const saving = createMutation.isPending || updateMutation.isPending;
  const loadingEdit = isEditing && detailQuery.isLoading;

  if (!isSuperUser) {
    return (
      <div className="flex flex-col gap-6">
        <PageBreadcrumb
          pageTitle={isEditing ? "Editar sede" : "Nueva sede"}
          parentTitle="Sedes"
          parentPath="/admin/sedes"
        />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Solo el superusuario puede administrar las sedes.
        </div>
      </div>
    );
  }

  if (loadingEdit) {
    return <Spinner label="Cargando sede…" />;
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
    const payload: LocationWritePayload = {
      name: values.name,
      address: values.address,
      city: values.city,
      state: values.state,
      country: values.country,
    };
    if (values.latitude !== undefined) payload.latitude = values.latitude;
    if (values.longitude !== undefined) payload.longitude = values.longitude;
    if (isEditing && id) payload.id = Number(id);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/admin/sedes", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la sede. Intenta de nuevo.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        pageTitle={isEditing ? "Editar sede" : "Nueva sede"}
        parentTitle="Sedes"
        parentPath="/admin/sedes"
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
            <label htmlFor="address" className={labelClassName}>
              Dirección
            </label>
            <input id="address" {...register("address")} className={inputClassName} />
            {errors.address?.message && (
              <p className="mt-1 text-xs text-error-600" role="alert">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelClassName}>
                Ciudad
              </label>
              <input id="city" {...register("city")} className={inputClassName} />
              {errors.city?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="state" className={labelClassName}>
                Estado/Provincia
              </label>
              <input id="state" {...register("state")} className={inputClassName} />
              {errors.state?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="country" className={labelClassName}>
              País
            </label>
            <input id="country" {...register("country")} className={inputClassName} />
            {errors.country?.message && (
              <p className="mt-1 text-xs text-error-600" role="alert">
                {errors.country.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="latitude" className={labelClassName}>
                Latitud (opcional)
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude", { valueAsNumber: true })}
                className={inputClassName}
              />
              {errors.latitude?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.latitude.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="longitude" className={labelClassName}>
                Longitud (opcional)
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude", { valueAsNumber: true })}
                className={inputClassName}
              />
              {errors.longitude?.message && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {errors.longitude.message}
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
              {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear sede"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/sedes")}
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