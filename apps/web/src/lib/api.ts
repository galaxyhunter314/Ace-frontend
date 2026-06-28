import type { MeResponse } from "@/types";

const BASE = ""; // proxied by Next.js rewrites

/**
 * Thin wrapper over fetch that sends cookies along (same-origin thanks
 * to the Next.js rewrite proxy) and handles JSON parsing / errors.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} on ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth helpers ────────────────────────────────────────────────────

export function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/me");
}

export function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

/** URL to kick off the Discord OAuth flow. */
export function getLoginUrl(): string {
  return "/api/auth/discord";
}
