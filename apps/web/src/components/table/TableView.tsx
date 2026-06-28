"use client";

import type {
  ClientGameState,
  ActionResult,
  HandEndEvent,
} from "@ace/shared";
import type { ActionType } from "@ace/poker-engine/types";
import { PokerTable } from "./PokerTable";

// ── Props ───────────────────────────────────────────────────────────

interface TableViewProps {
  /** Current game snapshot. */
  snapshot: ClientGameState;
  /** The logged-in user's ID. */
  userId: string;
  /** Action result from last action. */
  lastActionResult: ActionResult | null;
  /** Hand end event. */
  lastHandEnd: HandEndEvent | null;
  /** Current timer state. */
  timer: { userId: string; remainingSeconds: number } | null;
  /** Callback to emit an action. */
  onAction: (tableId: string, action: ActionType, raiseTo?: number) => void;
  /** Callback to start a new hand. */
  onStartHand: (tableId: string) => void;
  /** Callback to ready up for next hand. */
  onReady: (tableId: string) => void;
  /** Table metadata (phase, mode, etc.). */
  tableMeta: {
    id: string;
    speedMode: string;
    handNumber: number;
  } | null;
  /** Back to lobby callback. */
  onBack?: () => void;
  /** Leave table callback. */
  onLeave?: () => void;
  /** Socket connected state (shows warning when false). */
  socketConnected?: boolean;
  /** Soft error message. */
  error?: string | null;
  /** Dismiss the error. */
  onDismissError?: () => void;
  /** Show raw snapshot JSON. */
  debugSnapshot?: boolean;
}

/**
 * Full poker table view.
 *
 * Refactored to use the new PokerTable layout — full-screen dark theme
 * with green felt oval, seats positioned around the table, community
 * cards and pot centered, and action panel fixed at the bottom.
 */
export function TableView({
  snapshot,
  userId,
  lastActionResult,
  lastHandEnd,
  timer,
  onAction,
  onStartHand,
  onReady,
  tableMeta,
  onBack,
  onLeave,
  socketConnected,
  error,
  onDismissError,
  debugSnapshot,
}: TableViewProps) {
  return (
    <PokerTable
      snapshot={snapshot}
      userId={userId}
      lastActionResult={lastActionResult}
      lastHandEnd={lastHandEnd}
      timer={timer}
      onAction={onAction}
      onStartHand={onStartHand}
      onReady={onReady}
      tableMeta={tableMeta}
      onBack={onBack}
      onLeave={onLeave}
      socketConnected={socketConnected}
      error={error}
      onDismissError={onDismissError}
      debugSnapshot={debugSnapshot}
    />
  );
}
