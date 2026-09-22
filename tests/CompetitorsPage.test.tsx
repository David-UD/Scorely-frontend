import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import {
  makeAthlete,
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
  makeTeam,
} from "./fixtures";
import CompetitorsPage from "@/pages/admin/CompetitorsPage";
import {
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
  useAdminTeams,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";

const deleteMutate = vi.fn();

vi.mock("@/components/admin/CompetitionScopeSelect", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminCompetitors: vi.fn(),
    useAdminTeams: vi.fn(),
    useAdminAthletes: vi.fn(),
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useDeleteCompetitor: () => ({
      mutate: deleteMutate,
      isPending: false,
    }),
  };
});

const mockedCompetitors = vi.mocked(useAdminCompetitors);
const mockedTeams = vi.mocked(useAdminTeams);
const mockedAthletes = vi.mocked(useAdminAthletes);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);

function mockQueries() {
  mockedCompetitors.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [
        makeCompetitor({
          id: 1,
          competitor_type: "INDIVIDUAL",
          athlete: 10,
          registration_number: "001",
          enabled_competition_category: 1,
        }),
        makeCompetitor({
          id: 2,
          competitor_type: "TEAM",
          athlete: null,
          team: 20,
          registration_number: "002",
          enabled_competition_category: 1,
        }),
      ],
    }),
  );
  mockedTeams.mockReturnValue(
    queryResult({ isLoading: false, data: [makeTeam({ id: 20 })] }),
  );
  mockedAthletes.mockReturnValue(
    queryResult({ isLoading: false, data: [makeAthlete({ id: 10 })] }),
  );
  mockedEnabled.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [
        makeEnabledCompetitionCategory({ id: 1, competition_category: 2 }),
      ],
    }),
  );
  mockedCatalog.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [makeCompetitionCategory({ id: 2, name: "Team Mixed" })],
    }),
  );
}

beforeEach(() => {
  useAdminScopeStore.setState({ competitionId: 1 });
  deleteMutate.mockReset();
  vi.clearAllMocks();
  mockQueries();
});

afterEach(() => {
  useAdminScopeStore.setState({ competitionId: null });
  localStorage.clear();
});

describe("CompetitorsPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedCompetitors.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<CompetitorsPage />);
    expect(screen.getByText(/Cargando competidores/)).toBeDefined();
  });

  it("renders competitors with names, type and category", () => {
    renderWithProviders(<CompetitorsPage />);
    expect(screen.getByText("001")).toBeDefined();
    expect(screen.getByText("Ana López")).toBeDefined();
    expect(screen.getByText("002")).toBeDefined();
    expect(screen.getByText("Team El Pilar")).toBeDefined();
    expect(screen.getByText("Individual")).toBeDefined();
    expect(screen.getByText("Equipo")).toBeDefined();
    expect(screen.getAllByText("Team Mixed")).toHaveLength(2);
    expect(screen.getByText("Nuevo competidor")).toBeDefined();
  });

  it("disables the new button without a selected competition", () => {
    useAdminScopeStore.setState({ competitionId: null });
    renderWithProviders(<CompetitorsPage />);
    expect(screen.getByText("Nuevo competidor")).toBeDisabled();
  });

  it("shows an empty state when there are no competitors", () => {
    mockedCompetitors.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CompetitorsPage />);
    expect(screen.getByText("Sin competidores")).toBeDefined();
  });

  it("shows a clear error when deleting a competitor in use", async () => {
    deleteMutate.mockImplementation(
      (
        _id: number,
        options: { onError?: (err: Error) => void; onSettled?: () => void },
      ) => {
        options?.onError?.(new Error("No se pudo eliminar la inscripción"));
        options?.onSettled?.();
      },
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<CompetitorsPage />);
    screen.getAllByText("Eliminar")[0].click();
    expect(await screen.findByRole("alert")).toBeDefined();
    confirmSpy.mockRestore();
  });
});