"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { ConnectionStatusBadge } from "@/components/connection-status";
import { useAuthStore } from "@/stores/auth-store";

export function Navbar() {
  const { loaded, user } = useAuthStore();

  return (
    <nav className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-3">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-lg font-bold text-[var(--color-primary)]"
        >
          ♠ Ace
        </Link>

        {user && (
          <Link
            href="/lobby"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Lobby
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {loaded && user && <ConnectionStatusBadge />}
        <AuthButton />
      </div>
    </nav>
  );
}
