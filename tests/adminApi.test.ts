import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAffiliation,
  createCompetitionCategory,
  createCompetitor,
  createLocation,
  createTeam,
  deleteAffiliation,
  deleteCompetitionCategory,
  deleteCompetitor,
  deleteLocation,
  deleteTeam,
  updateAffiliation,
  updateCompetitionCategory,
  updateCompetitor,
  updateLocation,
  createEnabledCompetitionCategory,
  updateEnabledCompetitionCategory,
  deleteEnabledCompetitionCategory,
  fetchEnabledCompetitionCategories,
  fetchAffiliations,
  fetchCompetitors,
  fetchEventCompetitors,
  createEventCompetitor,
  updateEventCompetitorResult,
  deleteEventCompetitor,
  fetchLocations,
  fetchTeams,
  fetchAdminCompetitions,
  updateTeam,
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

describe("locations catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks catalog writes when user is not superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: false });
    await expect(
      createLocation({
        name: "Paraná Raquet",
        address: "Av. Alem 123",
        city: "Paraná",
        state: "Entre Ríos",
        country: "Argentina",
      }),
    ).rejects.toThrow("No tenés permisos");
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("fetches the locations catalog", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        { id: 1, name: "Paraná Raquet", city: "Paraná", state: "Entre Ríos", country: "Argentina" },
      ],
    });
    const result = await fetchLocations();
    expect(result).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledWith("/locations/?page_size=100");
  });

  it("POSTs a new location when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue({
      id: 9,
      name: "Paraná Raquet",
      address: "Av. Alem 123",
      city: "Paraná",
      state: "Entre Ríos",
      country: "Argentina",
    });
    await createLocation({
      name: "Paraná Raquet",
      address: "Av. Alem 123",
      city: "Paraná",
      state: "Entre Ríos",
      country: "Argentina",
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/locations/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("PATCHes a location when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue({
      id: 9,
      name: "Paraná Raquet",
      address: "Av. Alem 123",
      city: "Paraná",
      state: "Entre Ríos",
      country: "Argentina",
    });
    await updateLocation({
      id: 9,
      name: "Paraná Raquet",
      address: "Av. Alem 123",
      city: "Paraná",
      state: "Entre Ríos",
      country: "Argentina",
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/locations/9/",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("DELETEs a location when superuser", async () => {
    useAuthStore.getState().setUser({ is_superuser: true });
    mockedRequest.mockResolvedValue(undefined);
    await deleteLocation(9);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/locations/9/",
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

describe("competitors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches competitors for a competition as a paginated scope", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        {
          id: 1,
          competitor_type: "INDIVIDUAL",
          athlete: 10,
          team: null,
          registration_number: "001",
          competition: 1,
          enabled_competition_category: 1,
        },
      ],
    });
    const result = await fetchCompetitors(1);
    expect(result).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competitors/?competition=1&page_size=100",
    );
  });

  it("POSTs a competitor, sending the unused foreign key as null", async () => {
    mockedRequest.mockResolvedValue({ id: 2 });
    await createCompetitor({
      competitor_type: "TEAM",
      athlete: null,
      team: 20,
      registration_number: "010",
      competition: 1,
      enabled_competition_category: 1,
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competitors/",
      expect.objectContaining({ method: "POST" }),
    );
    const options = mockedRequest.mock.calls[0][1];
    expect(JSON.parse(String(options?.body ?? "{}"))).toEqual({
      competitor_type: "TEAM",
      athlete: null,
      team: 20,
      registration_number: "010",
      competition: 1,
      enabled_competition_category: 1,
    });
  });

  it("PATCHes a competitor", async () => {
    mockedRequest.mockResolvedValue({ id: 2 });
    await updateCompetitor({
      id: 2,
      competitor_type: "INDIVIDUAL",
      athlete: 11,
      team: null,
      registration_number: "010",
      competition: 1,
      enabled_competition_category: 1,
    });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competitors/2/",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("DELETEs a competitor", async () => {
    mockedRequest.mockResolvedValue(undefined);
    await deleteCompetitor(2);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/competitors/2/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("teams catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the teams catalog globally", async () => {
    mockedRequest.mockResolvedValue({
      results: [{ id: 20, name: "Team El Pilar" }],
    });
    const result = await fetchTeams();
    expect(result).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledWith("/teams/?page_size=100");
  });

  it("POSTs a new team globally", async () => {
    mockedRequest.mockResolvedValue({ id: 9, name: "Team El Pilar" });
    await createTeam({ name: "Team El Pilar" });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/teams/",
      expect.objectContaining({ method: "POST" }),
    );
    const options = mockedRequest.mock.calls[0][1];
    expect(JSON.parse(String(options?.body ?? "{}"))).toEqual({
      name: "Team El Pilar",
    });
  });

  it("PATCHes a team globally", async () => {
    mockedRequest.mockResolvedValue({ id: 9, name: "Team El Pilar" });
    await updateTeam({ id: 9, name: "Team El Pilar" });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/teams/9/",
      expect.objectContaining({ method: "PATCH" }),
    );
    const options = mockedRequest.mock.calls[0][1];
    expect(JSON.parse(String(options?.body ?? "{}"))).toEqual({
      id: 9,
      name: "Team El Pilar",
    });
  });

  it("DELETEs a team globally", async () => {
    mockedRequest.mockResolvedValue(undefined);
    await deleteTeam(9);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/teams/9/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("event-competitors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches event results for an event as a paginated scope", async () => {
    mockedRequest.mockResolvedValue({
      results: [
        {
          id: 100,
          competitor: 1,
          event: 5,
          result: "06:12",
          event_rank: null,
          score: null,
        },
      ],
    });
    const result = await fetchEventCompetitors(5);
    expect(result).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/event-competitors/?event=5&page_size=100",
    );
  });

  it("POSTs a new event result", async () => {
    mockedRequest.mockResolvedValue({
      id: 100,
      competitor: 1,
      event: 5,
      result: "150",
      event_rank: null,
      score: null,
    });
    await createEventCompetitor({ competitor: 1, event: 5, result: "150" });
    expect(mockedRequest).toHaveBeenCalledWith(
      "/event-competitors/",
      expect.objectContaining({ method: "POST" }),
    );
    const options = mockedRequest.mock.calls[0][1];
    expect(JSON.parse(String(options?.body ?? "{}"))).toEqual({
      competitor: 1,
      event: 5,
      result: "150",
    });
  });

  it("PATCHes only the result", async () => {
    mockedRequest.mockResolvedValue({
      id: 9,
      competitor: 1,
      event: 5,
      result: "03:20",
      event_rank: null,
      score: null,
    });
    await updateEventCompetitorResult(9, "03:20");
    expect(mockedRequest).toHaveBeenCalledWith(
      "/event-competitors/9/",
      expect.objectContaining({ method: "PATCH" }),
    );
    const options = mockedRequest.mock.calls[0][1];
    expect(JSON.parse(String(options?.body ?? "{}"))).toEqual({
      result: "03:20",
    });
  });

  it("DELETEs an event result", async () => {
    mockedRequest.mockResolvedValue(undefined);
    await deleteEventCompetitor(9);
    expect(mockedRequest).toHaveBeenCalledWith(
      "/event-competitors/9/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});