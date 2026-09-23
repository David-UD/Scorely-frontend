import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createTestQueryClient, renderWithProviders, queryResult } from "./utils";
import {
  makeCompetition,
  makeCompetitionCategory,
  makeEnabledCompetitionCategory,
  makeTeam,
} from "./fixtures";
import { fetchTeam } from "@/api/admin";
import TeamFormPage from "@/pages/admin/TeamFormPage";
import {
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
} from "@/hooks/useAdminModules";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";

const createTeamMutate = vi.fn();
const updateTeamMutate = vi.fn();
const createCompetitorMutate = vi.fn();

vi.mock("@/api/admin", () => ({
  fetchTeam: vi.fn(),
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useCreateTeam: () => ({
      mutateAsync: createTeamMutate,
      isPending: false,
    }),
    useUpdateTeam: () => ({
      mutateAsync: updateTeamMutate,
      isPending: false,
    }),
    useCreateCompetitor: () => ({
      mutateAsync: createCompetitorMutate,
      isPending: false,
    }),
  };
});

vi.mock("@/hooks/useAdminCompetitions", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/useAdminCompetitions")
  >("@/hooks/useAdminCompetitions");
  return {
    ...actual,
    useAdminCompetitions: vi.fn(),
  };
});

const mockedCompetitions = vi.mocked(useAdminCompetitions);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);
const mockedFetchTeam = vi.mocked(fetchTeam);

function mockQueries() {
  mockedCompetitions.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [
        makeCompetition({ id: 1 }),
        makeCompetition({ id: 2, name: "Summer Games" }),
      ],
    }),
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
      data: [makeCompetitionCategory({ id: 2, name: "RX Individual" })],
    }),
  );
}

beforeEach(() => {
  createTeamMutate.mockReset();
  updateTeamMutate.mockReset();
  createCompetitorMutate.mockReset();
  vi.clearAllMocks();
  mockQueries();
});

afterEach(() => {
  localStorage.clear();
});

describe("TeamFormPage", () => {
  it("creates a team without inscribing when the block is untouched", async () => {
    createTeamMutate.mockResolvedValue(makeTeam({ id: 20 }));
    createCompetitorMutate.mockResolvedValue({ id: 1 });
    const { container } = renderWithProviders(<TeamFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.change(screen.getByLabelText("Nombre del equipo"), {
      target: { value: "Team El Pilar" },
    });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(createTeamMutate).toHaveBeenCalledWith({ name: "Team El Pilar" }),
    );
    expect(createCompetitorMutate).not.toHaveBeenCalled();
  });

  it("creates the team and then the team inscription with the created id", async () => {
    createTeamMutate.mockResolvedValue(makeTeam({ id: 20 }));
    createCompetitorMutate.mockResolvedValue({ id: 9 });
    const { container } = renderWithProviders(<TeamFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Inscribir en competición (opcional)",
      }),
    );
    fireEvent.change(screen.getByLabelText("Competición"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nº de inscripción (opcional)"), {
      target: { value: "008" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del equipo"), {
      target: { value: "Team El Pilar" },
    });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(createTeamMutate).toHaveBeenCalledWith({ name: "Team El Pilar" }),
    );
    await waitFor(() =>
      expect(createCompetitorMutate).toHaveBeenCalledWith({
        competitor_type: "TEAM",
        athlete: null,
        team: 20,
        registration_number: "008",
        competition: 1,
        enabled_competition_category: 1,
      }),
    );
  });

  it("shows a block error when a competition is chosen without a category", async () => {
    const { container } = renderWithProviders(<TeamFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Inscribir en competición (opcional)",
      }),
    );
    fireEvent.change(screen.getByLabelText("Competición"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del equipo"), {
      target: { value: "Team El Pilar" },
    });
    fireEvent.submit(form);

    expect(
      await screen.findByText("Seleccioná una categoría para inscribir."),
    ).toBeDefined();
    expect(createTeamMutate).not.toHaveBeenCalled();
    expect(createCompetitorMutate).not.toHaveBeenCalled();
  });

  it("keeps the created team and warns when the inscription fails", async () => {
    createTeamMutate.mockResolvedValue(makeTeam({ id: 20 }));
    createCompetitorMutate.mockRejectedValue(new Error("boom"));
    const { container } = renderWithProviders(<TeamFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Inscribir en competición (opcional)",
      }),
    );
    fireEvent.change(screen.getByLabelText("Competición"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del equipo"), {
      target: { value: "Team El Pilar" },
    });
    fireEvent.submit(form);

    expect(
      await screen.findByText(/El equipo se guardó, pero la inscripción falló/),
    ).toBeDefined();
    expect(createTeamMutate).toHaveBeenCalledTimes(1);

    createCompetitorMutate.mockResolvedValue({ id: 9 });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(createCompetitorMutate).toHaveBeenCalledTimes(2),
    );
    expect(createTeamMutate).toHaveBeenCalledTimes(1);
  });

  it("does not show the inscription block when editing", async () => {
    mockedFetchTeam.mockResolvedValue(makeTeam({ id: 5, name: "Team Alpha" }));
    const client = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/admin/teams/5/edit"]}>
          <Routes>
            <Route
              path="/admin/teams/:id/edit"
              element={<TeamFormPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findAllByText("Editar equipo")).toBeDefined();
    expect(screen.queryByText("Inscribir en competición (opcional)")).toBeNull();

    updateTeamMutate.mockResolvedValue(makeTeam({ id: 5 }));
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await waitFor(() =>
      expect(updateTeamMutate).toHaveBeenCalledWith({
        id: 5,
        name: "Team Alpha",
      }),
    );
    expect(createCompetitorMutate).not.toHaveBeenCalled();
  });
});