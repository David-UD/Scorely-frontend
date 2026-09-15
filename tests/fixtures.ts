import type {
  Competition,
  CompetitionCategory,
  EnabledCompetitionCategory,
  Leaderboard,
  EventWod,
  EventResult,
  EventPhase,
} from "@/types";

export function makeCompetitionCategory(
  overrides: Partial<CompetitionCategory> = {},
): CompetitionCategory {
  return {
    id: 1,
    name: "RX Individual",
    min_members: 1,
    max_members: 1,
    ...overrides,
  };
}

export function makeEnabledCompetitionCategory(
  overrides: Partial<EnabledCompetitionCategory> = {},
): EnabledCompetitionCategory {
  return {
    id: 1,
    competition: 1,
    competition_category: 1,
    finalist_slots: 2,
    ...overrides,
  };
}

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

export function makeWod(overrides: Partial<EventWod> = {}): EventWod {
  return {
    id: 1,
    competition: 1,
    phase: "QUALIFIER" as EventPhase,
    event_number: 1,
    name: "Fran",
    workout: "21-15-9\nThrusters 43kg\nPull-ups",
    description: "21-15-9 thrusters y pull-ups",
    is_ascending: true,
    is_active: true,
    ...overrides,
  };
}

export function makeEventResult(overrides: Partial<EventResult> = {}): EventResult {
  return {
    event_id: 1,
    event_number: 1,
    event_name: "Fran",
    phase: "QUALIFIER" as EventPhase,
    result: "06:12",
    event_rank: 1,
    score: 100,
    ...overrides,
  };
}

export function makeLeaderboard(
  overrides: Partial<Leaderboard> = {},
): Leaderboard {
  return {
    competition_id: 1,
    stage: "final",
    category: { code: "rx", name: "RX" },
    entries: [
      {
        rank: 1,
        competitor_id: 10,
        display_name: "Ana López",
        final_score: "200",
        event_ranks: [1, 1],
        event_scores: [100, 100],
        event_results: [
          makeEventResult({ event_id: 1, event_number: 1, phase: "QUALIFIER", score: 100 }),
          makeEventResult({ event_id: 2, event_number: 2, phase: "FINAL", score: 100 }),
        ],
      },
      {
        rank: 2,
        competitor_id: 11,
        display_name: "Luis Pérez",
        final_score: "194",
        event_ranks: [2, 2],
        event_scores: [94, 100],
        event_results: [
          makeEventResult({ event_id: 1, event_number: 1, phase: "QUALIFIER", score: 94, event_rank: 2 }),
          makeEventResult({ event_id: 2, event_number: 2, phase: "FINAL", score: 100, event_rank: 2 }),
        ],
      },
    ],
    ...overrides,
  };
}