import type { Competition, CompetitionStage, Leaderboard, EventWod } from "@/types";

export function makeCompetition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: 1,
    name: "Open CrossFit Ciudad 2026",
    description: "Competición de prueba",
    slug: "open-crossfit-ciudad-2026",
    competition_type: { code: "crossfit", name: "CrossFit" },
    status: { code: "published", name: "Publicada" },
    affiliation: {
      id: 1,
      name: "Box El Pilar",
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "Argentina",
    },
    location: {
      id: 1,
      name: "Box El Pilar",
      address: "Av. siempre viva 123",
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    },
    year: 2026,
    start_date: "2026-05-01",
    end_date: "2026-05-03",
    ...overrides,
  };
}

export function makeStage(overrides: Partial<CompetitionStage> = {}): CompetitionStage {
  return {
    id: 1,
    competition: 1,
    name: "Qualifier",
    ...overrides,
  };
}

export function makeWod(overrides: Partial<EventWod> = {}): EventWod {
  return {
    id: 1,
    competition_stage: 1,
    event_number: 1,
    name: "Fran",
    workout: "21-15-9\nThrusters 43kg\nPull-ups",
    description: "21-15-9 thrusters y pull-ups",
    is_ascending: true,
    is_active: true,
    ...overrides,
  };
}

export function makeLeaderboard(
  overrides: Partial<Leaderboard> = {},
): Leaderboard {
  return {
    competition_id: 1,
    stage: "qualifier",
    category: { code: "rx", name: "RX" },
    entries: [
      {
        rank: 1,
        competitor_id: 10,
        display_name: "Ana López",
        final_score: "03:20",
        event_ranks: [1, 2],
        event_scores: [100, 94],
      },
      {
        rank: 2,
        competitor_id: 11,
        display_name: "Luis Pérez",
        final_score: "03:45",
        event_ranks: [2, 1],
        event_scores: [94, 100],
      },
    ],
    ...overrides,
  };
}