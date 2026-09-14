import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, queryResult } from "./utils";
import { makeCompetition } from "./fixtures";
import CompetitionsPage from "@/pages/admin/CompetitionsPage";
import { useAdminCompetitions } from "@/hooks/useAdminCompetitions";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/hooks/useAdminCompetitions", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useAdminCompetitions")>(
    "@/hooks/useAdminCompetitions",
  );
  return {
    ...actual,
    useAdminCompetitions: vi.fn(),
    useDeleteCompetition: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

const mockedUseAdminCompetitions = vi.mocked(useAdminCompetitions);

function setSuperUser() {
  useAuthStore.setState({
    user: { email: "admin@scorely.com", is_superuser: true },
  });
}

beforeEach(() => {
  setSuperUser();
});

afterEach(() => {
  useAuthStore.setState({ user: null });
  localStorage.clear();
});

describe("CompetitionsPage", () => {
  it("shows the loading spinner while fetching", () => {
    mockedUseAdminCompetitions.mockReturnValue(queryResult({ isLoading: true }));
    renderWithProviders(<CompetitionsPage />);
    expect(screen.getByText(/Cargando competiciones/)).toBeDefined();
  });

  it("renders competitions in a table for the superuser", () => {
    mockedUseAdminCompetitions.mockReturnValue(
      queryResult({
        isLoading: false,
        data: [
          makeCompetition({ id: 1, name: "TJ Summer Games" }),
          makeCompetition({
            id: 2,
            name: "Hyrox Barcelona",
            competition_type: { code: "hyrox", name: "Hyrox" },
            status: { code: "upcoming", name: "Próxima" },
          }),
        ],
      }),
    );
    renderWithProviders(<CompetitionsPage />);

    expect(screen.getByText("TJ Summer Games")).toBeDefined();
    expect(screen.getByText("Hyrox Barcelona")).toBeDefined();
    expect(screen.getByText("Hyrox")).toBeDefined();
    expect(screen.getByText("Publicada")).toBeDefined();
    expect(screen.getByText("Próxima")).toBeDefined();
  });

  it("shows the create button only for the superuser", () => {
    mockedUseAdminCompetitions.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CompetitionsPage />);
    expect(screen.getByText("Nueva competición")).toBeDefined();
  });

  it("hides the create button for a competition admin", () => {
    useAuthStore.setState({
      user: { email: "user1@gmail.com", is_superuser: false },
    });
    mockedUseAdminCompetitions.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CompetitionsPage />);
    expect(screen.queryByText("Nueva competición")).toBeNull();
  });

  it("shows an empty state when there are no competitions", () => {
    mockedUseAdminCompetitions.mockReturnValue(
      queryResult({ isLoading: false, data: [] }),
    );
    renderWithProviders(<CompetitionsPage />);
    expect(screen.getByText("Sin competiciones")).toBeDefined();
  });
});