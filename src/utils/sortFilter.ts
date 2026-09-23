export type SortDir = "asc" | "desc";

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function filterByName<T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
): T[] {
  const normalized = normalizeText(query);
  if (!normalized) return items;
  return items.filter((item) => normalizeText(getName(item)).includes(normalized));
}

export function sortByName<T>(
  items: T[],
  dir: SortDir,
  getName: (item: T) => string,
): T[] {
  const sorted = [...items].sort((a, b) =>
    getName(a).localeCompare(getName(b), "es"),
  );
  return dir === "desc" ? sorted.reverse() : sorted;
}