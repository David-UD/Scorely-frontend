import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/api/client";

export interface InlineFieldConfig {
  name: string;
  label: string;
  type?: "text" | "date" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface InlineEntitySelectProps {
  label: string;
  placeholder: string;
  selectId: string;
  value: string;
  register: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  selectError?: string;
  fields: InlineFieldConfig[];
  onCreate: (values: Record<string, string>) => Promise<{ id: number }>;
  onSelectCreated: (id: number) => void;
}

function buildSchema(fields: InlineFieldConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    if (field.type === "select" && field.required) {
      shape[field.name] = z.string().min(1, `${field.label} es obligatorio`);
    } else if (field.required) {
      shape[field.name] = z.string().min(1, `${field.label} es obligatorio`);
    } else {
      shape[field.name] = z.string().optional();
    }
  }
  return z.object(shape);
}

function buildDefaults(fields: InlineFieldConfig[]) {
  const defaults: Record<string, string> = {};
  for (const field of fields) {
    defaults[field.name] =
      field.type === "select" ? (field.options?.[0]?.value ?? "") : "";
  }
  return defaults;
}

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10";
const labelClassName = "mb-1 block text-xs font-medium text-gray-600";

export default function InlineEntitySelect({
  label,
  placeholder,
  selectId,
  value,
  register,
  options,
  selectError,
  fields,
  onCreate,
  onSelectCreated,
}: InlineEntitySelectProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const schema = buildSchema(fields);
  type FormValues = z.infer<typeof schema>;

  const {
    register: registerInline,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(fields) as FormValues,
  });

  const onSubmitInline = handleSubmit(async (values) => {
    setCreateError(null);
    setCreating(true);
    try {
      const created = await onCreate(values as Record<string, string>);
      onSelectCreated(created.id);
      setShowCreate(false);
      reset(buildDefaults(fields) as FormValues);
    } catch (err) {
      setCreateError(
        err instanceof ApiError
          ? err.message
          : `No se pudo crear ${label.toLowerCase()}. Intenta de nuevo.`,
      );
    } finally {
      setCreating(false);
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <select
          id={selectId}
          {...register}
          value={value}
          className={inputClassName}
          aria-label={label}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateError(null);
          }}
          className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
        >
          + Nuevo
        </button>
      </div>

      {selectError && (
        <p className="text-xs text-error-600" role="alert">
          {selectError}
        </p>
      )}

      {showCreate && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            Crear {label.toLowerCase()} al instante
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={`inline-${field.name}`} className={labelClassName}>
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    id={`inline-${field.name}`}
                    {...registerInline(field.name)}
                    className={inputClassName}
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`inline-${field.name}`}
                    type={field.type ?? "text"}
                    {...registerInline(field.name)}
                    className={inputClassName}
                  />
                )}
                {errors[field.name]?.message && (
                  <p className="mt-1 text-xs text-error-600" role="alert">
                    {String(errors[field.name]?.message)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {createError && (
            <p className="mt-2 text-sm text-error-600" role="alert">
              {createError}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onSubmitInline}
              disabled={creating}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {creating ? "Creando…" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreateError(null);
                reset(buildDefaults(fields) as FormValues);
              }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}