import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

interface Step {
  number: string;
  title: string;
  description: string;
  live?: boolean;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Prepara tu evento",
    description:
      "Nombre, fecha y categorías. Tu página de competencia queda lista desde el principio para compartirla.",
  },
  {
    number: "02",
    title: "Configura tu puntuación",
    description:
      "Define cómo se puntuará tu competencia y organiza los resultados por categoría. Lleva el control desde un solo lugar.",
  },
  {
    number: "03",
    title: "Resultados en directo",
    description:
      "Registra las puntuaciones y deja que los rankings, las páginas de los atletas y los resultados se actualicen automáticamente.",
    live: true,
  },
];

const DOWN_ARROW = (
  <svg
    className="size-5 text-brand-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 5v14" strokeLinecap="round" />
    <path d="m19 12-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const REVEAL = "transition-all duration-500 ease-out";

export default function EventProcess({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const reveal = (delay: number, base: string) => ({
    className: cn(
      base,
      REVEAL,
      visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
    ),
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <section aria-labelledby="event-process-title" className={cn("bg-gray-50", className)}>
      <div
        ref={ref}
        className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:min-h-[70vh] lg:gap-16 lg:px-8"
      >
        <div {...reveal(0, "flex flex-col items-center gap-4 text-center")}>
          <p className="text-theme-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            Para organizadores
          </p>
          <h2
            id="event-process-title"
            className="text-title-sm font-semibold tracking-tight text-gray-900 text-balance sm:text-title-md lg:text-title-lg xl:text-title-xl"
          >
            Haz tu evento en 3 movimientos.
          </h2>
          <p className="max-w-2xl text-sm text-gray-500 text-pretty sm:text-base">
            Organiza tu competencia, gestiona las puntuaciones y publica los resultados en tiempo
            real.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-8">
          {STEPS.map((step, index) => (
            <Fragment key={step.number}>
              {index > 0 && (
                <div
                  aria-hidden="true"
                  {...reveal(100 + index * 120, "flex justify-center lg:hidden")}
                >
                  {DOWN_ARROW}
                </div>
              )}

              <div {...reveal(100 + index * 120, "flex min-w-0 flex-col gap-4")}>
                <div className="flex items-center gap-4">
                  <span className="text-title-md font-semibold text-brand-500 sm:text-title-lg lg:text-title-xl">
                    {step.number}
                  </span>

                  {step.live && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-2.5 py-1 text-theme-xs font-medium text-brand-600">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-brand-500" />
                      </span>
                      En directo
                    </span>
                  )}

                  {!step.live && (
                    <span
                      aria-hidden="true"
                      className="hidden h-px flex-1 bg-gray-300 lg:block lg:-mr-8"
                    />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">{step.title}</h3>

                <p className="max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
                  {step.description}
                </p>
              </div>
            </Fragment>
          ))}
        </div>

        <div
          {...reveal(
            460,
            "mx-auto flex max-w-xl flex-col items-center gap-3 border-t border-gray-200 pt-10 text-center",
          )}
        >
          <p className="text-sm text-gray-500">Crea tu competencia</p>
          <Link
            to="/admin/competitions/new"
            className="w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 sm:w-auto"
          >
            Empezar ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
