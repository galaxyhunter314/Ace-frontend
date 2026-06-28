"use client";

import { useSocketStore } from "@/stores/socket-store";
import type { ConnectionStatus } from "@/stores/socket-store";

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; dot: string }
> = {
  connected: { label: "Connected", dot: "bg-[var(--color-success)]" },
  connecting: { label: "Connecting", dot: "bg-[var(--color-warning)]" },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-[var(--color-warning)]",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-[var(--color-danger)]",
  },
};

export function ConnectionStatusBadge() {
  const status = useSocketStore((s) => s.status);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]" title={cfg.label}>
      <span
        className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`}
      />
      <span className="hidden sm:inline">{cfg.label}</span>
    </div>
  );
}
