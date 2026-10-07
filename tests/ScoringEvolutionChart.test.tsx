import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeScoringRule } from "./fixtures";
import ScoringEvolutionChart from "@/components/admin/charts/ScoringEvolutionChart";
import { useAdminScoringRules } from "@/hooks/useAdminModules";

vi.mock("recharts", async () => await import("./mocks/recharts"));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminScoringRules: vi.fn(),
  };
});

const mockedRules = vi.mocked(useAdminScoringRules);

function chartData() {
  const el = screen.getByTestId("recharts-line-chart");
  return JSON.parse(el.getAttribute("data-chart-data")!);
}

beforeEach(() => {
  mockedRules.mockReset();
});

describe("ScoringEvolutionChart", () => {
  it("shows the loading spinner while fetching", () => {
    mockedRules.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<ScoringEvolutionChart competitionId={1} />);
    expect(screen.getByText(/Cargando reglas/)).toBeDefined();
  });

  it("shows an empty state when there are no scoring rules", () => {
    mockedRules.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    renderWithProviders(<ScoringEvolutionChart competitionId={1} />);
    expect(screen.getByText("Sin reglas de puntuación")).toBeDefined();
  });

  it("renders a line chart of points by position, sorted asc", () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeScoringRule({ id: 1, position: 3, points: 94 }),
          makeScoringRule({ id: 2, position: 1, points: 100 }),
          makeScoringRule({ id: 3, position: 2, points: 98 }),
        ],
      }),
    );
    renderWithProviders(<ScoringEvolutionChart competitionId={1} />);
    expect(chartData()).toEqual([
      { name: "1º", puntos: 100 },
      { name: "2º", puntos: 98 },
      { name: "3º", puntos: 94 },
    ]);
  });
});
