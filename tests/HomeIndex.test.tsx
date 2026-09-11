import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, queryResult } from "./utils";
import { makeCompetition } from "./fixtures";
import HomeIndex from "@/pages/public/HomeIndex";
import { useCompetitions } from "@/hooks/useCompetitions";
import type { Competition } from "@/types";

vi.mock("@/hooks/useCompetitions", () => ({
  useCompetitions: vi.fn(),
}));

const mockedUseCompetitions = vi.mocked(useCompetitions);

const competitions: Competition[] = [
  makeCompetition({
    id: 1,
    name: "Comp A",
    start_date: "2026-06-01",
    end_date: "2026-06-02",
    status: { code: "published", name: "Publicada" },
    affiliation: { id: 1, name: "Box 1", city: "BsAs", state: "BsAs", country: "AR" },
    competition_type: { code: "cf", name: "CrossFit" },
    year: 2026,
  }),
  makeCompetition({
    id: 2,
    name: "Comp B",
    start_date: "2026-07-10",
    end_date: "2026-07-12",
    status: { code: "finished", name: "Finalizada" },
    affiliation: { id: 2, name: "Box 2", city: "Córdoba", state: "Córdoba", country: "AR" },
    competition_type: { code: "h", name: "HYROX" },
    year: 2026,
  }),
];

describe("HomeIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCompetitions.mockReturnValue(
      queryResult<Competition[]>({
        data: competitions,
        isLoading: false,
        isPending: false,
        isSuccess: true,
      }),
    );
  });

  it("renders competitions in the current tab", async () => {
    renderWithProviders(<HomeIndex />);
    expect(screen.getByRole("heading", { name: "Competiciones" })).toBeInTheDocument();
    expect(screen.getByText("Comp A")).toBeInTheDocument();
    expect(screen.getByText("Comp B")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /recientes/i }),
    ).toBeInTheDocument();
  });

  it("switches to 'Todas' tab and shows all competitions", async () => {
    renderWithProviders(<HomeIndex />);
    await userEvent.click(screen.getByRole("tab", { name: /todas/i }));
    expect(
      screen.getByRole("heading", { level: 2, name: /todas/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when there are no competitions", () => {
    mockedUseCompetitions.mockReturnValue(
      queryResult<Competition[]>({ data: [], isLoading: false, isPending: false, isSuccess: true }),
    );
    renderWithProviders(<HomeIndex />);
    expect(screen.getByText("Aún no hay competiciones")).toBeInTheDocument();
  });

  it("displays error state with retry button when the query fails", () => {
    mockedUseCompetitions.mockReturnValue(
      queryResult<Competition[]>({ isError: true, isLoading: false, isPending: false }),
    );
    renderWithProviders(<HomeIndex />);
    expect(
      screen.getByText("No se pudieron cargar las competiciones"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("searches by name and triggers the query with the search param", async () => {
    mockedUseCompetitions.mockReturnValue(
      queryResult<Competition[]>({ data: [], isLoading: false, isPending: false, isSuccess: true }),
    );
    renderWithProviders(<HomeIndex />);

    const input = screen.getByRole("searchbox", { name: /buscar competiciones/i });
    await userEvent.type(input, "Open");

    await vi.waitFor(() => {
      expect(mockedUseCompetitions).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Open" }),
      );
    });
  });
});