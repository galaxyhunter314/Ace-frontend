import { create } from "zustand";
import type { ClientGameState, ActionResult, HandEndEvent } from "@ace/shared";
import type { TableInfo, TimerPayload } from "@/types";

/**
 * Per-table game state.
 * Mirrors the socket events pushed by the server so React components
 * can react to state changes declaratively.
 */
interface GameState {
  /** The current snapshot (null = no active game / not joined). */
  snapshot: ClientGameState | null;
  /** The last action result. */
  lastActionResult: ActionResult | null;
  /** The last hand-end event. */
  lastHandEnd: HandEndEvent | null;
  /** The running countdown for the current player's turn. */
  timer: { userId: string; remainingSeconds: number } | null;

  /** Replace the full snapshot (game:state). */
  setSnapshot: (snapshot: ClientGameState) => void;
  /** Append an action result (game:action-result). */
  setActionResult: (result: ActionResult) => void;
  /** Store the hand-end event (game:hand-end). */
  setHandEnd: (event: HandEndEvent) => void;
  /** Update the turn timer (game:timer). */
  setTimer: (payload: TimerPayload, localUserId: string) => void;
  /** Clear state for a table (e.g. on leave). */
  reset: () => void;
}

export const useGameStore = create<GameState>()((set) => ({
  snapshot: null,
  lastActionResult: null,
  lastHandEnd: null,
  timer: null,

  setSnapshot: (snapshot) => set({ snapshot }),

  setActionResult: (result) => set({ lastActionResult: result }),

  setHandEnd: (event) => set({ lastHandEnd: event }),

  setTimer: (payload, _localUserId) =>
    set({
      timer: {
        userId: payload.userId,
        remainingSeconds: payload.remainingSeconds,
      },
    }),

  reset: () =>
    set({
      snapshot: null,
      lastActionResult: null,
      lastHandEnd: null,
      timer: null,
    }),
}));
