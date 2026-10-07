import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeAthlete } from "./fixtures";
import AthletesPage from "@/pages/admin/AthletesPage";
import { useAdminAthletes } from "@/hooks/useAdminModules";
import { useToastStore } from "@/store/toastStore";

const deleteMutate = vi.fn();

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminAthletes: vi.fn(),
    useDeleteAthlete: () => ({
      mutate: deleteMutate,
      isPending: false,
    }),
  };
});

const mockedAthletes = vi.mocked(useAdminAthletes);

afterEach(() => {
  mockedAthletes.mockClear();
});

describe("AthletesPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedAthletes.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<AthletesPage />);
    expect(screen.getByText(/Cargando atletas/)).toBeDefined();
  });

  it("renders athletes in a table", () => {
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAthlete({ id: 1, first_name: "Ana", last_name: "López" }),
          makeAthlete({ id: 2, first_name: "Leo", last_name: "Mora", gender: "M" }),
        ],
      }),
    );
    renderWithProviders(<AthletesPage />);
    expect(screen.getByText("Ana López")).toBeDefined();
    expect(screen.getByText("Leo Mora")).toBeDefined();
    expect(screen.getByText("Nuevo atleta")).toBeDefined();
  });

  it("filters athletes by last name (case and accent insensitive)", () => {
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAthlete({ id: 1, first_name: "Ana", last_name: "López" }),
          makeAthlete({ id: 2, first_name: "Leo", last_name: "Mora" }),
        ],
      }),
    );
    renderWithProviders(<AthletesPage />);
    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "LOpez" } });
    expect(screen.getByText("Ana López")).toBeDefined();
    expect(screen.queryByText("Leo Mora")).toBeNull();
  });

  it("shows an empty state when the search has no matches", () => {
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeAthlete({ id: 1, first_name: "Ana", last_name: "López" })],
      }),
    );
    renderWithProviders(<AthletesPage />);
    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("Sin coincidencias")).toBeDefined();
  });

  it("sorts by full name ascending and descending on header click", () => {
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAthlete({ id: 1, first_name: "Ana", last_name: "Zeta" }),
          makeAthlete({ id: 2, first_name: "Leo", last_name: "Alpha" }),
        ],
      }),
    );
    renderWithProviders(<AthletesPage />);
    const rows = () =>
      Array.from(screen.getAllByRole("row")).map((r) => r.textContent);
    const pos = (name: string) =>
      rows().findIndex((r) => r?.includes(name));

    expect(pos("Ana Zeta")).toBeLessThan(pos("Leo Alpha"));

    const header = screen.getByRole("columnheader", { name: /atleta/i });
    fireEvent.click(header);
    expect(pos("Leo Alpha")).toBeLessThan(pos("Ana Zeta"));
  });

  it("paginates the table in pages of 20", () => {
    const data = Array.from({ length: 25 }, (_, index) =>
      makeAthlete({
        id: index + 1,
        first_name: `Atleta${String(index + 1).padStart(2, "0")}`,
        last_name: "Test",
      }),
    );
    mockedAthletes.mockReturnValue(queryResult({ isLoading: false, data }));
    renderWithProviders(<AthletesPage />);

    expect(screen.getByText("Atleta01 Test")).toBeDefined();
    expect(screen.getByText("Atleta20 Test")).toBeDefined();
    expect(screen.queryByText("Atleta21 Test")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

    expect(screen.queryByText("Atleta01 Test")).toBeNull();
    expect(screen.getByText("Atleta21 Test")).toBeDefined();
    expect(screen.getByText("Atleta25 Test")).toBeDefined();
  });

  it("goes back to the first page when searching", () => {
    const data = Array.from({ length: 25 }, (_, index) =>
      makeAthlete({
        id: index + 1,
        first_name: `Atleta${String(index + 1).padStart(2, "0")}`,
        last_name: "Test",
      }),
    );
    mockedAthletes.mockReturnValue(queryResult({ isLoading: false, data }));
    renderWithProviders(<AthletesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    expect(screen.getByText("Atleta21 Test")).toBeDefined();

    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "Atleta25" } });

    expect(screen.getByText("Atleta25 Test")).toBeDefined();
    expect(screen.queryByText("Atleta21 Test")).toBeNull();
  });

  it("shows a success toast after deleting an athlete", () => {
    deleteMutate.mockReset();
    useToastStore.setState({ toasts: [] });
    deleteMutate.mockImplementation(
      (_: number, options: { onSuccess?: () => void }) => options?.onSuccess?.(),
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedAthletes.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeAthlete({ id: 1, first_name: "Ana", last_name: "López" })],
      }),
    );
    renderWithProviders(<AthletesPage />);
    screen.getByText("Eliminar").click();
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
      "Atleta eliminado.",
    );
    confirmSpy.mockRestore();
  });
});