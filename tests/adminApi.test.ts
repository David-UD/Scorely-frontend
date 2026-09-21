import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAffiliation,
  createCompetitionCategory,
  deleteAffiliation,
  deleteCompetitionCategory,
  updateAffiliation,
  updateCompetitionCategory,
  createEnabledCompetitionCategory,
  updateEnabledCompetitionCategory,
  deleteEnabledCompetitionCategory,
  fetchEnabledCompetitionCategories,
  fetchAffiliations,
  fetchAdminCompetitions,
} from "@/api/admin";
import { request } from "@/api/client";
import { useAuthStore } from "@/store/authStore";

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

describe("competition category catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks catalog writes when user is not superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: false });
    await expect(
      createCompetitionCategory({ name: "RX", min_members: 1, max_members: 1 }),
    ).rejects.toThrow("No tenés permisos");
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("POSTs a new category when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue({ id: 9, name: "RX", min_members: 1, max_members: 1 });
    await createCompetitionCategory({ name: "RX", min_members: 1, max_members: 1 });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competition-categories/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("PATCHes a category when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue({ id: 9, name: "RX", min_members: 1, max_members: 2 });
    await updateCompetitionCategory({ id: 9, name: "RX", min_members: 1, max_members: 2 });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competition-categories/9/",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("DELETEs a category when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue(undefined);
    await deleteCompetitionCategory(9);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competition-categories/9/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("affiliations catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks catalog writes when user is not superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: false });
    await expect(
      createAffiliation({
        name: "Box El Pilar",
        city: "Buenos Aires",
        state: "Buenos Aires",
        country: "Argentina",
      }),
    ).rejects.toThrow("No tenés permisos");
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("fetches the affiliations catalog", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        { id: 1, name: "Box El Pilar", city: "Buenos Aires", state: "Buenos Aires", country: "Argentina" },
      ],
    });
    const result = await fetchAffiliations();
    expect(result).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledWith("/affiliations/?page_size=100");
  });

  it("POSTs a new affiliation when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue({
      id: 9,
      name: "Box El Pilar",
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "Argentina",
    });
    await createAffiliation({
      name: "Box El Pilar",
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "Argentina",
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/affiliations/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("PATCHes an affiliation when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue({
      id: 9,
      name: "Box El Pilar",
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "Argentina",
    });
    await updateAffiliation({
      id: 9,
      name: "Box El Pilar",
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "Argentina",
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/affiliations/9/",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("DELETEs an affiliation when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue(undefined);
    await deleteAffiliation(9);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/affiliations/9/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("enabled competition categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches enabled categories for a competition", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        { id: 1, competition: 1, competition_category: 1, finalist_slots: 2 },
      ],
    });
    const result = await fetchEnabledCompetitionCategories(1);
    expect(result).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/enabled-competition-categories/?competition=1&page_size=100",
    );
  });

  it("POSTs an enabled category", async () => {
    mockedRequest.mockResolvedValue({
      id: 2,
      competition: 1,
      competition_category: 2,
      finalist_slots: 3,
    });
    await createEnabledCompetitionCategory({
      competition: 1,
      competition_category: 2,
      finalist_slots: 3,
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/enabled-competition-categories/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("PATCHes only finalist_slots", async () => {
    mockedRequest.mockResolvedValue({
      id: 2,
      competition: 1,
      competition_category: 2,
      finalist_slots: 4,
    });
    await updateEnabledCompetitionCategory({
      id: 2,
      competition: 1,
      competition_category: 2,
      finalist_slots: 4,
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/enabled-competition-categories/2/",
      expect.objectContaining({ method: "PATCH" }),
    );
    const options = mockedRequest.mock.calls[0][1];
    expect(JSON.parse(String(options?.body ?? "{}"))).toEqual({ finalist_slots: 4 });
  });

  it("DELETEs an enabled category", async () => {
    mockedRequest.mockResolvedValue(undefined);
    await deleteEnabledCompetitionCategory(2);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/enabled-competition-categories/2/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});