import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-title-sm font-semibold text-brand-500">404</p>
      <h1 className="text-title-md font-semibold text-gray-900">Página no encontrada</h1>
      <p className="max-w-md text-sm text-gray-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        Volver al inicio
      </Link>
    </div>
  );
}