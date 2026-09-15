import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminCompetitionCategories, useDeleteCompetitionCategory } from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";
import PageBreadcrumb from "@/components/admin/PageBreadcrumb";
import Spinner from "@/components/common/Spinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const categoriesQuery = useAdminCompetitionCategories();
  const deleteMutation = useDeleteCompetitionCategory();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la categoría "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  if (!isSuperUser) {
    return (
      <div className="flex flex-col gap-6">
        <PageBreadcrumb pageTitle="Categorías" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Solo el superusuario puede administrar el catálogo de categorías.
        </div>
      </div>
    );
  }

  if (categoriesQuery.isLoading) {
    return <Spinner label="Cargando categorías…" />;
  }

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar las categorías"
        message="Intenta de nuevo en unos momentos."
      />
    );
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb pageTitle="Categorías" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Catálogo de categorías disponibles para las competiciones.
        </p>
        <button
          onClick={() => navigate("/admin/categories/new")}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Nueva categoría
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Creá la primera categoría para poder habilitarla en las competiciones."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Nombre
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Mín. integrantes
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Máx. integrantes
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {category.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {category.min_members}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {category.max_members}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/categories/${category.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          disabled={deletingId === category.id}
                          className="rounded-lg border border-error-100 px-3 py-1.5 text-sm font-medium text-error-600 transition hover:bg-error-50 disabled:opacity-50"
                        >
                          {deletingId === category.id ? "Eliminando…" : "Eliminar"}
                        </button>
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