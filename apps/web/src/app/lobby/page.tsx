"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useSocketStore } from "@/stores/socket-store";
import { useTableStore } from "@/stores/table-store";
import { apiFetch } from "@/lib/api";
import type { TableInfo } from "@/types";

export default function LobbyPage() {
  const { loaded, user } = useAuthStore();
  const socketConnected = useSocketStore((s) => s.status === "connected");
  const { tables, error, setTables, setError } = useTableStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Guard: redirect to home if not authenticated
  useEffect(() => {
    if (loaded && !user) router.replace("/");
  }, [loaded, user, router]);

  // Fetch table list on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiFetch<{ tables: TableInfo[] }>("/api/tables")
      .then((res) => {
        setTables(res.tables);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, setTables]);

  // Create a table via REST, then navigate to it
  const handleCreateTable = async () => {
    setCreating(true);
    setError(null);
    try {
      const { tableId } = await apiFetch<{ tableId: string }>("/api/tables", {
        method: "POST",
        body: JSON.stringify({ buyIn: 1000, speedMode: "normal" }),
      });
      // Navigate to the new table — the table page will handle socket join
      router.push(`/table/${tableId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create table";
      console.error("Failed to create table:", msg);
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  if (!loaded || !user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-muted)]">
            {tables.length} table{tables.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleCreateTable}
            disabled={creating || !socketConnected}
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 cursor-pointer transition-colors"
          >
            {creating ? "Creating..." : "+ New Table"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!socketConnected && (
        <div className="mb-4 rounded border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-2 text-sm text-[var(--color-warning)]">
          Socket disconnected — reconnect to join or play
        </div>
      )}

      {tables.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-[var(--color-text-muted)]">No tables yet.</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Click &quot;+ New Table&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => router.push(`/table/${table.id}`)}
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-sm">
                  Table {table.id.slice(0, 8)}
                </span>
                <span className="rounded bg-[var(--color-primary)]/20 px-2 py-0.5 text-xs text-[var(--color-primary)]">
                  {table.phase}
                </span>
              </div>

              <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
                <div className="flex justify-between">
                  <span>Players</span>
                  <span>{table.players.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Buy-in</span>
                  <span>{table.buyIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blinds</span>
                  <span>{table.bigBlind}/{table.smallBlind}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed</span>
                  <span className="capitalize">{table.speedMode}</span>
                </div>
              </div>

              {table.players.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {table.players.map((p) => (
                    <span
                      key={p.userId}
                      className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-xs"
                    >
                      {p.username}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Debug: raw JSON for validation */}
      <details className="mt-8">
        <summary className="cursor-pointer text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          Raw table data (JSON)
        </summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs">
          {JSON.stringify(tables, null, 2)}
        </pre>
      </details>
    </div>
  );
}
