import type { CategoryRef } from "@/types";

interface LeaderboardFiltersProps {
  categories: CategoryRef[];
  selectedCategoryCode: string;
  onChange: (code: string) => void;
}

export default function LeaderboardFilters({
  categories,
  selectedCategoryCode,
  onChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="category-filter"
        className="whitespace-nowrap text-sm font-medium text-gray-600"
      >
        Categoría
      </label>
      <select
        id="category-filter"
        value={selectedCategoryCode}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {categories.map((cat) => (
          <option key={cat.code} value={cat.code}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}