import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeTeam } from "./fixtures";
import TeamsPage from "@/pages/admin/TeamsPage";
import { useAdminTeams } from "@/hooks/useAdminModules";

const deleteMutate = vi.fn();

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminTeams: vi.fn(),
    useDeleteTeam: () => ({
      mutate: deleteMutate,
      isPending: false,
    }),
  };
});

const mockedTeams = vi.mocked(useAdminTeams);

beforeEach(() => {
  deleteMutate.mockReset();
});

afterEach(() => {
  mockedTeams.mockClear();
});

describe("TeamsPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedTeams.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<TeamsPage />);
    expect(screen.getByText(/Cargando equipos/)).toBeDefined();
  });

  it("renders a global teams table without a Competition column or scope selector", () => {
    mockedTeams.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeTeam({ id: 1, name: "Equipo A" }),
          makeTeam({ id: 2, name: "Equipo B" }),
        ],
      }),
    );
    renderWithProviders(<TeamsPage />);
    expect(screen.getByText("Equipo A")).toBeDefined();
    expect(screen.getByText("Equipo B")).toBeDefined();
    expect(screen.queryByText("Competición")).toBeNull();
    expect(screen.queryByText("Nuevo equipo")).toBeDefined();
  });

  it("shows an empty state when there are no teams", () => {
    mockedTeams.mockReturnValue(queryResult({ isLoading: false, data: [] }));
    renderWithProviders(<TeamsPage />);
    expect(screen.getByText("Sin equipos")).toBeDefined();
  });

  it("deletes a team after confirm", () => {
    mockedTeams.mockReturnValue(
      queryResult({ isLoading: false, data: [makeTeam({ id: 1, name: "Equipo A" })] }),
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<TeamsPage />);
    screen.getByText("Eliminar").click();
    expect(deleteMutate).toHaveBeenCalledWith(1, expect.any(Object));
    confirmSpy.mockRestore();
  });

  it("shows a clear error when deleting a team fails", async () => {
    deleteMutate.mockImplementation(
      (_: number, options: { onError?: (err: Error) => void; onSettled?: () => void }) => {
        options?.onError?.(new Error("No se pudo eliminar"));
        options?.onSettled?.();
      },
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedTeams.mockReturnValue(
      queryResult({ isLoading: false, data: [makeTeam()] }),
    );
    renderWithProviders(<TeamsPage />);
    screen.getByText("Eliminar").click();
    expect(await screen.findByRole("alert")).toBeDefined();
    confirmSpy.mockRestore();
  });

  it("filters teams by name (case and accent insensitive)", () => {
    mockedTeams.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeTeam({ id: 1, name: "Atlético Madrid" }),
          makeTeam({ id: 2, name: "Box Barcelona" }),
        ],
      }),
    );
    renderWithProviders(<TeamsPage />);
    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "atletico" } });
    expect(screen.getByText("Atlético Madrid")).toBeDefined();
    expect(screen.queryByText("Box Barcelona")).toBeNull();
  });

  it("shows an empty state when the search has no matches", () => {
    mockedTeams.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeTeam({ id: 1, name: "Equipo A" })],
      }),
    );
    renderWithProviders(<TeamsPage />);
    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("Sin coincidencias")).toBeDefined();
  });

  it("sorts by name ascending and descending on header click", () => {
    mockedTeams.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeTeam({ id: 1, name: "Bravo" }),
          makeTeam({ id: 2, name: "Alpha" }),
        ],
      }),
    );
    renderWithProviders(<TeamsPage />);
    const rows = () =>
      Array.from(screen.getAllByRole("row")).map((r) => r.textContent);
    expect(rows().find((r) => r?.includes("Alpha")))?.not.toBeUndefined();
    expect(rows().findIndex((r) => r?.startsWith("Alpha"))).toBeLessThan(
      rows().findIndex((r) => r?.startsWith("Bravo")),
    );

    const header = screen.getByRole("columnheader", { name: /equipo/i });
    fireEvent.click(header);
    expect(rows().findIndex((r) => r?.startsWith("Bravo"))).toBeLessThan(
      rows().findIndex((r) => r?.startsWith("Alpha")),
    );
  });
});