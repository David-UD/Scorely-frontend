import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import {
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
} from "./fixtures";
import CompetitorsByCategoryChart from "@/components/admin/charts/CompetitorsByCategoryChart";

vi.mock("recharts", async () => await import("./mocks/recharts"));

import {
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
} from "@/hooks/useAdminModules";

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminCompetitors: vi.fn(),
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
  };
});

const mockedCompetitors = vi.mocked(useAdminCompetitors);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);

function chartData() {
  const el = screen.getByTestId("recharts-bar-chart");
  return JSON.parse(el.getAttribute("data-chart-data")!);
}

beforeEach(() => {
  mockedCompetitors.mockReset();
  mockedEnabled.mockReset();
  mockedCatalog.mockReset();
});

describe("CompetitorsByCategoryChart", () => {
  it("shows the loading spinner while fetching", () => {
    mockedCompetitors.mockReturnValue(queryResult({ isLoading: true }));
    mockedEnabled.mockReturnValue(queryResult({ data: [] }));
    mockedCatalog.mockReturnValue(queryResult({ data: [] }));
    renderWithProviders(<CompetitorsByCategoryChart competitionId={1} />);
    expect(screen.getByText(/Cargando inscripciones/)).toBeDefined();
  });

  it("shows an empty state when there are no inscriptions", () => {
    mockedCompetitors.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    mockedEnabled.mockReturnValue(queryResult({ data: [] }));
    mockedCatalog.mockReturnValue(queryResult({ data: [] }));
    renderWithProviders(<CompetitorsByCategoryChart competitionId={1} />);
    expect(screen.getByText("Sin inscripciones")).toBeDefined();
  });

  it("counts only inscriptions in enabled categories, resolved by catalog name", () => {
    mockedCatalog.mockReturnValue(
      queryResult({
        data: [
          makeCompetitionCategory({ id: 1, name: "Scaled" }),
          makeCompetitionCategory({ id: 2, name: "Rx" }),
        ],
      }),
    );
    mockedEnabled.mockReturnValue(
      queryResult({
        data: [makeEnabledCompetitionCategory({ id: 1, competition_category: 1 })],
      }),
    );
    mockedCompetitors.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeCompetitor({ id: 1, enabled_competition_category: 1 }),
          makeCompetitor({ id: 2, enabled_competition_category: 1 }),
          makeCompetitor({ id: 3, enabled_competition_category: 2 }),
        ],
      }),
    );
    renderWithProviders(<CompetitorsByCategoryChart competitionId={1} />);
    expect(chartData()).toEqual([{ name: "Scaled", count: 2 }]);
  });
});
