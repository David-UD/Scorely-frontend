import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders, queryResult } from "./utils";
import {
  makeAthlete,
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
  makeEventCompetitor,
  makeTeam,
  makeWod,
} from "./fixtures";
import type { EventCompetitor } from "@/types";
import ScoresPage from "@/pages/admin/ScoresPage";
import {
  useAdminAthletes,
  useAdminCompetitionCategories,
  useAdminCompetitors,
  useAdminEnabledCategories,
  useAdminEventCompetitors,
  useAdminEvents,
  useAdminTeams,
} from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();

vi.mock("@/components/admin/CompetitionScopeSelect", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminEvents: vi.fn(),
    useAdminCompetitors: vi.fn(),
    useAdminTeams: vi.fn(),
    useAdminAthletes: vi.fn(),
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useAdminEventCompetitors: vi.fn(),
    useCreateEventCompetitor: () => ({
      mutateAsync: createMutateAsync,
      isPending: false,
    }),
    useUpdateEventCompetitor: () => ({
      mutateAsync: updateMutateAsync,
      isPending: false,
    }),
    useDeleteEventCompetitor: () => ({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    }),
  };
});

const mockedEvents = vi.mocked(useAdminEvents);
const mockedCompetitors = vi.mocked(useAdminCompetitors);
const mockedTeams = vi.mocked(useAdminTeams);
const mockedAthletes = vi.mocked(useAdminAthletes);
const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);
const mockedResults = vi.mocked(useAdminEventCompetitors);

function mockQueries() {
  mockedEvents.mockReturnValue(
    queryResult({ isLoading: false, data: [makeWod({ id: 1 })] }),
  );
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
      data: [makeCompetitionCategory({ id: 2, name: "RX" })],
    }),
  );
  mockedResults.mockReturnValue(
    queryResult({ isLoading: false, data: [] }),
  );
}

function selectEvent() {
  fireEvent.change(screen.getByLabelText("Evento (WOD)"), {
    target: { value: "1" },
  });
}

function renderWithEvent(eventResults: EventCompetitor[] = []) {
  const view = renderWithProviders(<ScoresPage />);
  selectEvent();
  mockedResults.mockReturnValue(
    queryResult({ isLoading: false, data: eventResults }),
  );
  view.rerender(
    <QueryClientProvider client={view.client}>
      <MemoryRouter initialEntries={["/"]}>{<ScoresPage />}</MemoryRouter>
    </QueryClientProvider>,
  );
  return view;
}

beforeEach(() => {
  useAdminScopeStore.setState({ competitionId: 1 });
  createMutateAsync.mockReset();
  updateMutateAsync.mockReset();
  deleteMutateAsync.mockReset();
  vi.clearAllMocks();
  mockQueries();
  createMutateAsync.mockResolvedValue({});
  updateMutateAsync.mockResolvedValue({});
  deleteMutateAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  useAdminScopeStore.setState({ competitionId: null });
  localStorage.clear();
});

