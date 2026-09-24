import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  makeCompetition,
  makeWod,
  makeLeaderboard,
  makeEventResult,
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
} from "./fixtures";
import CompetitionDetail from "@/pages/public/CompetitionDetail";
import { useCompetition } from "@/hooks/useCompetition";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useEvents } from "@/hooks/useEvents";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useCompetitionCategories } from "@/hooks/useCompetitionCategories";
import { useEnabledCompetitionCategories } from "@/hooks/useEnabledCompetitionCategories";
import type {
  Competition,
  CompetitionCategory,
  Competitor,
  EnabledCompetitionCategory,
  EventPhase,
  EventWod,
  Leaderboard,
  LeaderboardStage,
} from "@/types";

vi.mock("@/hooks/useCompetition", () => ({
  useCompetition: vi.fn(),
}));
vi.mock("@/hooks/useLeaderboard", () => ({
  useLeaderboard: vi.fn(),
}));
vi.mock("@/hooks/useEvents", () => ({
  useEvents: vi.fn(),
}));
vi.mock("@/hooks/useCompetitors", () => ({
  useCompetitors: vi.fn(),
}));
vi.mock("@/hooks/useCompetitionCategories", () => ({
  useCompetitionCategories: vi.fn(),
}));
vi.mock("@/hooks/useEnabledCompetitionCategories", () => ({
  useEnabledCompetitionCategories: vi.fn(),
}));

const mockedUseCompetition = vi.mocked(useCompetition);
const mockedUseLeaderboard = vi.mocked(useLeaderboard);
const mockedUseEvents = vi.mocked(useEvents);
const mockedUseCompetitors = vi.mocked(useCompetitors);
const mockedUseCompetitionCategories = vi.mocked(useCompetitionCategories);
const mockedUseEnabledCompetitionCategories = vi.mocked(
  useEnabledCompetitionCategories,
);

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

const qualifierWods = [1, 2, 3, 4].map((n) =>
  makeWod({ id: n, event_number: n, name: `WOD ${n}` }),
);
const finalWod = makeWod({ id: 5, phase: "FINAL", event_number: 1, name: "Grace" });

const qualifierResults = Array.from({ length: 4 }, (_, i) =>
  makeEventResult({
    event_id: i + 1,
    event_number: i + 1,
    event_name: `WOD ${i + 1}`,
    phase: "QUALIFIER",
    result: "03:00",
    event_rank: 1,
    score: 100,
  }),
);

const overall: Leaderboard[] = [
  makeLeaderboard({
    stage: "final",
    category: { code: "rx", name: "RX" },
    entries: [
      {
        rank: 1,
        competitor_id: 10,
        display_name: "Ana López",
        final_score: "500",
        event_ranks: [1, 1, 1, 1, 1],
        event_scores: [100, 100, 100, 100, 100],
        event_results: [
          ...qualifierResults,
          makeEventResult({
            event_id: 5,
            event_number: 1,
            event_name: "Grace",
            phase: "FINAL",
            result: "04:00",
            event_rank: 1,
            score: 100,
          }),
        ],
      },
      {
        rank: 2,
        competitor_id: 30,
        display_name: "No Clasifica",
        final_score: "350",
        event_ranks: [2, 2, 2, 2],
        event_scores: [100, 100, 100, 50],
        event_results: qualifierResults.map((r, i) => ({
          ...r,
          event_rank: 2,
          score: i === 3 ? 50 : 100,
        })),
      },
    ],
  }),
];

function mockEvents(qualifier: typeof qualifierWods, fina: EventWod[]) {
  mockedUseEvents.mockImplementation(
    (_id: string | number | undefined, phase: EventPhase | undefined) => {
      if (phase === "FINAL") return result(fina);
      return result(qualifier);
    },
  );
}

