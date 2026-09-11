import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { makeCompetition, makeStage, makeWod, makeLeaderboard } from "./fixtures";
import CompetitionDetail from "@/pages/public/CompetitionDetail";
import { useCompetition } from "@/hooks/useCompetition";
import { useCompetitionStages } from "@/hooks/useCompetitionStages";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { Competition, CompetitionStage, Leaderboard } from "@/types";

vi.mock("@/hooks/useCompetition", () => ({
  useCompetition: vi.fn(),
}));
vi.mock("@/hooks/useCompetitionStages", () => ({
  useCompetitionStages: vi.fn(),
}));
vi.mock("@/hooks/useLeaderboard", () => ({
  useLeaderboard: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueries: vi.fn(),
}));

const mockedUseCompetition = vi.mocked(useCompetition);
const mockedUseCompetitionStages = vi.mocked(useCompetitionStages);
const mockedUseLeaderboard = vi.mocked(useLeaderboard);
const mockedUseQueries = vi.mocked(useQueries);

function result<T>(data: T): UseQueryResult<T> {
  return {
    data,
    error: null,
    isPending: false,
    isLoading: false,
    isError: false,
    isSuccess: true,
    isFetching: false,
    isFetched: true,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<T>;
}

const competition = makeCompetition({
  start_date: "2026-05-01",
  end_date: "2026-05-03",
  affiliation: { id: 1, name: "Box El Pilar", city: "BsAs", state: "BsAs", country: "AR" },
  location: {
    id: 1,
    name: "Box El Pilar",
    city: "BsAs",
    state: "BsAs",
    country: "AR",
    latitude: -34.6,
    longitude: -58.38,
  },
});

const stage = makeStage({ id: 1, name: "Qualifier" });
const wod = makeWod({ id: 1, event_number: 1, name: "Fran" });

const qualifier = [
  makeLeaderboard({
    stage: "qualifier",
    category: { code: "rx", name: "RX" },
    entries: [
      { rank: 1, competitor_id: 10, display_name: "Ana López", final_score: "03:20", event_ranks: [1] },
    ],
  }),
];

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/competitions/${competition.slug}/`]}>
      <CompetitionDetail />
    </MemoryRouter>,
  );
}

describe("CompetitionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseCompetition.mockReturnValue(result<Competition>(competition));
    mockedUseCompetitionStages.mockReturnValue(result<CompetitionStage[]>([stage]));
    mockedUseQueries.mockReturnValue([
      {
        data: [wod],
        error: null,
        isPending: false,
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      },
    ]);
    mockedUseLeaderboard.mockReturnValue(result<Leaderboard[]>(qualifier));
  });

  it("renders competition information and affiliation", () => {
    renderDetail();
    expect(screen.getByText("Open CrossFit Ciudad 2026")).toBeInTheDocument();
    expect(screen.getByText("Publicada")).toBeInTheDocument();
    expect(screen.getByText("CrossFit")).toBeInTheDocument();
    expect(screen.getAllByText("Box El Pilar").length).toBeGreaterThan(1);
    expect(screen.getAllByText(/BsAs.*AR/).length).toBeGreaterThan(0);
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Fin")).toBeInTheDocument();
  });

  it("renders the map iframe when coordinates are available", () => {
    renderDetail();
    const mapFrame = screen.getByTitle("Mapa de Box El Pilar");
    expect(mapFrame).toBeInTheDocument();
    expect(mapFrame).toHaveAttribute("src");
  });

  it("renders WODs in a table", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "Workouts" })).toBeInTheDocument();
    expect(screen.getByText("Fran")).toBeInTheDocument();
  });

  it("renders leaderboard table with athlete entries", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(screen.getByText("03:20")).toBeInTheDocument();
  });

  it("allows filtering leaderboard by category", async () => {
    mockedUseLeaderboard.mockReturnValue(
      result<Leaderboard[]>([
        makeLeaderboard({
          category: { code: "rx", name: "RX" },
          entries: [{ rank: 1, competitor_id: 10, display_name: "Ana López", final_score: "03:20", event_ranks: [1] }],
        }),
        makeLeaderboard({
          stage: "qualifier",
          category: { code: "scaled", name: "Scaled" },
          entries: [{ rank: 1, competitor_id: 20, display_name: "María García", final_score: "05:00", event_ranks: [1] }],
        }),
      ]),
    );

    renderDetail();

    expect(screen.getByText("Ana López")).toBeInTheDocument();
    const select = screen.getByLabelText("Categoría");
    expect(select).toHaveValue("rx");

    await userEvent.selectOptions(select, "scaled");
    expect(screen.getByText("María García")).toBeInTheDocument();
    expect(screen.queryByText("Ana López")).not.toBeInTheDocument();
  });

  it("shows empty state when competition has no stages", () => {
    mockedUseCompetitionStages.mockReturnValue(result<CompetitionStage[]>([]));
    renderDetail();
    expect(screen.getByText("Sin etapas")).toBeInTheDocument();
  });

  it("renders error state when competition fails to load", () => {
    mockedUseCompetition.mockReturnValue({
      data: undefined,
      error: new Error("Error de red"),
      isPending: false,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Competition>);
    renderDetail();
    expect(
      screen.getByText("No se pudo cargar la competición"),
    ).toBeInTheDocument();
  });
});