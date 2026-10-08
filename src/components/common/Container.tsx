import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export default function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