describe("ScoresPage", () => {
  it("shows the loading spinner while fetching the grid", () => {
    mockedEvents.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<ScoresPage />);
    expect(screen.getByText(/Cargando resultados/)).toBeDefined();
  });

  it("renders the grid with competitors and preloaded result inputs", () => {
    renderWithEvent([
      makeEventCompetitor({
        id: 100,
        competitor: 1,
        event: 1,
        result: "06:12",
      }),
      makeEventCompetitor({
        id: 101,
        competitor: 2,
        event: 1,
        result: "150",
      }),
    ]);
    expect(screen.getByText("001")).toBeDefined();
    expect(screen.getByText("Ana López")).toBeDefined();
    expect(screen.getByText("002")).toBeDefined();
    expect(screen.getByText("Team El Pilar")).toBeDefined();
    expect(screen.getByText("Individual")).toBeDefined();
    expect(screen.getByText("Equipo")).toBeDefined();
    expect(screen.getByRole("table")).toBeDefined();
    expect(
      screen.getByRole("table").querySelectorAll("tbody tr"),
    ).toHaveLength(2);
    expect(
      (screen.getByLabelText("Resultado de Ana López") as HTMLInputElement).value,
    ).toBe("06:12");
    expect(
      (screen.getByLabelText("Resultado de Team El Pilar") as HTMLInputElement)
        .value,
    ).toBe("150");
  });

  it("creates a new event result for a row without an id", async () => {
    renderWithEvent();
    fireEvent.change(screen.getByLabelText("Resultado de Ana López"), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByText("Guardar resultados"));
    await waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        competitor: 1,
        event: 1,
        result: "150",
      }),
    );
  });

  it("updates the result of an existing row", async () => {
    renderWithEvent([
      makeEventCompetitor({
        id: 100,
        competitor: 1,
        event: 1,
        result: "06:12",
      }),
    ]);
    fireEvent.change(screen.getByLabelText("Resultado de Ana López"), {
      target: { value: "03:20" },
    });
    fireEvent.click(screen.getByText("Guardar resultados"));
    await waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 100,
        result: "03:20",
      }),
    );
  });

  it("deletes the result when the input is cleared", async () => {
    renderWithEvent([
      makeEventCompetitor({
        id: 100,
        competitor: 1,
        event: 1,
        result: "06:12",
      }),
    ]);
    fireEvent.change(screen.getByLabelText("Resultado de Ana López"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Guardar resultados"));
    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith(100));
  });

  it("shows an alert and keeps inputs when a mutation fails", async () => {
    updateMutateAsync.mockRejectedValueOnce(new Error("fallo"));
    renderWithEvent([
      makeEventCompetitor({
        id: 100,
        competitor: 1,
        event: 1,
        result: "06:12",
      }),
    ]);
    fireEvent.change(screen.getByLabelText("Resultado de Ana López"), {
      target: { value: "03:20" },
    });
    fireEvent.click(screen.getByText("Guardar resultados"));
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(
      (screen.getByLabelText("Resultado de Ana López") as HTMLInputElement).value,
    ).toBe("03:20");
    expect(screen.queryByText("Resultados guardados correctamente.")).toBeNull();
  });

  it("shows a success toast after saving", async () => {
    renderWithEvent();
    fireEvent.change(screen.getByLabelText("Resultado de Ana López"), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByText("Guardar resultados"));
    expect(
      await screen.findByText("Resultados guardados correctamente."),
    ).toBeDefined();
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("filters the grid by selected category", () => {
    mockedEnabled.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeEnabledCompetitionCategory({ id: 1, competition_category: 2 }),
          makeEnabledCompetitionCategory({ id: 3, competition_category: 4 }),
        ],
      }),
    );
    mockedCatalog.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeCompetitionCategory({ id: 2, name: "RX" }),
          makeCompetitionCategory({ id: 4, name: "Scaled" }),
        ],
      }),
    );
    mockedCompetitors.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeCompetitor({
            id: 1,
            enabled_competition_category: 1,
          }),
          makeCompetitor({
            id: 2,
            competitor_type: "TEAM",
            athlete: null,
            team: 20,
            enabled_competition_category: 3,
          }),
        ],
      }),
    );
    renderWithEvent();
    expect(screen.getByText("Ana López")).toBeDefined();
    expect(screen.getByText("Team El Pilar")).toBeDefined();
    fireEvent.change(screen.getByLabelText(/Categoría/), {
      target: { value: "1" },
    });
    expect(screen.getByText("Ana López")).toBeDefined();
    expect(screen.queryByText("Team El Pilar")).toBeNull();
    fireEvent.change(screen.getByLabelText(/Categoría/), {
      target: { value: "" },
    });
    expect(screen.getByText("Team El Pilar")).toBeDefined();
  });

  it("preselects the first event in order", async () => {
    mockedEvents.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeWod({ id: 5, phase: "FINAL", event_number: 1, name: "Final" }),
          makeWod({ id: 2, event_number: 2, name: "Grace" }),
          makeWod({ id: 1, event_number: 1, name: "Fran" }),
        ],
      }),
    );
    renderWithProviders(<ScoresPage />);
    await waitFor(() =>
      expect(
        (screen.getByLabelText("Evento (WOD)") as HTMLSelectElement).value,
      ).toBe("1"),
    );
    expect(screen.getByRole("option", { name: "WOD 1 — Fran" })).toBeDefined();
    expect(screen.getByRole("option", { name: "WOD 2 — Grace" })).toBeDefined();
    expect(
      screen.getByRole("option", { name: "WOD Final — Final" }),
    ).toBeDefined();
    expect(screen.getByText("Guardar resultados")).toBeEnabled();
  });

  it("shows an empty state when the competition has no events", () => {
    mockedEvents.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<ScoresPage />);
    expect(screen.getByText("Sin eventos")).toBeDefined();
    expect(screen.getByText("Guardar resultados")).toBeDisabled();
  });

  it("disables the event select without a selected competition", () => {
    useAdminScopeStore.setState({ competitionId: null });
    renderWithProviders(<ScoresPage />);
    expect(screen.getByLabelText("Evento (WOD)")).toBeDisabled();
    expect(screen.getByText("Guardar resultados")).toBeDisabled();
  });
});