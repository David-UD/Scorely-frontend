import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  makeCompetitionCategory,
  makeCompetitor,
  makeEnabledCompetitionCategory,
} from "./fixtures";
import CategoryInscritos from "@/components/public/CategoryInscritos";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useCompetitionCategories } from "@/hooks/useCompetitionCategories";
import { useEnabledCompetitionCategories } from "@/hooks/useEnabledCompetitionCategories";
import type {
  CompetitionCategory,
  Competitor,
  EnabledCompetitionCategory,
} from "@/types";

vi.mock("@/hooks/useCompetitors", () => ({
  useCompetitors: vi.fn(),
}));
vi.mock("@/hooks/useCompetitionCategories", () => ({
  useCompetitionCategories: vi.fn(),
}));
vi.mock("@/hooks/useEnabledCompetitionCategories", () => ({
  useEnabledCompetitionCategories: vi.fn(),
}));

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

const categories = [
  { code: "rx", name: "RX" },
  { code: "scaled", name: "Scaled" },
];

const catalog = [
  makeCompetitionCategory({ id: 1, name: "RX" }),
  makeCompetitionCategory({ id: 2, name: "Scaled" }),
];

const enabled = [
  makeEnabledCompetitionCategory({ id: 10, competition: 1, competition_category: 1 }),
  makeEnabledCompetitionCategory({ id: 20, competition: 1, competition_category: 2 }),
];

const competitors = [
  makeCompetitor({ id: 1, enabled_competition_category: 10 }),
  makeCompetitor({ id: 2, enabled_competition_category: 10 }),
  makeCompetitor({ id: 3, enabled_competition_category: 20 }),
];

describe("CategoryInscritos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseEnabledCompetitionCategories.mockReturnValue(result<EnabledCompetitionCategory[]>([]));
    mockedUseCompetitionCategories.mockReturnValue(result<CompetitionCategory[]>([]));
    mockedUseCompetitors.mockReturnValue(result<Competitor[]>([]));
  });

  it("shows the heading and a badge per category with the registered count", () => {
    mockedUseEnabledCompetitionCategories.mockReturnValue(
      result<EnabledCompetitionCategory[]>(enabled),
    );
    mockedUseCompetitionCategories.mockReturnValue(
      result<CompetitionCategory[]>(catalog),
    );
    mockedUseCompetitors.mockReturnValue(result<Competitor[]>(competitors));

    render(<CategoryInscritos competitionId={1} categories={categories} />);

    expect(
      screen.getByRole("heading", { name: "Categorías e inscritos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("RX")).toBeInTheDocument();
    expect(screen.getByText("2 inscritos")).toBeInTheDocument();
    expect(screen.getByText("Scaled")).toBeInTheDocument();
    expect(screen.getByText("1 inscrito")).toBeInTheDocument();
  });

  it("shows the counts in the same order as the leaderboard categories", () => {
    mockedUseEnabledCompetitionCategories.mockReturnValue(
      result<EnabledCompetitionCategory[]>(enabled),
    );
    mockedUseCompetitionCategories.mockReturnValue(
      result<CompetitionCategory[]>(catalog),
    );
    mockedUseCompetitors.mockReturnValue(result<Competitor[]>(competitors));

    const { container } = render(
      <CategoryInscritos
        competitionId={1}
        categories={[{ code: "scaled", name: "Scaled" }, { code: "rx", name: "RX" }]}
      />,
    );

    const names = Array.from(container.querySelectorAll("li")).map((li) =>
      li.textContent?.replace(/\d+\s+inscrito[s]?/, "").trim(),
    );
    expect(names).toEqual(["Scaled", "RX"]);
  });

  it("shows a spinner while data is loading", () => {
    mockedUseEnabledCompetitionCategories.mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
      isError: false,
      isFetching: true,
      isFetched: false,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<EnabledCompetitionCategory[]>);

    render(<CategoryInscritos competitionId={1} categories={categories} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Cargando inscritos…")).toBeInTheDocument();
  });

  it("wraps the cards in a horizontal carousel container (mobile)", () => {
    mockedUseEnabledCompetitionCategories.mockReturnValue(
      result<EnabledCompetitionCategory[]>(enabled),
    );
    mockedUseCompetitionCategories.mockReturnValue(
      result<CompetitionCategory[]>(catalog),
    );
    mockedUseCompetitors.mockReturnValue(result<Competitor[]>(competitors));

    const { container } = render(
      <CategoryInscritos competitionId={1} categories={categories} />,
    );

    const carousel = container.querySelector(".overflow-x-auto");
    expect(carousel).not.toBeNull();
    expect(carousel?.querySelector("ul")).not.toBeNull();
  });

  it("renders nothing when loading fails (graceful degradation)", () => {
    mockedUseCompetitors.mockReturnValue({
      data: undefined,
      isPending: false,
      isLoading: false,
      isError: true,
      isFetching: false,
      isFetched: false,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Competitor[]>);

    render(<CategoryInscritos competitionId={1} categories={categories} />);

    expect(
      screen.queryByRole("heading", { name: "Categorías e inscritos" }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when there are no categories", () => {
    render(<CategoryInscritos competitionId={1} categories={[]} />);

    expect(
      screen.queryByRole("heading", { name: "Categorías e inscritos" }),
    ).not.toBeInTheDocument();
  });
});