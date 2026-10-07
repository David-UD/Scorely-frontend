import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeCompetitionCategory } from "./fixtures";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import { useAdminCompetitionCategories } from "@/hooks/useAdminModules";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const deleteMutate = vi.fn();

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminCompetitionCategories: vi.fn(),
    useDeleteCompetitionCategory: () => ({
      mutate: deleteMutate,
      isPending: false,
    }),
  };
});

const mockedCategories = vi.mocked(useAdminCompetitionCategories);

function setSuperUser() {
  useAuthStore.setState({
    user: { email: "admin@scorely.com", is_superuser: true },
  });
}

beforeEach(() => {
  setSuperUser();
  deleteMutate.mockReset();
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  useAuthStore.setState({ user: null });
  localStorage.clear();
});

describe("CategoriesPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedCategories.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText(/Cargando categorías/)).toBeDefined();
  });

  it("renders categories in a table for the superuser", () => {
    mockedCategories.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeCompetitionCategory({ id: 1, name: "RX Individual" }),
          makeCompetitionCategory({
            id: 2,
            name: "Team Mixed",
            min_members: 2,
            max_members: 2,
          }),
        ],
      }),
    );
    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText("RX Individual")).toBeDefined();
    expect(screen.getByText("Team Mixed")).toBeDefined();
    expect(screen.getByText("Nueva categoría")).toBeDefined();
  });

  it("shows access denied message for a competition admin", () => {
    useAuthStore.setState({
      user: { email: "user1@gmail.com", is_superuser: false },
    });
    mockedCategories.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText(/Solo el superusuario/)).toBeDefined();
    expect(screen.queryByText("Nueva categoría")).toBeNull();
  });

  it("shows an empty state when there are no categories", () => {
    mockedCategories.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText("Sin categorías")).toBeDefined();
  });

  it("shows a success toast after deleting a category", () => {
    deleteMutate.mockImplementation(
      (_: number, options: { onSuccess?: () => void }) => options?.onSuccess?.(),
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedCategories.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [makeCompetitionCategory({ id: 1, name: "RX Individual" })],
      }),
    );
    renderWithProviders(<CategoriesPage />);
    screen.getByText("Eliminar").click();
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
      "Categoría eliminada.",
    );
    confirmSpy.mockRestore();
  });
});