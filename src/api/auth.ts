import { request, clearSession } from "./client";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser, TokenPair } from "@/types";

interface LoginResponse extends TokenPair {
  user?: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await request<LoginResponse>("/auth/token/", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  useAuthStore.getState().setTokens({
    access: data.access,
    refresh: data.refresh,
  });

  const user = await fetchCurrentUser().catch(() => ({ email }));
  useAuthStore.getState().setUser(user);
  return user;
}

export function logout() {
  clearSession();
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me/");
}