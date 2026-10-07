import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeEventCompetitor, makeWod } from "./fixtures";
import ResultsByEventChart from "@/components/admin/charts/ResultsByEventChart";
import { useAdminEvents } from "@/hooks/useAdminModules";

vi.mock("recharts", async () => await import("./mocks/recharts"));
import { fetchEventCompetitors } from "@/api/admin";

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminEvents: vi.fn(),
  };
});

vi.mock("@/api/admin", async () => {
  const actual = await vi.importActual<typeof import("@/api/admin")>("@/api/admin");
  return {
    ...actual,
    fetchEventCompetitors: vi.fn(),
  };
});

const mockedEvents = vi.mocked(useAdminEvents);
const mockedFetchEventCompetitors = vi.mocked(fetchEventCompetitors);

function chartData() {
  const el = screen.getByTestId("recharts-bar-chart");
  return JSON.parse(el.getAttribute("data-chart-data")!);
}

beforeEach(() => {
  mockedEvents.mockReset();
  mockedFetchEventCompetitors.mockReset();
});

describe("ResultsByEventChart", () => {
  it("shows the loading spinner while fetching events", () => {
    mockedEvents.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<ResultsByEventChart competitionId={1} />);
    expect(screen.getByText(/Cargando resultados/)).toBeDefined();
  });

  it("shows an empty state when no event has results", async () => {
    mockedEvents.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeWod({ id: 1 }), makeWod({ id: 2, phase: "FINAL", event_number: 2 })],
      }),
    );
    mockedFetchEventCompetitors.mockResolvedValue([
      makeEventCompetitor({ id: 1, score: null }),
    ]);
    renderWithProviders(<ResultsByEventChart competitionId={1} />);
    expect(await screen.findByText("Sin resultados")).toBeDefined();
  });

  it("renders average score per event, with Final labeled by phase", async () => {
    mockedEvents.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeWod({ id: 1, phase: "QUALIFIER", event_number: 1 }),
          makeWod({ id: 2, phase: "FINAL", event_number: 2 }),
        ],
      }),
    );
    mockedFetchEventCompetitors.mockImplementation(async (eventId) =>
      eventId === 1
        ? [
            makeEventCompetitor({ id: 1, score: 100 }),
            makeEventCompetitor({ id: 2, score: 50 }),
          ]
        : [makeEventCompetitor({ id: 3, score: 80 })],
    );
    renderWithProviders(<ResultsByEventChart competitionId={1} />);
    await waitFor(() => {
      expect(chartData()).toEqual([
        { name: "WOD 1", promedio: 75 },
        { name: "Final", promedio: 80 },
      ]);
    });
  });
});
