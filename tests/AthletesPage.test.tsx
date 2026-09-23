import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeAthlete } from "./fixtures";
import AthletesPage from "@/pages/admin/AthletesPage";
import { useAdminAthletes } from "@/hooks/useAdminModules";

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminAthletes: vi.fn(),
    useDeleteAthlete: () => ({
      mutate: vi.fn(),
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
});