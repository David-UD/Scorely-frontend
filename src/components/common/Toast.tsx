import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      className="fixed right-5 bottom-5 z-[100] flex items-center gap-3 rounded-xl border border-success-200 bg-white px-4 py-3 shadow-lg animate-[toast-in_0.25s_ease-out]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="text-sm font-medium text-gray-800">{message}</p>
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="ml-2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}