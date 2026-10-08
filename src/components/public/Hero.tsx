import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";
import portada from "@/assets/portada.webp";

const BENEFITS = ["Resultados en vivo", "Leaderboards públicos", "CrossFit & HYROX"];

const CHECK_ICON = (
  <svg
    className="size-3.5 shrink-0 text-brand-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RANK_ROWS = [
  { rank: "01", width: "w-24", lead: true },
  { rank: "02", width: "w-16" },
  { rank: "03", width: "w-10" },
];

const DOTS_STYLE = {
  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
  backgroundSize: "44px 44px",
  maskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, #000 30%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, #000 30%, transparent 100%)",
};

const REVEAL = "transition-all duration-500 ease-out";

export default function Hero() {
  const [visible, setVisible] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    setVisible(true);
  }, []);

  const reveal = (delay: number, base: string) => ({
    className: cn(
      base,
      REVEAL,
      visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
    ),
    style: { transitionDelay: `${delay}ms` },
  });

  const scrollToCompetitions = () => {
    document
      .getElementById("competiciones")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative isolate flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden bg-white px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
      <img
        src={portada}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-white/75 via-white/90 to-white/80"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={DOTS_STYLE}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-8 top-1/2 hidden -translate-y-1/2 flex-col gap-3 2xl:flex"
      >
        {RANK_ROWS.map((row) => (
          <div key={row.rank} className="flex items-center gap-3">
            <span className="text-theme-xs font-semibold text-gray-300">{row.rank}</span>
            <span
              className={cn(
                "h-1.5 rounded-full",
                row.lead ? "bg-brand-200" : "bg-gray-200",
                row.width,
              )}
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 2xl:block"
      >
        <svg
          className="text-gray-200"
          width="140"
          height="52"
          viewBox="0 0 140 52"
          fill="none"
        >
          <polyline
            points="2,46 28,38 54,42 80,24 106,28 136,6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="136" cy="6" r="4" className="fill-brand-400" />
        </svg>
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center gap-6 sm:gap-7">
        <p
          {...reveal(
            0,
            "text-theme-xs font-semibold uppercase tracking-[0.2em] text-brand-500",
          )}
        >
          Más que un número
        </p>

        <h1
          {...reveal(
            80,
            "text-title-sm font-semibold tracking-tight text-gray-900 text-balance sm:text-title-md lg:text-title-lg xl:text-title-xl",
          )}
        >
          <span className="block">Cada esfuerzo merece ser visto.</span>
          <span className="block font-medium text-brand-500">Cada resultado, recordado.</span>
        </h1>

        <p
          {...reveal(
            200,
            "max-w-2xl text-sm leading-relaxed text-gray-500 text-pretty sm:text-base",
          )}
        >
          Detrás de cada marcador hay horas de entrenamiento, disciplina y dedicación. Scorely
          convierte cada resultado en parte de la historia de quien lo conquistó.
        </p>

        <ul
          {...reveal(
            440,
            "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-gray-500 sm:text-sm",
          )}
        >
          {BENEFITS.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              {CHECK_ICON}
              {item}
            </li>
          ))}
        </ul>

        <div
          {...reveal(
            440,
            "flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row",
          )}
        >
          <button
            type="button"
            onClick={scrollToCompetitions}
            className="w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 sm:w-auto"
          >
            Ver competiciones
          </button>
          <Link
            to={isAuthenticated ? "/admin" : "/login"}
            className="w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 sm:w-auto"
          >
            Login
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToCompetitions}
        aria-label="Bajar a las competiciones"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full p-2 text-gray-400 transition hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
      >
        <svg
          className="size-5 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
