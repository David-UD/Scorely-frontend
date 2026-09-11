import { useAuthStore } from "@/store/authStore";
import type { TokenPair } from "@/types";

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/+$/, "");

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

export function clearSession() {
  useAuthStore.getState().clear();
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }
  const detail =
    typeof data === "object" && data !== null && "detail" in data
      ? String((data as { detail: unknown }).detail)
      : `Error HTTP ${response.status}`;
  return new ApiError(detail, response.status, data);
}

interface RequestOptions extends RequestInit {
  /** Adjuntar el token Bearer si hay sesión activa. Por defecto true. */
  auth?: boolean;
}

export async function request<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const { auth = true, ...init } = options ?? {};

  const doFetch = (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (auth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  };

  let response = await doFetch(getAccessToken());

  if (auth && response.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await doFetch(getAccessToken());
    }
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      clearSession();
      return false;
    }
    const data = (await response.json()) as TokenPair;
    useAuthStore.getState().setTokens(data);
    return true;
  } catch {
    clearSession();
    return false;
  }
}