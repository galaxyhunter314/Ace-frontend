"use client";

import { useAuthStore } from "@/stores/auth-store";
import { getLoginUrl } from "@/lib/api";

export function AuthButton() {
  const { loaded, user, loading, logout } = useAuthStore();

  if (!loaded) {
    return (
      <span className="h-8 w-24 animate-pulse rounded bg-[var(--color-surface)]" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm sm:inline text-[var(--color-text-muted)]">
          {user.username}
        </span>
        <button
          type="button"
          onClick={logout}
          disabled={loading}
          className="rounded bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? "..." : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <a
      href={getLoginUrl()}
      className="rounded bg-[var(--color-primary)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
    >
      Login with Discord
    </a>
  );
}
