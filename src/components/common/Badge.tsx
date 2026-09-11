import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "error"
  | "warning"
  | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  brand: "bg-brand-50 text-brand-600",
  success: "bg-success-50 text-success-700",
  error: "bg-error-50 text-error-700",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-blue-light-50 text-blue-light-700",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export default function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}