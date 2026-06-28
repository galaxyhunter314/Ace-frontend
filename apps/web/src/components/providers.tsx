"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSocketStore } from "@/stores/socket-store";

/**
 * Initialises auth on mount and wires up socket connection lifecycle.
 * Must be a client component placed high in the tree.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const { loaded, user, initialize } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  // 1. Check session on first mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 2. Connect socket when authenticated, disconnect on logout
  useEffect(() => {
    if (!loaded) return;
    if (user) {
      // The socket store needs a token — in dev/prod the cookie is
      // sent by the browser, but the socket middleware needs an
      // explicit auth token. For now we connect without explicit
      // token; the cookie is available on the initial handshake.
      // The server's socketAuthMiddleware will read it from the
      // cookie header on the initial HTTP upgrade.
      connect("");
    } else {
      disconnect();
    }
  }, [loaded, user, connect, disconnect]);

  return <>{children}</>;
}
