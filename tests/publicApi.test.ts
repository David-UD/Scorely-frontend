import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCompetitions,
  getCompetition,
  getLeaderboard,
  getEvents,
  getEnabledCompetitionCategories,
} from "@/api/public";
import { request, ApiError } from "@/api/client";

vi.mock("@/api/client", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/client")>("@/api/client");
  class MockApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }
  return {
    ...actual,
    request: vi.fn(),
    ApiError: MockApiError,
  };
});

const mockedRequest = vi.mocked(request);

describe("getLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps backend blocks to the Leaderboard shape", async () => {
    mockedRequest.mockResolvedValue({
      category: "RX Individual",
      entries: [
        {
          rank: 1,
          competitor_id: 21,
          display_name: "Alex Barna1",
          final_score: 100,
          event_ranks: [1],
          event_scores: [100],
        },
      ],
    });

    const result = await getLeaderboard(8, "qualifier");
    expect(mockedRequest).toHaveBeenCalledWith(
      "/leaderboards/competition/8/qualifier/",
      { auth: false },
    );
    expect(result).toHaveLength(1);
    expect(result[0].competition_id).toBe(8);
    expect(result[0].stage).toBe("qualifier");
    expect(result[0].category).toEqual({
      code: "rx-individual",
      name: "RX Individual",
    });
    expect(result[0].entries[0].display_name).toBe("Alex Barna1");
    expect(result[0].entries[0].event_scores).toEqual([100]);
  });

  it("keeps category objects when the API already provides code/name", async () => {
    mockedRequest.mockResolvedValue({
      category: { code: "rx", name: "RX" },
      entries: [],
    });

    const result = await getLeaderboard(8, "qualifier");
    expect(result[0].category).toEqual({ code: "rx", name: "RX" });
  });

  it("returns an empty list when the stage has no leaderboard (404)", async () => {
    mockedRequest.mockRejectedValue(new ApiError("Not found", 404));
    const result = await getLeaderboard(8, "final");
    expect(result).toEqual([]);
  });

  it("re-throws other errors", async () => {
    mockedRequest.mockRejectedValue(new ApiError("Server error", 500));
    await expect(getLeaderboard(8, "final")).rejects.toThrow(ApiError);
  });
});

describe("getEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests events filtered by competition and phase, without auth", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        { id: 1, competition: 8, phase: "QUALIFIER", event_number: 1, name: "Fran" },
      ],
    });

    const result = await getEvents(8, "QUALIFIER");
    expect(mockedRequest).toHaveBeenCalledWith(
      "/events/?competition=8&page_size=100&phase=QUALIFIER",
      { auth: false },
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Fran");
  });

  it("allows fetching all phases when no phase filter is passed", async () => {
    mockedRequest.mockResolvedValue({ results: [] });
    await getEvents(8);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/events/?competition=8&page_size=100",
      { auth: false },
    );
  });

  it("unwraps a plain array response", async () => {
    mockedRequest.mockResolvedValue([{ id: 1, competition: 8, phase: "FINAL", event_number: 1 }]);
    const result = await getEvents(8, "FINAL");
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe("FINAL");
  });
});

describe("getEnabledCompetitionCategories", () => {
  it("maps finalist_slots and category refs", async () => {
    mockedRequest.mockResolvedValue([
      {
        id: 3,
        competition: 8,
        finalist_slots: 10,
        competition_category: { id: 1, code: "rx", name: "RX" },
      },
    ]);

    const result = await getEnabledCompetitionCategories(8);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/enabled-competition-categories/?competition=8",
      { auth: false },
    );
    expect(result).toEqual([
      {
        id: 3,
        competition: 8,
        finalist_slots: 10,
        competition_category: { id: 1, code: "rx", name: "RX" },
      },
    ]);
  });
});

describe("public read endpoints never attach the auth header", () => {
  it("getCompetitions calls request without auth", async () => {
    mockedRequest.mockResolvedValue({ results: [] });
    await getCompetitions({ status: "published" });
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("/competitions/"),
      { auth: false },
    );
  });

  it("getCompetition calls request without auth", async () => {
    mockedRequest.mockResolvedValue({ id: 8 });
    await getCompetition(8);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competitions/8/",
      { auth: false },
    );
  });
});