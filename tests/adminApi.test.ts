import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAdminCompetitions } from "@/api/admin";
import { request } from "@/api/client";

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

describe("fetchAdminCompetitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests competitions with auth attached (no { auth: false })", async () => {
    mockedRequest.mockResolvedValue({ results: [] });
    await fetchAdminCompetitions();
    expect(mockedRequest).toHaveBeenCalledWith("/competitions/?page_size=100");
  });

  it("unwraps paginated results", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        { id: 1, name: "Solo mis competiciones" },
        { id: 2, name: "Otra asignada" },
      ],
    });
    const result = await fetchAdminCompetitions();
    expect(result).toHaveLength(2);
  });
});