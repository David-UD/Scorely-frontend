import Badge from "./Badge";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "brand" | "success" | "error" | "warning" | "info" }> = {
  published: { label: "Publicada", tone: "success" },
  finished: { label: "Finalizada", tone: "neutral" },
  upcoming: { label: "Próxima", tone: "info" },
  draft: { label: "Borrador", tone: "warning" },
  cancelled: { label: "Cancelada", tone: "error" },
};

interface StatusBadgeProps {
  code: string;
  name?: string;
}

export default function StatusBadge({ code, name }: StatusBadgeProps) {
  const config = STATUS_LABELS[code.toLowerCase()];
  return <Badge tone={config?.tone ?? "brand"}>{config?.label ?? name ?? code}</Badge>;
}