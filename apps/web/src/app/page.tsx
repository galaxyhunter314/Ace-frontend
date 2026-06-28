"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { getLoginUrl } from "@/lib/api";

export default function HomePage() {
  const { loaded, user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        <span className="text-[var(--color-primary)]">♠</span> Ace Poker
      </h1>

      <p className="max-w-md text-lg text-[var(--color-text-muted)]">
        Play poker online. Create tables, invite friends, and play.
      </p>

      {!loaded ? (
        <div className="h-10 w-40 animate-pulse rounded bg-[var(--color-surface)]" />
      ) : user ? (
        <Link
          href="/lobby"
          className="rounded bg-[var(--color-primary)] px-6 py-3 font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Go to Lobby
        </Link>
      ) : (
        <a
          href={getLoginUrl()}
          className="rounded bg-[var(--color-primary)] px-6 py-3 font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Login with Discord
        </a>
      )}
    </div>
  );
}
