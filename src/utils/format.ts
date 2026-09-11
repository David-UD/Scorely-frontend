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