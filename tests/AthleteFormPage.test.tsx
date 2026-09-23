import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createTestQueryClient, renderWithProviders, queryResult } from "./utils";
import {
  makeAthlete,
  makeCompetition,
  makeCompetitionCategory,
  makeEnabledCompetitionCategory,
} from "./fixtures";
import { fetchAthlete } from "@/api/admin";
import AthleteFormPage from "@/pages/admin/AthleteFormPage";
import {
  useAdminCompetitionCategories,
  useAdminEnabledCategories,
} from "@/hooks/useAdminModules";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";

const createAthleteMutate = vi.fn();
const updateAthleteMutate = vi.fn();
const createCompetitorMutate = vi.fn();

vi.mock("@/api/admin", () => ({
  fetchAthlete: vi.fn(),
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useCreateAthlete: () => ({
      mutateAsync: createAthleteMutate,
      isPending: false,
    }),
    useUpdateAthlete: () => ({
      mutateAsync: updateAthleteMutate,
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
const mockedFetchAthlete = vi.mocked(fetchAthlete);

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
  createAthleteMutate.mockReset();
  updateAthleteMutate.mockReset();
  createCompetitorMutate.mockReset();
  vi.clearAllMocks();
  mockQueries();
});

afterEach(() => {
  localStorage.clear();
});

describe("AthleteFormPage", () => {
  it("creates an athlete without inscribing when the block is untouched", async () => {
    createAthleteMutate.mockResolvedValue(makeAthlete({ id: 30 }));
    createCompetitorMutate.mockResolvedValue({ id: 1 });
    const { container } = renderWithProviders(<AthleteFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sofía" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Ruiz" },
    });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(createAthleteMutate).toHaveBeenCalledWith({
        first_name: "Sofía",
        last_name: "Ruiz",
        birth_date: undefined,
        gender: "M",
      }),
    );
    expect(createCompetitorMutate).not.toHaveBeenCalled();
  });

  it("creates the athlete and then the individual inscription with the created id", async () => {
    createAthleteMutate.mockResolvedValue(makeAthlete({ id: 30 }));
    createCompetitorMutate.mockResolvedValue({ id: 9 });
    const { container } = renderWithProviders(<AthleteFormPage />);
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
      target: { value: "007" },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sofía" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Ruiz" },
    });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(createAthleteMutate).toHaveBeenCalledWith({
        first_name: "Sofía",
        last_name: "Ruiz",
        birth_date: undefined,
        gender: "M",
      }),
    );
    await waitFor(() =>
      expect(createCompetitorMutate).toHaveBeenCalledWith({
        competitor_type: "INDIVIDUAL",
        athlete: 30,
        team: null,
        registration_number: "007",
        competition: 1,
        enabled_competition_category: 1,
      }),
    );
  });

  it("shows a block error when a competition is chosen without a category", async () => {
    const { container } = renderWithProviders(<AthleteFormPage />);
    const form = container.querySelector("form") as HTMLFormElement;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Inscribir en competición (opcional)",
      }),
    );
    fireEvent.change(screen.getByLabelText("Competición"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sofía" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Ruiz" },
    });
    fireEvent.submit(form);

    expect(
      await screen.findByText("Seleccioná una categoría para inscribir."),
    ).toBeDefined();
    expect(createAthleteMutate).not.toHaveBeenCalled();
    expect(createCompetitorMutate).not.toHaveBeenCalled();
  });

  it("keeps the created athlete and warns when the inscription fails", async () => {
    createAthleteMutate.mockResolvedValue(makeAthlete({ id: 30 }));
    createCompetitorMutate.mockRejectedValue(new Error("boom"));
    const { container } = renderWithProviders(<AthleteFormPage />);
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
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sofía" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Ruiz" },
    });
    fireEvent.submit(form);

    expect(
      await screen.findByText(/El atleta se guardó, pero la inscripción falló/),
    ).toBeDefined();
    expect(createAthleteMutate).toHaveBeenCalledTimes(1);

    createCompetitorMutate.mockResolvedValue({ id: 9 });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(createCompetitorMutate).toHaveBeenCalledTimes(2),
    );
    expect(createAthleteMutate).toHaveBeenCalledTimes(1);
  });

  it("does not show the inscription block when editing", async () => {
    mockedFetchAthlete.mockResolvedValue(
      makeAthlete({ id: 5, first_name: "Ana", last_name: "López" }),
    );
    const client = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/admin/athletes/5/edit"]}>
          <Routes>
            <Route
              path="/admin/athletes/:id/edit"
              element={<AthleteFormPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findAllByText("Editar atleta")).toBeDefined();
    expect(screen.queryByText("Inscribir en competición (opcional)")).toBeNull();
    expect(
      container.querySelector('[id="inscribe_competition"]'),
    ).toBeNull();

    updateAthleteMutate.mockResolvedValue(makeAthlete({ id: 5 }));
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await waitFor(() =>
      expect(updateAthleteMutate).toHaveBeenCalledWith({
        id: 5,
        first_name: "Ana",
        last_name: "López",
        birth_date: "1992-04-12",
        gender: "F",
      }),
    );
    expect(createCompetitorMutate).not.toHaveBeenCalled();
  });
});