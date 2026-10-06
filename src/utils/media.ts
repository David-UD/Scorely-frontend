import { API_BASE_URL } from "@/api/client";

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}