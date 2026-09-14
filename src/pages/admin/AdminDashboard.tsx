import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title-sm font-semibold text-gray-900">Panel de administración</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/competitions"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-theme-md"
        >
          <h2 className="text-sm font-semibold text-gray-900">Competiciones</h2>
          <p className="mt-1 text-sm text-gray-500">
            Crear, editar y eliminar competiciones.
          </p>
        </Link>
      </div>
    </div>
  );
}