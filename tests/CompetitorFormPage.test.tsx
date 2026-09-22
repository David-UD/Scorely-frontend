import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createTestQueryClient, renderWithProviders, queryResult } from "./utils";
import {
  makeAthlete,
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
  makeTeam,
} from "./fixtures";
import { fetchCompetitor } from "@/api/admin";
import CompetitorFormPage from "@/pages/admin/CompetitorFormPage";
import {
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
  useAdminTeams,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock("@/components/admin/CompetitionScopeSelect", () => ({
  default: () => null,
}));

vi.mock("@/api/admin", () => ({
  fetchCompetitor: vi.fn(),
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminAthletes: vi.fn(),
    useAdminTeams: vi.fn(),
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useCreateCompetitor: () => ({ mutateAsync: createMutate, isPending: false }),
    useUpdateCompetitor: () => ({ mutateAsync: updateMutate, isPending: false }),
  };
});

const mockedAthletes = vi.mocked(useAdminAthletes);
const mockedTeams = vi.mocked(useAdminTeams);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);
const mockedFetchCompetitor = vi.mocked(fetchCompetitor);

function mockQueries() {
  mockedAthletes.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [makeAthlete({ id: 10 }), makeAthlete({ id: 11, first_name: "Leo", last_name: "Mora" })],
    }),
  );
  mockedTeams.mockReturnValue(
    queryResult({ isLoading: false, data: [makeTeam({ id: 20 })] }),
  );
  mockedEnabled.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [makeEnabledCompetitionCategory({ id: 1, competition_category: 2 })],
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
  createMutate.mockReset();
  updateMutate.mockReset();
  vi.clearAllMocks();
  mockQueries();
});

afterEach(() => {
  useAdminScopeStore.setState({ competitionId: null });
  localStorage.clear();
});

describe("CompetitorFormPage", () => {
  it("blocks submit without a competition selected", () => {
    useAdminScopeStore.setState({ competitionId: null });
    renderWithProviders(<CompetitorFormPage />);
    expect(
      screen.getByText("Seleccioná una competición para inscribir un competidor."),
    ).toBeDefined();
    expect(screen.queryByText("Crear competidor")).toBeNull();
  });

  it("submits an individual registration with athlete and team null", async () => {
    createMutate.mockResolvedValue({ id: 9 });
    const { container } = renderWithProviders(<CompetitorFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.change(screen.getByLabelText("Nº de inscripción"), {
      target: { value: "007" },
    });
    fireEvent.change(screen.getByLabelText("Atleta"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "1" },
    });

    fireEvent.submit(form);

    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith({
        competitor_type: "INDIVIDUAL",
        registration_number: "007",
        enabled_competition_category: 1,
        competition: 1,
        athlete: 10,
        team: null,
      }),
    );
  });

  it("toggles to a team registration sending athlete null", async () => {
    createMutate.mockResolvedValue({ id: 9 });
    const { container } = renderWithProviders(<CompetitorFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "TEAM" },
    });

    fireEvent.change(screen.getByLabelText("Nº de inscripción"), {
      target: { value: "008" },
    });
    fireEvent.change(screen.getByLabelText("Equipo"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "1" },
    });

    fireEvent.submit(form);

    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith({
        competitor_type: "TEAM",
        registration_number: "008",
        enabled_competition_category: 1,
        competition: 1,
        athlete: null,
        team: 20,
      }),
    );
  });

  it("shows validation errors without submitting when fields are missing", async () => {
    const { container } = renderWithProviders(<CompetitorFormPage />);
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(
      await screen.findByText("El número de inscripción es obligatorio"),
    ).toBeDefined();
    expect(screen.getByText("Seleccioná un atleta")).toBeDefined();
    expect(screen.getByText("Seleccioná una categoría")).toBeDefined();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("preloads the record and PATCHes keeping its competition", async () => {
    mockedFetchCompetitor.mockResolvedValue(
      makeCompetitor({
        id: 5,
        competitor_type: "INDIVIDUAL",
        athlete: 10,
        registration_number: "007",
        competition: 1,
        enabled_competition_category: 1,
      }),
    );
    updateMutate.mockResolvedValue({ id: 5 });
    const client = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/admin/competitors/5/edit"]}>
          <Routes>
            <Route
              path="/admin/competitors/:id/edit"
              element={<CompetitorFormPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText("Editar competidor")).length).toBeGreaterThan(0);
    expect(await screen.findByDisplayValue("007")).toBeDefined();
    const athleteSelect = screen.getByLabelText("Atleta") as HTMLSelectElement;
    expect(athleteSelect.value).toBe("10");

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() =>
      expect(updateMutate).toHaveBeenCalledWith({
        id: 5,
        competitor_type: "INDIVIDUAL",
        registration_number: "007",
        enabled_competition_category: 1,
        competition: 1,
        athlete: 10,
        team: null,
      }),
    );
  });

  it("shows the message when the competition has no enabled categories", () => {
    mockedEnabled.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CompetitorFormPage />);
    expect(
      screen.getByText(/No hay categorías habilitadas para esta competición/),
    ).toBeDefined();
  });
});