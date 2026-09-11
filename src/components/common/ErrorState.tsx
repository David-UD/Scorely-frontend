interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Ocurrió un error",
  message = "No se pudo cargar la información. Intenta de nuevo en unos momentos.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-error-100 bg-error-50 px-6 py-10 text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-error-100 text-error-600">
        <svg
          className="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
        </svg>
      </span>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-md text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}