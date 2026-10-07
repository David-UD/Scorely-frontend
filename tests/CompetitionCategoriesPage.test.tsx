import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeCompetitionCategory, makeEnabledCompetitionCategory } from "./fixtures";
import CompetitionCategoriesPage from "@/pages/admin/CompetitionCategoriesPage";
import { useAdminEnabledCategories, useAdminCompetitionCategories } from "@/hooks/useAdminModules";
import { useAdminScopeStore } from "@/store/adminScopeStore";
import { useToastStore } from "@/store/toastStore";

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutate = vi.fn();

vi.mock("@/components/admin/CompetitionScopeSelect", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useAdminCompetitions", () => ({
  useAdminCompetitions: () => ({
    data: [{ id: 1, name: "Open CrossFit Ciudad 2026" }],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/useAdminModules", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminModules")>(
    "@/hooks/useAdminModules",
  );
  return {
    ...actual,
    useAdminEnabledCategories: vi.fn(),
    useAdminCompetitionCategories: vi.fn(),
    useCreateEnabledCategory: () => ({ mutateAsync: createMutateAsync, isPending: false }),
    useUpdateEnabledCategory: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
    useDeleteEnabledCategory: () => ({ mutate: deleteMutate, isPending: false }),
  };
});

const mockedEnabled = vi.mocked(useAdminEnabledCategories);
const mockedCatalog = vi.mocked(useAdminCompetitionCategories);

function setScope(competitionId: number | null) {
  useAdminScopeStore.setState({ competitionId });
}

function mockQueries() {
  mockedEnabled.mockReturnValue(
    queryResult({
      isLoading: false,
      data: [
        makeEnabledCompetitionCategory({
          id: 1,
          competition: 1,
          competition_category: 2,
          finalist_slots: 2,
        }),
      ],
    }),
  );
  mockedCatalog.mockReturnValue(
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
}

beforeEach(() => {
  setScope(1);
  vi.clearAllMocks();
  createMutateAsync.mockReset();
  updateMutateAsync.mockReset();
  deleteMutate.mockReset();
  createMutateAsync.mockResolvedValue({});
  updateMutateAsync.mockResolvedValue({});
  useToastStore.setState({ toasts: [] });
  mockQueries();
});

afterEach(() => {
  useAdminScopeStore.setState({ competitionId: null });
  localStorage.clear();
});

describe("CompetitionCategoriesPage", () => {
  it("renders enabled categories with names and slots", () => {
    renderWithProviders(<CompetitionCategoriesPage />);
    expect(screen.getByText("Team Mixed")).toBeDefined();
    expect(screen.getByText("RX Individual")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("Habilitar categoría en la competición")).toBeDefined();
  });

  it("only lists catalog categories that are not yet enabled in the select", () => {
    renderWithProviders(<CompetitionCategoriesPage />);
    const select = screen.getByLabelText("Categoría") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.textContent);
    expect(options).toContain("RX Individual");
    expect(options).not.toContain("Team Mixed");
  });

  it("shows an empty state when there are no enabled categories", () => {
    mockedEnabled.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CompetitionCategoriesPage />);
    expect(screen.getByText("Sin categorías habilitadas")).toBeDefined();
  });

  it("disables the enable button without a selected competition", () => {
    setScope(null);
    renderWithProviders(<CompetitionCategoriesPage />);
    expect(screen.getByText("Habilitar")).toBeDisabled();
  });

  it("shows a success toast after enabling a category", async () => {
    renderWithProviders(<CompetitionCategoriesPage />);
    fireEvent.change(screen.getByLabelText("Categoría"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByText("Habilitar"));
    await waitFor(() =>
      expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
        "Categoría habilitada.",
      ),
    );
  });

  it("shows a success toast after updating finalist slots", async () => {
    renderWithProviders(<CompetitionCategoriesPage />);
    fireEvent.click(screen.getByText("Editar"));
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() =>
      expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
        "Slots actualizados.",
      ),
    );
  });

  it("shows a success toast after removing an enabled category", () => {
    deleteMutate.mockImplementation(
      (_: number, options: { onSuccess?: () => void }) => options?.onSuccess?.(),
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<CompetitionCategoriesPage />);
    screen.getByText("Quitar").click();
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
      "Categoría deshabilitada.",
    );
    confirmSpy.mockRestore();
  });
});