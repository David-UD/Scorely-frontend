import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCompetitions,
  getCompetition,
  getLeaderboard,
  getCompetitionStages,
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

describe("getCompetitionStages", () => {
  it("maps stage_type to code and keeps name", async () => {
    mockedRequest.mockResolvedValue([
      { id: 12, competition: 8, stage_type: "QUALIFIER", order: 1 },
      { id: 13, competition: 8, stage_type: "FINAL", order: 2 },
    ]);
    mockedRequest.mockClear();

    const result = await getCompetitionStages(8);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competition-stages/?competition=8",
      { auth: false },
    );
    expect(result).toEqual([
      { id: 12, competition: 8, name: "", code: "qualifier" },
      { id: 13, competition: 8, name: "", code: "final" },
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