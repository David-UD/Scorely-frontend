import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeScoringRule } from "./fixtures";
import ScoringPage from "@/pages/admin/ScoringPage";
import {
  useAdminScoringRules,
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
    useAdminScoringRules: vi.fn(),
    useCreateScoringRule: () => ({
      mutateAsync: createMutateAsync,
      isPending: false,
    }),
    useUpdateScoringRule: () => ({
      mutateAsync: updateMutateAsync,
      isPending: false,
    }),
    useDeleteScoringRule: () => ({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    }),
  };
});

const mockedRules = vi.mocked(useAdminScoringRules);

beforeEach(() => {
  useAdminScopeStore.setState({ competitionId: 1 });
  createMutateAsync.mockReset();
  updateMutateAsync.mockReset();
  deleteMutateAsync.mockReset();
  vi.clearAllMocks();
  mockedRules.mockReturnValue(
    queryResult({ isLoading: false, data: [] }),
  );
  createMutateAsync.mockResolvedValue({});
  updateMutateAsync.mockResolvedValue({});
  deleteMutateAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  useAdminScopeStore.setState({ competitionId: null });
  localStorage.clear();
});

describe("ScoringPage", () => {
  const expandTable = () => {
    const toggle = screen.getByRole("button", { name: /Tabla de posiciones/ });
    if (toggle.getAttribute("aria-expanded") === "false") {
      fireEvent.click(toggle);
    }
  };

  it("shows the loading spinner while fetching rules", () => {
    mockedRules.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<ScoringPage />);
    expect(screen.getByText(/Cargando reglas/)).toBeDefined();
  });

  it("renders the grid with scoring rules ordered by position", () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeScoringRule({ id: 2, position: 2, points: 90 }),
          makeScoringRule({ id: 1, position: 1, points: 100 }),
        ],
      }),
    );
    renderWithProviders(<ScoringPage />);
    expandTable();
    const inputs = screen.getAllByLabelText(/Posición de la regla/i);
    expect(inputs).toHaveLength(2);
    expect((inputs[0] as HTMLInputElement).value).toBe("1");
    expect((inputs[1] as HTMLInputElement).value).toBe("2");
  });

  it("adds a new row and saves it as a new scoring rule", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ position: 1, points: 100 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    expandTable();
    fireEvent.click(screen.getByText("Añadir posición"));
    fireEvent.click(screen.getByText("Guardar reglas"));
    await waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        competition: 1,
        position: 2,
        points: 0,
      }),
    );
  });

  it("updates an existing row", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 100 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    expandTable();
    const positionInput = screen.getByLabelText(/Posición de la regla/i) as HTMLInputElement;
    fireEvent.change(positionInput, { target: { value: "2" } });
    fireEvent.click(screen.getByText("Guardar reglas"));
    await waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 1,
        position: 2,
        points: 100,
      }),
    );
  });

  it("marks a row for removal and deletes it on save", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 100 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    expandTable();
    fireEvent.click(screen.getByText("Quitar"));
    fireEvent.click(screen.getByText("Guardar reglas"));
    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith(1));
  });

  it("does not call delete for a new unsaved row that is removed", async () => {
    mockedRules.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    renderWithProviders(<ScoringPage />);
    expandTable();
    fireEvent.click(screen.getByText("Añadir posición"));
    fireEvent.click(screen.getByText("Quitar"));
    fireEvent.click(screen.getByText("Guardar reglas"));
    await waitFor(() => expect(deleteMutateAsync).not.toHaveBeenCalled());
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("shows empty state when there are no rules", () => {
    mockedRules.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    renderWithProviders(<ScoringPage />);
    expandTable();
    expect(screen.getByText("Sin reglas de puntuación")).toBeDefined();
  });

  it("starts collapsed and expands the positions table", () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 100 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    const toggle = screen.getByText("Tabla de posiciones");
    expect(screen.getByRole("button", { name: /Tabla de posiciones/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByLabelText("Posición de la regla 1")).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Posición de la regla 1")).toBeDefined();
    expect(screen.getByRole("button", { name: /Tabla de posiciones/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("shows the live preview of the sequence to be generated", () => {
    mockedRules.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    renderWithProviders(<ScoringPage />);
    const base = screen.getByLabelText("Puntos 1.er puesto") as HTMLInputElement;
    const step = screen.getByLabelText("Descenso por puesto") as HTMLInputElement;
    const to = screen.getByLabelText("Hasta posición") as HTMLInputElement;
    fireEvent.change(base, { target: { value: "100" } });
    fireEvent.change(step, { target: { value: "2" } });
    fireEvent.change(to, { target: { value: "5" } });
    expect(screen.getByText("1º")).toBeDefined();
    expect(screen.getAllByText(/^100$/)).toHaveLength(1);
    expect(screen.getByText(/98/)).toBeDefined();
    expect(screen.getByText(/92/)).toBeDefined();
    fireEvent.change(to, { target: { value: "" } });
    expect(screen.getByText(/Completá los campos/)).toBeDefined();
  });

  it("shows an alert and keeps rows when save fails", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 100 })],
      }),
    );
    updateMutateAsync.mockRejectedValueOnce(new Error("fallo"));
    renderWithProviders(<ScoringPage />);
    expandTable();
    const positionInput = screen.getByLabelText(/Posición de la regla/i) as HTMLInputElement;
    fireEvent.change(positionInput, { target: { value: "3" } });
    fireEvent.click(screen.getByText("Guardar reglas"));
    expect(await screen.findByRole("alert")).toBeDefined();
    expect((positionInput as HTMLInputElement).value).toBe("3");
    expect(screen.queryByText("Reglas guardadas correctamente.")).toBeNull();
  });

  it("shows a success toast after saving", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 100 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    expandTable();
    fireEvent.click(screen.getByText("Guardar reglas"));
    expect(await screen.findByText("Reglas guardadas correctamente.")).toBeDefined();
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("disables actions without a selected competition", () => {
    useAdminScopeStore.setState({ competitionId: null });
    mockedRules.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    renderWithProviders(<ScoringPage />);
    expandTable();
    expect(screen.getByText("Añadir posición")).toBeDisabled();
    expect(screen.getByText("Guardar reglas")).toBeDisabled();
  });

  it("generates the full grid from the general rule and saves each rule", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 100 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    const base = screen.getByLabelText("Puntos 1.er puesto") as HTMLInputElement;
    const step = screen.getByLabelText("Descenso por puesto") as HTMLInputElement;
    const to = screen.getByLabelText("Hasta posición") as HTMLInputElement;
    fireEvent.change(base, { target: { value: "100" } });
    fireEvent.change(step, { target: { value: "2" } });
    fireEvent.change(to, { target: { value: "5" } });
    fireEvent.click(screen.getByText("Generar y guardar"));
    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledTimes(4));
    expect(createMutateAsync).toHaveBeenCalledWith({
      competition: 1,
      position: 2,
      points: 98,
    });
    expect(createMutateAsync).toHaveBeenCalledWith({
      competition: 1,
      position: 3,
      points: 96,
    });
    expect(createMutateAsync).toHaveBeenCalledWith({
      competition: 1,
      position: 4,
      points: 94,
    });
    expect(createMutateAsync).toHaveBeenCalledWith({
      competition: 1,
      position: 5,
      points: 92,
    });
  });

  it("floors generated points at zero and reuses existing rows by position", async () => {
    mockedRules.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeScoringRule({ id: 1, position: 1, points: 20 })],
      }),
    );
    renderWithProviders(<ScoringPage />);
    const base = screen.getByLabelText("Puntos 1.er puesto") as HTMLInputElement;
    const to = screen.getByLabelText("Hasta posición") as HTMLInputElement;
    const step = screen.getByLabelText("Descenso por puesto") as HTMLInputElement;
    fireEvent.change(base, { target: { value: "10" } });
    fireEvent.change(step, { target: { value: "10" } });
    fireEvent.change(to, { target: { value: "3" } });
    fireEvent.click(screen.getByText("Generar y guardar"));
    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 1,
      position: 1,
      points: 10,
    });
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledTimes(2));
    expect(createMutateAsync).toHaveBeenCalledWith({
      competition: 1,
      position: 2,
      points: 0,
    });
    expect(createMutateAsync).toHaveBeenCalledWith({
      competition: 1,
      position: 3,
      points: 0,
    });
  });
});