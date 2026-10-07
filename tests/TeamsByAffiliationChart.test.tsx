import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeAffiliation, makeTeam } from "./fixtures";
import TeamsByAffiliationChart from "@/components/admin/charts/TeamsByAffiliationChart";
import { useAdminAffiliations, useAdminTeams } from "@/hooks/useAdminModules";

vi.mock("recharts", async () => await import("./mocks/recharts"));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminTeams: vi.fn(),
    useAdminAffiliations: vi.fn(),
  };
});

const mockedTeams = vi.mocked(useAdminTeams);
const mockedAffiliations = vi.mocked(useAdminAffiliations);

function chartData() {
  const el = screen.getByTestId("recharts-pie");
  return JSON.parse(el.getAttribute("data-chart-data")!);
}

beforeEach(() => {
  mockedTeams.mockReset();
  mockedAffiliations.mockReset();
});

describe("TeamsByAffiliationChart", () => {
  it("shows the loading spinner while fetching", () => {
    mockedTeams.mockReturnValue(queryResult({ isLoading: true }));
    mockedAffiliations.mockReturnValue(queryResult({ data: [] }));
    renderWithProviders(<TeamsByAffiliationChart />);
    expect(screen.getByText(/Cargando equipos/)).toBeDefined();
  });

  it("shows an empty state when there are no teams", () => {
    mockedTeams.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    mockedAffiliations.mockReturnValue(queryResult({ data: [] }));
    renderWithProviders(<TeamsByAffiliationChart />);
    expect(screen.getByText("Sin equipos")).toBeDefined();
  });

  it("renders a pie chart with teams grouped by affiliation", () => {
    mockedAffiliations.mockReturnValue(
      queryResult({
        data: [makeAffiliation({ id: 1, name: "Box Norte" })],
      }),
    );
    mockedTeams.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeTeam({ id: 1, affiliation: 1 }),
          makeTeam({ id: 2, affiliation: null }),
        ],
      }),
    );
    renderWithProviders(<TeamsByAffiliationChart />);
    expect(chartData()).toEqual([
      { name: "Box Norte", count: 1 },
      { name: "Sin afiliación", count: 1 },
    ]);
  });
});
