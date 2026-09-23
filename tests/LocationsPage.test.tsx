import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeLocation } from "./fixtures";
import LocationsPage from "@/pages/admin/LocationsPage";
import { useAdminLocations } from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";

const deleteMutate = vi.fn();

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminLocations: vi.fn(),
    useDeleteLocation: () => ({
      mutate: deleteMutate,
      isPending: false,
    }),
  };
});

const mockedLocations = vi.mocked(useAdminLocations);

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

describe("LocationsPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedLocations.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<LocationsPage />);
    expect(screen.getByText(/Cargando sedes/)).toBeDefined();
  });

  it("renders locations in a table for the superuser", () => {
    mockedLocations.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeLocation({ id: 1, name: "Paraná Raquet" }),
          makeLocation({
            id: 2,
            name: "HYROX Core Madrid",
            address: "Calle Mayor 5",
            city: "Madrid",
            state: "Madrid",
            country: "España",
          }),
        ],
      }),
    );
    renderWithProviders(<LocationsPage />);
    expect(screen.getByText("Paraná Raquet")).toBeDefined();
    expect(screen.getByText("HYROX Core Madrid")).toBeDefined();
    expect(screen.getByText("España")).toBeDefined();
    expect(screen.getByText("Calle Mayor 5")).toBeDefined();
    expect(screen.getAllByText("-31.7333, -60.5297")).toHaveLength(2);
    expect(screen.getByText("Nueva sede")).toBeDefined();
  });

  it("shows access denied message for a competition admin", () => {
    useAuthStore.setState({
      user: { email: "user1@gmail.com", is_superuser: false },
    });
    mockedLocations.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<LocationsPage />);
    expect(screen.getByText(/Solo el superusuario/)).toBeDefined();
    expect(screen.queryByText("Nueva sede")).toBeNull();
  });

  it("shows an empty state when there are no locations", () => {
    mockedLocations.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<LocationsPage />);
    expect(screen.getByText("Sin sedes")).toBeDefined();
  });

  it("shows a clear error when deleting a location in use", async () => {
    deleteMutate.mockImplementation(
      (_: number, options: { onError?: (err: Error) => void; onSettled?: () => void }) => {
        options?.onError?.(new Error("No se pudo eliminar"));
        options?.onSettled?.();
      },
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedLocations.mockReturnValue(
      queryResult({ isLoading: false, data: [makeLocation()] }),
    );
    renderWithProviders(<LocationsPage />);
    screen.getByText("Eliminar").click();
    expect(await screen.findByRole("alert")).toBeDefined();
    confirmSpy.mockRestore();
  });

  it("filters locations by name (case and accent insensitive)", () => {
    mockedLocations.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeLocation({ id: 1, name: "Arena Olímpica" }),
          makeLocation({ id: 2, name: "Box Central" }),
        ],
      }),
    );
    renderWithProviders(<LocationsPage />);
    const input = screen.getByRole("searchbox", { name: /buscar/i });
    fireEvent.change(input, { target: { value: "olimpica" } });
    expect(screen.getByText("Arena Olímpica")).toBeDefined();
    expect(screen.queryByText("Box Central")).toBeNull();
  });

  it("sorts by name on header click", () => {
    mockedLocations.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeLocation({ id: 1, name: "Zeta Arena" }),
          makeLocation({ id: 2, name: "Alpha Box" }),
        ],
      }),
    );
    renderWithProviders(<LocationsPage />);
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