import { request, buildQuery, ApiError, type QueryParams } from "./client";
import type {
  CategoryRef,
  Competition,
  CompetitionStage,
  EventWod,
  Leaderboard,
  LeaderboardEntry,
  LeaderboardStage,
} from "@/types";

export interface CompetitionFilters {
  competition_type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function unwrapList<T>(data: T[] | Page<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as Page<T>).results)) {
    return (data as Page<T>).results;
  }
  return [];
}

export async function getCompetitions(
  params?: CompetitionFilters,
): Promise<Competition[]> {
  const query = buildQuery(params as QueryParams);
  const data = await request<Competition[] | Page<Competition>>(
    `/competitions/${query}`,
  );
  return unwrapList(data);
}

export async function getCompetition(id: number | string): Promise<Competition> {
  return request<Competition>(`/competitions/${id}/`);
}

export async function getCompetitionStages(
  competitionId: number | string,
): Promise<CompetitionStage[]> {
  const data = await request<unknown>(
    `/competition-stages/${buildQuery({ competition: competitionId })}`,
  );
  return normalizeStages(data);
}

interface RawStage {
  id: number;
  competition: number;
  stage_type?: string;
  qualification_count?: number;
  order?: number;
  name?: string;
  code?: string;
}

function toStage(raw: RawStage): CompetitionStage {
  const code = (raw.stage_type ?? raw.code ?? "").toLowerCase();
  return {
    id: raw.id,
    competition: raw.competition,
    name: raw.name ?? "",
    code,
  };
}

function normalizeStages(data: unknown): CompetitionStage[] {
  let blocks: RawStage[] = [];
  if (Array.isArray(data)) {
    blocks = data as RawStage[];
  } else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Page<RawStage>).results)
  ) {
    blocks = (data as Page<RawStage>).results;
  }
  return blocks.map(toStage);
}

export async function getEvents(stageId: number | string): Promise<EventWod[]> {
  const data = await request<EventWod[] | Page<EventWod>>(
    `/events/${buildQuery({ competition_stage: stageId })}`,
  );
  return unwrapList(data);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCategoryRef(raw: unknown): CategoryRef {
  if (raw && typeof raw === "object") {
    const obj = raw as CategoryRef;
    const name = String(obj.name ?? "");
    return { code: obj.code || slugify(name), name };
  }
  const name = String(raw ?? "");
  return { code: slugify(name), name };
}

function normalizeLeaderboards(
  data: unknown,
  competitionId: number | string,
  stage: LeaderboardStage,
): Leaderboard[] {
  let blocks: unknown[] = [];
  if (Array.isArray(data)) {
    blocks = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) blocks = obj.results;
    else if (Array.isArray(obj.leaderboards)) blocks = obj.leaderboards;
    else if (Array.isArray(obj.entries)) blocks = [data];
  }
  return blocks.map((block) => {
    const raw = (block ?? {}) as Record<string, unknown>;
    return {
      competition_id: Number(competitionId),
      stage,
      category: toCategoryRef(raw.category),
      entries: Array.isArray(raw.entries)
        ? (raw.entries as LeaderboardEntry[])
        : [],
    } as Leaderboard;
  });
}

export async function getLeaderboard(
  competitionId: number | string,
  stage: LeaderboardStage,
): Promise<Leaderboard[]> {
  let data: unknown;
  try {
    data = await request<unknown>(
      `/leaderboards/competition/${competitionId}/${stage}/`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
  return normalizeLeaderboards(data, competitionId, stage);
}