"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import {
  useAuthStore,
} from "@/stores/auth-store";
import { useSocketStore } from "@/stores/socket-store";
import { useGameStore } from "@/stores/game-store";
import { apiFetch } from "@/lib/api";
import { TableView } from "@/components/table/TableView";
import type { TableInfo } from "@/types";
import type { ActionType } from "@ace/poker-engine/types";
import type {
  GameSnapshot,
  ActionResult,
  HandEndEvent,
  GameErrorEvent,
  ClientGameState,
} from "@ace/shared";
import type { TimerPayload } from "@/types";

export default function TablePage() {
  const params = useParams<{ tableId: string }>();
  const tableId = params.tableId;
  const { loaded, user } = useAuthStore();
  const socket = useSocketStore((s) => s.socket);
  const {
    snapshot,
    lastActionResult,
    lastHandEnd,
    timer,
    setSnapshot,
    setActionResult,
    setHandEnd,
    setTimer,
    reset,
  } = useGameStore();
  const router = useRouter();
  const [tableMeta, setTableMeta] = useState<TableInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const joinedRef = useRef(false);
  const listenersAttached = useRef(false);

  // ── Guard: redirect if not authenticated ──────────────────────────
  useEffect(() => {
    if (loaded && !user) router.replace("/");
  }, [loaded, user, router]);

  // ── Fetch table detail (REST) ─────────────────────────────────────
  useEffect(() => {
    if (!user || !tableId) return;
    setLoading(true);
    apiFetch<{ table: TableInfo }>(`/api/tables/${tableId}`)
      .then((res) => {
        setTableMeta(res.table);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load table");
        setLoading(false);
      });
  }, [user, tableId]);

  // ── Helper: emit table:join safely ────────────────────────────────
  const joinTable = useCallback((s: Socket) => {
    if (!tableId) return;
    s.emit("table:join", { tableId });
    joinedRef.current = true;
  }, [tableId]);

  // ── Socket lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !tableId || !user) return;

    // Reset state for this table
    reset();
    joinedRef.current = false;
    listenersAttached.current = false;

    // Register all event handlers
    // Using `.off()` first to avoid duplicate handlers on re-render

    const onState = (snap: GameSnapshot) => {
      // Cast to ClientGameState — the server emits GameSnapshot (broadcast)
      // which has no myCards/myTurn. The viewerId field tells us the scope.
      const clientState: ClientGameState = {
        ...snap,
        myCards: snap.myCards ?? [],
        myStack:
          snap.players.find((p) => p.userId === user.discordId)?.stack ?? 0,
        myTurn: snap.currentTurn === user.discordId,
        actionTimer: 0,
      };
      setSnapshot(clientState);
    };

    const onActionResult = (result: ActionResult) => {
      setActionResult(result);
    };

    const onHandEnd = (event: HandEndEvent) => {
      setHandEnd(event);
    };

    const onTimer = (payload: TimerPayload) => {
      setTimer(payload, user.discordId);
    };

    const onError = (payload: GameErrorEvent) => {
      console.error("[table] game:error", payload);
      setError(payload.message || "An error occurred");
    };

    socket.on("game:state", onState);
    socket.on("game:action-result", onActionResult);
    socket.on("game:hand-end", onHandEnd);
    socket.on("game:timer", onTimer);
    socket.on("game:error", onError);

    listenersAttached.current = true;

    // Join the table (emit after listeners are registered)
    joinTable(socket);

    // Cleanup
    return () => {
      socket.off("game:state", onState);
      socket.off("game:action-result", onActionResult);
      socket.off("game:hand-end", onHandEnd);
      socket.off("game:timer", onTimer);
      socket.off("game:error", onError);

      reset();
    };
  }, [socket, tableId, user, setSnapshot, setActionResult, setHandEnd, setTimer, reset, joinTable]);

  // ── Handle socket reconnection: re-join table ─────────────────────
  useEffect(() => {
    if (!socket || !tableId || !user) return;

    const onReconnect = () => {
      // The socket reconnected — re-join the table to get state
      socket.emit("table:join", { tableId });
      joinedRef.current = true;
    };

    socket.on("connect", onReconnect);

    return () => {
      socket.off("connect", onReconnect);
    };
  }, [socket, tableId, user]);

  // ── Actions ───────────────────────────────────────────────────────

  const handleStartHand = useCallback(
    (tid: string) => {
      if (!socket) return;
      socket.emit("player:start", { tableId: tid });
    },
    [socket],
  );

  const handleAction = useCallback(
    (tid: string, action: ActionType, raiseTo?: number) => {
      if (!socket) return;
      setError(null);
      socket.emit("player:action", {
        tableId: tid,
        action,
        raiseTo,
      });
    },
    [socket],
  );

  const handleReady = useCallback(
    (tid: string) => {
      if (!socket) return;
      socket.emit("player:ready", { tableId: tid });
    },
    [socket],
  );

  // ── Leave table (via REST, then navigate back to lobby) ───────────

  const [leaving, setLeaving] = useState(false);

  const handleLeave = useCallback(async () => {
    if (!tableId) return;
    setLeaving(true);
    try {
      await apiFetch(`/api/tables/${tableId}/leave`, { method: "POST" });
      // Also emit socket leave in case the socket is still connected
      if (socket?.connected) {
        socket.emit("table:leave", { tableId });
      }
    } catch (err) {
      // Non-fatal — if REST leave fails, still navigate away
      console.error("Failed to leave table via REST:", err);
    }
    router.push("/lobby");
    setLeaving(false);
  }, [tableId, socket, router]);

  // ── Render ────────────────────────────────────────────────────────

  if (!loaded || !user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-[var(--color-danger)]">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/lobby")}
          className="rounded bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <>
      {snapshot ? (
        <TableView
          snapshot={snapshot}
          userId={user.discordId}
          lastActionResult={lastActionResult}
          lastHandEnd={lastHandEnd}
          timer={timer}
          onAction={handleAction}
          onStartHand={handleStartHand}
          onReady={handleReady}
          tableMeta={
            tableMeta
              ? {
                  id: tableMeta.id,
                  speedMode: tableMeta.speedMode,
                  handNumber: tableMeta.handNumber,
                }
              : null
          }
          onBack={() => router.push("/lobby")}
          onLeave={handleLeave}
          socketConnected={socket?.connected}
          error={error}
          onDismissError={() => setError(null)}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-[var(--color-text-muted)]">Loading game state...</p>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        </div>
      )}
    </>
  );
}
