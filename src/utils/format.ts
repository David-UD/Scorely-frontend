export function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatBirthDate(iso?: string): string {
  if (!iso) return "—";
  return formatDate(iso);
}

export function stageLabel(stageType?: string): string {
  if (!stageType) return "—";
  const key = stageType.toLowerCase();
  const labels: Record<string, string> = {
    qualifier: "Qualifier",
    final: "Final",
  };
  return labels[key] ?? stageType;
}

export function formatDateRange(startDate: string, endDate?: string): string {
  if (!startDate) return "";
  if (!endDate || endDate === startDate) return formatDate(startDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} — ${endDate}`;
  }
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();
  const startStr = start.toLocaleDateString("es-ES", {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short", year: "numeric" }),
    timeZone: "UTC",
  });
  const endStr = end.toLocaleDateString("es-ES", {
    day: "numeric",
    ...(sameMonth ? { month: "short", year: "numeric" } : {}),
    timeZone: "UTC",
  });
  return `${startStr} — ${endStr}`;
}