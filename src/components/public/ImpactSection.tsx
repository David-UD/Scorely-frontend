import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

export default function ImpactSection({ className }: { className?: string }) {
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
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="impact-title" className={cn("bg-white", className)}>
      <div
        ref={ref}
        className={cn(
          "mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center transition-all duration-700 ease-out sm:gap-7 sm:px-6 sm:py-28 lg:px-8",
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <p className="text-theme-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
          Más allá del marcador
        </p>

        <h2
          id="impact-title"
          className="text-title-sm font-semibold tracking-tight text-gray-900 text-balance sm:text-title-md lg:text-title-lg"
        >
          <span className="block">Cada punto tiene un porqué.</span>
          <span className="block text-brand-500">Cada puesto, una historia.</span>
        </h2>

        <div aria-hidden="true" className="mt-1 h-1 w-40 rounded-full bg-gray-100 sm:w-56">
          <div className="h-1 w-2/3 rounded-full bg-brand-500" />
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Scorely conserva cada competencia, cada división y cada marca para que los resultados
          sigan hablando cuando el evento ya terminó.
        </p>
      </div>
    </section>
  );
}
