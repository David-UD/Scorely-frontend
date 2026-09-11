interface SpinnerProps {
  label?: string;
  center?: boolean;
}

export default function Spinner({ label = "Cargando…", center = true }: SpinnerProps) {
  return (
    <div
      role="status"
      className={
        center
          ? "flex items-center justify-center gap-2.5 py-10 text-sm font-medium text-gray-500"
          : "inline-flex items-center gap-2.5 text-sm font-medium text-gray-500"
      }
    >
      <svg
        className="size-5 animate-spin text-brand-500"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {label}
    </div>
  );
}