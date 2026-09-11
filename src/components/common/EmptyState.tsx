interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <svg
          className="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M20 12H4M12 4v16" strokeLinecap="round" />
        </svg>
      </span>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
    </div>
  );
}