function mockLeaderboards(lbs: Leaderboard[] = overall): void {
  mockedUseLeaderboard.mockImplementation(
    (_id: string | number | undefined, s: LeaderboardStage | undefined) =>
      result<Leaderboard[]>(s === "final" ? lbs : []),
  );
}

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
    mockEvents(qualifierWods, [finalWod]);
    mockLeaderboards();
    mockedUseEnabledCompetitionCategories.mockReturnValue(
      result<EnabledCompetitionCategory[]>([]),
    );
    mockedUseCompetitionCategories.mockReturnValue(
      result<CompetitionCategory[]>([]),
    );
    mockedUseCompetitors.mockReturnValue(result<Competitor[]>([]));
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

  it("renders the map iframe when coordinates arrive as strings (backend shape)", () => {
    mockedUseCompetition.mockReturnValue(
      result<Competition>(
        makeCompetition({
          location: {
            id: 1,
            name: "Box El Pilar",
            city: "BsAs",
            state: "BsAs",
            country: "AR",
            latitude: "19.826473",
            longitude: "-90.524499",
          },
        }),
      ),
    );
    renderDetail();
    const mapFrame = screen.getByTitle("Mapa de Box El Pilar");
    expect(mapFrame).toBeInTheDocument();
    expect(mapFrame.getAttribute("src")).toContain("q=19.826473,-90.524499");
    expect(mapFrame.getAttribute("src")).toContain("z=19");
  });

  it("centers the map on the coordinates at a near zoom", () => {
    renderDetail();
    const mapFrame = screen.getByTitle("Mapa de Box El Pilar");
    const src = mapFrame.getAttribute("src") ?? "";
    expect(src).toContain("q=-34.6,-58.38");
    expect(src).toContain("z=19");
    expect(src).toContain("output=embed");
  });

  it("shows 'Mapa no disponible' when coordinates are null", () => {
    mockedUseCompetition.mockReturnValue(
      result<Competition>(
        makeCompetition({
          location: {
            id: 1,
            name: "Box El Pilar",
            city: "BsAs",
            state: "BsAs",
            country: "AR",
            latitude: null,
            longitude: null,
          },
        }),
      ),
    );
    renderDetail();
    expect(screen.getByText("Mapa no disponible")).toBeInTheDocument();
  });

  it("renders WODs as cards per phase", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "Workouts" })).toBeInTheDocument();
    expect(document.querySelectorAll("details").length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText("WOD 1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getAllByText("Final").length).toBeGreaterThan(0);
  });

  it("renders unified leaderboard with additive total", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(screen.getByText("No Clasifica")).toBeInTheDocument();

    // Puntajes por WOD: qualifier (100) y final (100)
    expect(screen.getAllByText("100").length).toBeGreaterThanOrEqual(3);

    // Total aditivo: 400 (qualifier) + 100 (final) = 500
    expect(screen.getByText("500")).toBeInTheDocument();

    // El no clasificado muestra "—" en la fase final (sin puntos) y en Total
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows medal icons for the WOD winner in the leaderboard", () => {
    renderDetail();
    // Ana gana todos los WODs (event_rank 1) → al menos una medalla de oro
    expect(screen.getAllByTestId("medal-1").length).toBeGreaterThan(0);
  });

  it("does not show a silver medal icon for a WOD runner-up", () => {
    renderDetail();
    // Solo el ganador de cada WOD lleva insignia con color; 2.º y 3.º van sin color
    expect(screen.queryAllByTestId("medal-2").length).toBe(0);
  });

  it("allows filtering leaderboard by category", async () => {
    mockLeaderboards([
      overall[0],
      makeLeaderboard({
        stage: "final",
        category: { code: "scaled", name: "Scaled" },
        entries: [
          {
            rank: 1,
            competitor_id: 20,
            display_name: "María García",
            final_score: "300",
            event_ranks: [1],
            event_scores: [300],
            event_results: [
              makeEventResult({ event_id: 1, event_number: 1, phase: "QUALIFIER", score: 300 }),
            ],
          },
        ],
      }),
    ]);

    renderDetail();

    expect(screen.getByText("Ana López")).toBeInTheDocument();
    const select = screen.getByLabelText("Categoría");
    expect(select).toHaveValue("rx");

    await userEvent.selectOptions(select, "scaled");
    expect(screen.getByText("María García")).toBeInTheDocument();
    expect(screen.queryByText("Ana López")).not.toBeInTheDocument();
  });

  it("shows empty state when competition has no events", () => {
    mockEvents([], []);
    renderDetail();
    expect(screen.getByText("Sin eventos")).toBeInTheDocument();
  });

  it("shows categories with registered counts before the workouts", () => {
    const rxEnabled = makeEnabledCompetitionCategory({
      id: 3,
      competition: competition.id,
      competition_category: 1,
    });
    mockedUseEnabledCompetitionCategories.mockReturnValue(
      result<EnabledCompetitionCategory[]>([rxEnabled]),
    );
    mockedUseCompetitionCategories.mockReturnValue(
      result<CompetitionCategory[]>([makeCompetitionCategory({ id: 1, name: "RX" })]),
    );
    mockedUseCompetitors.mockReturnValue(
      result<Competitor[]>([
        makeCompetitor({ enabled_competition_category: 3 }),
        makeCompetitor({ id: 2, enabled_competition_category: 3 }),
      ]),
    );

    renderDetail();

    expect(
      screen.getByRole("heading", { name: "Categorías e inscritos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 inscritos")).toBeInTheDocument();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    const categoriesIndex = headings.findIndex((t) => t === "Categorías e inscritos");
    const workoutsIndex = headings.findIndex((t) => t === "Workouts");
    expect(categoriesIndex).toBeGreaterThan(-1);
    expect(workoutsIndex).toBeGreaterThan(categoriesIndex);
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

  it("shows hero stat cards with athletes, categories and wods", () => {
    mockedUseCompetitors.mockReturnValue(
      result<Competitor[]>([
        makeCompetitor({ id: 1 }),
        makeCompetitor({ id: 2 }),
        makeCompetitor({ id: 3 }),
      ]),
    );

    renderDetail();

    expect(screen.getByText("Atletas")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("WODs")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("Finalistas")).toBeNull();
  });

  it("shows action buttons and shares the current URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderDetail();

    expect(screen.getByRole("button", { name: "Ver Workouts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver Leaderboard" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Compartir" }));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText("Enlace copiado.")).toBeInTheDocument();
  });

  it("renders the progress bar from active events", () => {
    const inactiveQual = makeWod({
      id: 9,
      phase: "QUALIFIER",
      event_number: 9,
      name: "WOD Oculto",
      is_active: false,
    });
    mockEvents([...qualifierWods, inactiveQual], [finalWod]);

    renderDetail();

    expect(
      screen.getByLabelText("5 de 6 eventos activos"),
    ).toBeInTheDocument();
  });

  it("exposes section ids for scroll anchors", () => {
    renderDetail();
    expect(document.getElementById("info")).not.toBeNull();
    expect(document.getElementById("workouts")).not.toBeNull();
    expect(document.getElementById("leaderboard")).not.toBeNull();
    expect(document.getElementById("categorias")).not.toBeNull();
  });
});