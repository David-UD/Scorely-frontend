import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeAffiliation, makeAthlete } from "./fixtures";
import AthletesByAffiliationChart from "@/components/admin/charts/AthletesByAffiliationChart";
import { useAdminAffiliations, useAdminAthletes } from "@/hooks/useAdminModules";

vi.mock("recharts", async () => await import("./mocks/recharts"));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminAthletes: vi.fn(),
    useAdminAffiliations: vi.fn(),
  };
});

const mockedAthletes = vi.mocked(useAdminAthletes);
const mockedAffiliations = vi.mocked(useAdminAffiliations);

function chartData() {
  const el = screen.getByTestId("recharts-bar-chart");
  return JSON.parse(el.getAttribute("data-chart-data")!);
}

beforeEach(() => {
  mockedAthletes.mockReset();
  mockedAffiliations.mockReset();
});

describe("AthletesByAffiliationChart", () => {
  it("shows the loading spinner while fetching", () => {
    mockedAthletes.mockReturnValue(queryResult({ isLoading: true }));
    mockedAffiliations.mockReturnValue(queryResult({ data: [] }));
    renderWithProviders(<AthletesByAffiliationChart />);
    expect(screen.getByText(/Cargando atletas/)).toBeDefined();
  });

  it("shows an empty state when there are no athletes", () => {
    mockedAthletes.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    mockedAffiliations.mockReturnValue(queryResult({ data: [] }));
    renderWithProviders(<AthletesByAffiliationChart />);
    expect(screen.getByText("Sin atletas")).toBeDefined();
  });

  it("renders a bar chart with athletes grouped by affiliation", () => {
    mockedAffiliations.mockReturnValue(
      queryResult({
        data: [makeAffiliation({ id: 1, name: "Box Norte" })],
      }),
    );
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAthlete({ id: 1, affiliation: 1 }),
          makeAthlete({ id: 2, affiliation: 1 }),
          makeAthlete({ id: 3, affiliation: null }),
        ],
      }),
    );
    renderWithProviders(<AthletesByAffiliationChart />);
    expect(chartData()).toEqual([
      { name: "Box Norte", count: 2 },
      { name: "Sin afiliación", count: 1 },
    ]);
  });
});
