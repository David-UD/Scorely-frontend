import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import {
  makeAffiliation,
  makeAthlete,
  makeCompetition,
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
  makeEventCompetitor,
  makeScoringRule,
  makeTeam,
  makeWod,
} from "./fixtures";
import AdminDashboard from "@/pages/admin/AdminDashboard";

vi.mock("recharts", async () => await import("./mocks/recharts"));

import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";
import {
  useAdminAffiliations,
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
  useAdminEvents,
  useAdminScoringRules,
  useAdminTeams,
} from "@/hooks/useAdminModules";
import { fetchEventCompetitors } from "@/api/admin";

vi.mock("@/hooks/useAdminCompetitions", () => ({
  useAdminCompetitions: vi.fn(),
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminCompetitions: vi.fn(),
    useAdminAthletes: vi.fn(),
    useAdminTeams: vi.fn(),
    useAdminCompetitors: vi.fn(),
    useAdminEvents: vi.fn(),
    useAdminScoringRules: vi.fn(),
    useAdminAffiliations: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useAdminEnabledCategories: vi.fn(),
  };
});

vi.mock("@/api/admin", async () => {
  const actual = await vi.importActual<typeof import("@/api/admin")>("@/api/admin");
  return {
    ...actual,
    fetchEventCompetitors: vi.fn(),
  };
});

const mockedCompetitions = vi.mocked(useAdminCompetitions);
const mockedAthletes = vi.mocked(useAdminAthletes);
const mockedTeams = vi.mocked(useAdminTeams);
const mockedCompetitors = vi.mocked(useAdminCompetitors);
const mockedEvents = vi.mocked(useAdminEvents);
const mockedRules = vi.mocked(useAdminScoringRules);
const mockedAffiliations = vi.mocked(useAdminAffiliations);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedFetchEventCompetitors = vi.mocked(fetchEventCompetitors);

async function chartData(sectionTitle: string, testid: string) {
  const section = screen.getByText(sectionTitle).closest("section")!;
  const el = await within(section).findByTestId(testid);
  return JSON.parse(el.getAttribute("data-chart-data")!);
}

beforeEach(() => {
  mockedCompetitions.mockReset();
  mockedAthletes.mockReset();
  mockedTeams.mockReset();
  mockedCompetitors.mockReset();
  mockedEvents.mockReset();
  mockedRules.mockReset();
  mockedAffiliations.mockReset();
  mockedCatalog.mockReset();
  mockedEnabled.mockReset();
  mockedFetchEventCompetitors.mockReset();

  mockedCompetitions.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [makeCompetition({ id: 1, name: "Summer Games" })],
    }),
  );
  mockedAthletes.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [makeAthlete({ id: 1 }), makeAthlete({ id: 2 })],
    }),
  );
  mockedTeams.mockReturnValue(
    queryResult({ isLoading: false, data: [makeTeam({ id: 1 })] }),
  );
  mockedCompetitors.mockReturnValue(
    queryResult({ isLoading: false, data: [makeCompetitor({ id: 1 })] }),
  );
  mockedEvents.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [makeWod({ id: 1, phase: "QUALIFIER", event_number: 1 })],
    }),
  );
  mockedRules.mockReturnValue(queryResult({ isLoading: false, data: [] }));
  mockedAffiliations.mockReturnValue(queryResult({ isLoading: false, data: [] }));
  mockedCatalog.mockReturnValue(queryResult({ isLoading: false, data: [] }));
  mockedEnabled.mockReturnValue(queryResult({ isLoading: false, data: [] }));
  mockedFetchEventCompetitors.mockResolvedValue([
    makeEventCompetitor({ id: 1, score: 90 }),
  ]);
});

describe("AdminDashboard", () => {
  it("renders metric cards with totals", () => {
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByText("Atletas")).toBeDefined();
    expect(screen.getByText("Equipos")).toBeDefined();
    expect(screen.getByText("Inscripciones")).toBeDefined();
    expect(screen.getByText("Eventos")).toBeDefined();
  });

  it("renders the five charts", () => {
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByText("Atletas por afiliación")).toBeDefined();
    expect(screen.getByText("Equipos por afiliación")).toBeDefined();
    expect(screen.getByText("Inscripciones por categoría")).toBeDefined();
    expect(screen.getByText("Evolución del scoring")).toBeDefined();
    expect(screen.getByText("Resultados por evento")).toBeDefined();
  });

  it("feeds the athletes chart with affiliations resolved by name", async () => {
    mockedAffiliations.mockReturnValue(
      queryResult({ data: [makeAffiliation({ id: 1, name: "Box Norte" })] }),
    );
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAthlete({ id: 1, affiliation: 1 }),
          makeAthlete({ id: 2, affiliation: null }),
        ],
      }),
    );
    renderWithProviders(<AdminDashboard />);
    expect(await chartData("Atletas por afiliación", "recharts-bar-chart")).toEqual([
      { name: "Box Norte", count: 1 },
      { name: "Sin afiliación", count: 1 },
    ]);
  });

  it("feeds the categories chart with enabled categories only", async () => {
    mockedCatalog.mockReturnValue(
      queryResult({ data: [makeCompetitionCategory({ id: 1, name: "Scaled" })] }),
    );
    mockedEnabled.mockReturnValue(
      queryResult({
        data: [makeEnabledCompetitionCategory({ id: 1, competition_category: 1 })],
      }),
    );
    renderWithProviders(<AdminDashboard />);
    expect(await chartData("Inscripciones por categoría", "recharts-bar-chart")).toEqual([
      { name: "Scaled", count: 1 },
    ]);
  });

  it("feeds the scoring chart with rules sorted by position", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeScoringRule({ id: 1, position: 2, points: 98 }),
          makeScoringRule({ id: 2, position: 1, points: 100 }),
        ],
      }),
    );
    renderWithProviders(<AdminDashboard />);
    expect(await chartData("Evolución del scoring", "recharts-line-chart")).toEqual([
      { name: "1º", puntos: 100 },
      { name: "2º", puntos: 98 },
    ]);
  });

  it("feeds the results chart with the average score per event", async () => {
    renderWithProviders(<AdminDashboard />);
    await waitFor(() =>
      expect(screen.getByText("Resultados por evento")).toBeDefined(),
    );
    expect(await chartData("Resultados por evento", "recharts-bar-chart")).toEqual([
      { name: "WOD 1", promedio: 90 },
    ]);
  });
});
