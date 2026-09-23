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
const createAthleteMutate = vi.fn();
const createTeamMutate = vi.fn();

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
    useCreateAthlete: () => ({
      mutateAsync: createAthleteMutate,
      isPending: false,
    }),
    useCreateTeam: () => ({
      mutateAsync: createTeamMutate,
      isPending: false,
    }),
  };
});

const mockedAthletes = vi.mocked(useAdminAthletes);
const mockedTeams = vi.mocked(useAdminTeams);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);
const mockedFetchCompetitor = vi.mocked(fetchCompetitor);

let athletesData: ReturnType<typeof makeAthlete>[];
let teamsData: ReturnType<typeof makeTeam>[];

function mockQueries() {
  athletesData = [makeAthlete({ id: 10 }), makeAthlete({ id: 11, first_name: "Leo", last_name: "Mora" })];
  teamsData = [makeTeam({ id: 20 })];
  mockedAthletes.mockReturnValue(
    queryResult({
      isLoading: false,
      data: athletesData,
    }),
  );
  mockedTeams.mockReturnValue(
    queryResult({ isLoading: false, data: teamsData }),
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
  createAthleteMutate.mockReset();
  createTeamMutate.mockReset();
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

  it("creates an athlete inline and selects it in the form", async () => {
    createAthleteMutate.mockImplementation(async (payload: { id?: number }) => {
      const created = makeAthlete({ id: 99, first_name: "Sofía", last_name: "Ruiz" });
      mockedAthletes.mockReturnValue(
        queryResult({ isLoading: false, data: [...athletesData, created] }),
      );
      return { id: 99, ...payload };
    });
    renderWithProviders(<CompetitorFormPage />);

    fireEvent.click(screen.getByRole("button", { name: "+ Nuevo" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sofía" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Ruiz" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), {
      target: { value: "1995-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Sexo"), {
      target: { value: "F" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() =>
      expect(createAthleteMutate).toHaveBeenCalledWith({
        first_name: "Sofía",
        last_name: "Ruiz",
        birth_date: "1995-01-01",
        gender: "F",
      }),
    );
    await waitFor(() => {
      const athleteSelect = screen.getByLabelText("Atleta") as HTMLSelectElement;
      expect(athleteSelect.value).toBe("99");
    });
    expect(screen.getByRole("option", { name: "Sofía Ruiz" })).toBeDefined();
  });

  it("creates a team inline and selects it in the form", async () => {
    createTeamMutate.mockImplementation(async (payload: { name: string }) => {
      const created = makeTeam({ id: 77, name: "Team Alpha" });
      mockedTeams.mockReturnValue(
        queryResult({ isLoading: false, data: [...teamsData, created] }),
      );
      return { id: 77, ...payload };
    });
    renderWithProviders(<CompetitorFormPage />);

    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "TEAM" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nuevo" }));
    fireEvent.change(screen.getByLabelText("Nombre del equipo"), {
      target: { value: "Team Alpha" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() =>
      expect(createTeamMutate).toHaveBeenCalledWith({ name: "Team Alpha" }),
    );
    await waitFor(() => {
      const teamSelect = screen.getByLabelText("Equipo") as HTMLSelectElement;
      expect(teamSelect.value).toBe("77");
    });
    expect(screen.getByRole("option", { name: "Team Alpha" })).toBeDefined();
  });

  it("shows inline validation errors without creating when fields are missing", async () => {
    renderWithProviders(<CompetitorFormPage />);

    fireEvent.click(screen.getByRole("button", { name: "+ Nuevo" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    expect(await screen.findByText("Nombre es obligatorio")).toBeDefined();
    expect(screen.getByText("Apellido es obligatorio")).toBeDefined();
    expect(createAthleteMutate).not.toHaveBeenCalled();
  });

  it("shows an inline create error and keeps the panel open", async () => {
    createAthleteMutate.mockRejectedValue(new Error("boom"));
    renderWithProviders(<CompetitorFormPage />);

    fireEvent.click(screen.getByRole("button", { name: "+ Nuevo" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sofía" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Ruiz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    expect(
      await screen.findByText("No se pudo crear atleta. Intenta de nuevo."),
    ).toBeDefined();

    const athleteSelect = screen.getByLabelText("Atleta") as HTMLSelectElement;
    expect(athleteSelect.value).toBe("");
    expect(screen.queryByText("Crear atleta al instante")).toBeDefined();
  });

  it("closes the inline panel when switching competitor type", async () => {
    renderWithProviders(<CompetitorFormPage />);

    fireEvent.click(screen.getByRole("button", { name: "+ Nuevo" }));
    expect(screen.getByText("Crear atleta al instante")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "TEAM" },
    });

    expect(screen.queryByText("Crear atleta al instante")).toBeNull();
    expect(screen.queryByText("Crear equipo al instante")).toBeNull();
  });
});