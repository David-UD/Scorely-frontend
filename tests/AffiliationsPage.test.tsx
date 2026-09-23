import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeAffiliation } from "./fixtures";
import AffiliationsPage from "@/pages/admin/AffiliationsPage";
import { useAdminAffiliations } from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";

const deleteMutate = vi.fn();

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminAffiliations: vi.fn(),
    useDeleteAffiliation: () => ({
      mutate: deleteMutate,
      isPending: false,
    }),
  };
});

const mockedAffiliations = vi.mocked(useAdminAffiliations);

function setSuperUser() {
  useAuthStore.setState({
    user: { email: "admin@scorely.com", is_superuser: true },
  });
}

beforeEach(() => {
  setSuperUser();
  deleteMutate.mockReset();
});

afterEach(() => {
  useAuthStore.setState({ user: null });
  localStorage.clear();
});

describe("AffiliationsPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedAffiliations.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<AffiliationsPage />);
    expect(screen.getByText(/Cargando filiaciones/)).toBeDefined();
  });

  it("renders affiliations in a table for the superuser", () => {
    mockedAffiliations.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAffiliation({ id: 1, name: "Box El Pilar" }),
          makeAffiliation({
            id: 2,
            name: "HYROX Core Madrid",
            city: "Madrid",
            state: "Madrid",
            country: "España",
          }),
        ],
      }),
    );
    renderWithProviders(<AffiliationsPage />);
    expect(screen.getByText("Box El Pilar")).toBeDefined();
    expect(screen.getByText("HYROX Core Madrid")).toBeDefined();
    expect(screen.getByText("España")).toBeDefined();
    expect(screen.getByText("Nueva filiación")).toBeDefined();
  });

  it("shows access denied message for a competition admin", () => {
    useAuthStore.setState({
      user: { email: "user1@gmail.com", is_superuser: false },
    });
    mockedAffiliations.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<AffiliationsPage />);
    expect(screen.getByText(/Solo el superusuario/)).toBeDefined();
    expect(screen.queryByText("Nueva filiación")).toBeNull();
  });

  it("shows an empty state when there are no affiliations", () => {
    mockedAffiliations.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<AffiliationsPage />);
    expect(screen.getByText("Sin filiaciones")).toBeDefined();
  });

  it("shows a clear error when deleting an affiliation in use", async () => {
    deleteMutate.mockImplementation(
      (_: number, options: { onError?: (err: Error) => void; onSettled?: () => void }) => {
        options?.onError?.(new Error("No se pudo eliminar"));
        options?.onSettled?.();
      },
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedAffiliations.mockReturnValue(
      queryResult({ isLoading: false, data: [makeAffiliation()] }),
    );
    renderWithProviders(<AffiliationsPage />);
    screen.getByText("Eliminar").click();
    expect(await screen.findByRole("alert")).toBeDefined();
    confirmSpy.mockRestore();
  });

  it("filters affiliations by name (case and accent insensitive)", () => {
    mockedAffiliations.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAffiliation({ id: 1, name: "Álvarez Box" }),
          makeAffiliation({ id: 2, name: "HYROX Core" }),
        ],
      }),
    );
    renderWithProviders(<AffiliationsPage />);
    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "alvarez" } });
    expect(screen.getByText("Álvarez Box")).toBeDefined();
    expect(screen.queryByText("HYROX Core")).toBeNull();
  });

  it("sorts by name on header click", () => {
    mockedAffiliations.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeAffiliation({ id: 1, name: "Zeta Box" }),
          makeAffiliation({ id: 2, name: "Alpha Box" }),
        ],
      }),
    );
    renderWithProviders(<AffiliationsPage />);
    const rows = () =>
      Array.from(screen.getAllByRole("row")).map((r) => r.textContent);
    expect(rows().findIndex((r) => r?.startsWith("Alpha"))).toBeLessThan(
      rows().findIndex((r) => r?.startsWith("Zeta")),
    );

    const header = screen.getByRole("columnheader", { name: /nombre/i });
    fireEvent.click(header);
    expect(rows().findIndex((r) => r?.startsWith("Zeta"))).toBeLessThan(
      rows().findIndex((r) => r?.startsWith("Alpha")),
    );
  });
});