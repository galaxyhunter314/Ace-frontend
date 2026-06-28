"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ClientGameState,
  ActionResult,
  HandEndEvent,
} from "@ace/shared";
import type { ActionType } from "@ace/poker-engine/types";
import { TableLayout } from "./TableLayout";
import { ActionPanel } from "./ActionPanel";

// ── Helpers ─────────────────────────────────────────────────────────

/** Compute action options from the game snapshot. */
function deriveActions(snapshot: ClientGameState, userId: string) {
  const me = snapshot.players.find((p) => p.userId === userId);
  if (!me || me.folded)
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      canRaise: false,
      callAmount: 0,
      minRaise: 0,
      maxRaise: 0,
    };

  const activePlayers = snapshot.players.filter((p) => !p.folded);
  const maxBet = Math.max(...activePlayers.map((p) => p.betThisRound));
  const callAmount = maxBet - me.betThisRound;

  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && me.stack > 0;
  const canFold =
    callAmount > 0 ||
    (callAmount === 0 && activePlayers.length > 1 && me.stack > 0);

  const minRaise = Math.max(snapshot.bigBlind, callAmount + snapshot.bigBlind);
  const maxRaise = me.stack;
  const canRaise =
    maxRaise > minRaise && activePlayers.length > 1 && !me.allIn;

  return { canFold, canCheck, canCall, canRaise, callAmount, minRaise, maxRaise };
}

// ── Props ───────────────────────────────────────────────────────────

interface PokerTableProps {
  snapshot: ClientGameState;
  userId: string;
  lastActionResult: ActionResult | null;
  lastHandEnd: HandEndEvent | null;
  timer: { userId: string; remainingSeconds: number } | null;
  onAction: (tableId: string, action: ActionType, raiseTo?: number) => void;
  onStartHand: (tableId: string) => void;
  onReady: (tableId: string) => void;
  tableMeta: {
    id: string;
    speedMode: string;
    handNumber: number;
  } | null;
  /** Callback to navigate back to lobby. */
  onBack?: () => void;
  /** Callback to leave the table. */
  onLeave?: () => void;
  /** Whether the socket is connected (shows warning banner). */
  socketConnected?: boolean;
  /** Soft error message to display. */
  error?: string | null;
  /** Dismiss the soft error. */
  onDismissError?: () => void;
  /** Show raw snapshot JSON for debugging. */
  debugSnapshot?: boolean;
}

// ── Component ───────────────────────────────────────────────────────

/**
 * Full-screen poker table experience.
 *
 * Dark theme, green felt oval in the center, seats positioned around it,
 * community cards and pot in the center, action panel fixed at the bottom.
 */
export function PokerTable({
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
}: PokerTableProps) {
  const [leaving, setLeaving] = useState(false);

  const {
    tableId,
    phase,
    players,
    communityCards,
    pot,
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
    currentTurn,
    myCards,
    version,
  } = snapshot;

  const isMyTurn = currentTurn === userId;
  const actionControls = deriveActions(snapshot, userId);
  const myPlayer = players.find((p) => p.userId === userId);
  const myIndex = players.findIndex((p) => p.userId === userId);
  const isHandInProgress =
    phase !== "waiting" && phase !== "finished";
  const actionPanelEnabled = isMyTurn && !myPlayer?.folded;
  const soundRefs = useRef<Record<"deal" | "flip" | "chips" | "winner", HTMLAudioElement | null>>({
    deal: null,
    flip: null,
    chips: null,
    winner: null,
  });
  const previousCounts = useRef({ community: communityCards.length, mine: myCards.length });
  const previousActionVersion = useRef<number | null>(null);
  const previousHandEndVersion = useRef<number | null>(null);

  const playSound = useCallback((key: keyof typeof soundRefs.current) => {
    if (typeof window === "undefined") return;
    const sources: Record<keyof typeof soundRefs.current, string> = {
      deal: "/assets/sounds/card-deal.mp3",
      flip: "/assets/sounds/card-flip.mp3",
      chips: "/assets/sounds/poker-chips.mp3",
      winner: "/assets/sounds/winner.mp3",
    };
    const audio = soundRefs.current[key] ?? new Audio(sources[key]);
    audio.volume = key === "winner" ? 0.42 : 0.28;
    audio.currentTime = 0;
    soundRefs.current[key] = audio;
    void audio.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (myCards.length > previousCounts.current.mine) playSound("deal");
    if (communityCards.length > previousCounts.current.community) playSound("flip");
    previousCounts.current = { community: communityCards.length, mine: myCards.length };
  }, [communityCards.length, myCards.length, playSound]);

  useEffect(() => {
    if (!lastActionResult || previousActionVersion.current === lastActionResult.version) return;
    previousActionVersion.current = lastActionResult.version;
    if (lastActionResult.amount || lastActionResult.action === "call" || lastActionResult.action === "raise" || lastActionResult.action === "allin") {
      playSound("chips");
    }
  }, [lastActionResult, playSound]);

  useEffect(() => {
    if (!lastHandEnd || previousHandEndVersion.current === lastHandEnd.version) return;
    previousHandEndVersion.current = lastHandEnd.version;
    playSound("winner");
  }, [lastHandEnd, playSound]);

  const ambientStyle = useMemo(
    () => ({
      backgroundImage:
        "url('/assets/textures/dark-pattern.png'), radial-gradient(circle at 50% -10%, rgba(251,191,36,.13), transparent 34%), radial-gradient(circle at 18% 28%, rgba(16,185,129,.13), transparent 30%), radial-gradient(circle at 84% 24%, rgba(59,130,246,.10), transparent 30%), linear-gradient(180deg,#07111f 0%,#030711 55%,#02040a 100%)",
      backgroundSize: "360px 360px, auto, auto, auto, auto",
    }),
    [],
  );

  const handleAction = useCallback(
    (action: ActionType, amount?: number) => {
      onAction(tableId, action, amount);
    },
    [onAction, tableId],
  );

  const handleStartHand = useCallback(() => {
    onStartHand(tableId);
  }, [onStartHand, tableId]);

  const handleReady = useCallback(() => {
    onReady(tableId);
  }, [onReady, tableId]);

  const handleLeave = useCallback(async () => {
    if (!onLeave) return;
    setLeaving(true);
    await onLeave();
  }, [onLeave]);

  const handleDismissError = useCallback(() => {
    onDismissError?.();
  }, [onDismissError]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#030711] text-slate-100 select-none">
      {/* ── Socket disconnected warning ────────────────── */}
      {socketConnected === false && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-bold text-amber-400 animate-pulse">
          ⚠️ Connection lost — reconnecting...
        </div>
      )}

      {/* ── Soft error banner ──────────────────────────── */}
      {error && (
        <div className="shrink-0 border-b border-red-500/25 bg-red-950/40 px-4 py-2 text-center text-xs font-semibold text-red-400 flex items-center justify-center gap-2">
          <span>⚠️ {error}</span>
          {onDismissError && (
            <button
              type="button"
              onClick={handleDismissError}
              className="ml-2 underline cursor-pointer hover:text-red-300"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* ── Header bar ─────────────────────────────────── */}
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-black/38 px-6 shadow-[0_12px_36px_rgba(0,0,0,.35)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* Back button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-xs font-black text-slate-300 transition-all hover:bg-white/12 hover:text-white"
            >
              ← Lobby
            </button>
          )}

          {/* Table info */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="font-mono text-[11px] font-black text-amber-100 bg-amber-300/8 border border-amber-200/18 px-3 py-1 rounded-full shadow-inner">
              Table: {tableMeta?.id?.slice(0, 8) ?? tableId?.slice(0, 8) ?? "—"}
            </span>
            <span className="capitalize px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-200 border border-emerald-300/18 text-[10px] font-black">
              {tableMeta?.speedMode ?? snapshot.speedMode}
            </span>
            {tableMeta?.handNumber !== undefined && (
              <span className="font-mono text-slate-500">Hand #{tableMeta.handNumber}</span>
            )}
          </div>
        </div>

        {/* Right side: timer + version */}
        <div className="flex items-center gap-4">
          {/* Active Turn Timer */}
          {timer && (
            <div className="flex items-center gap-2 rounded-full bg-white/6 border border-white/10 px-3 py-1.5 text-xs font-semibold shadow-inner">
              <span className="text-slate-500">⏱ Turn:</span>
              <span
                className={`font-mono font-black ${
                  timer.remainingSeconds <= 10
                    ? "text-red-500 animate-pulse"
                    : "text-purple-400"
                }`}
              >
                {timer.remainingSeconds}s
              </span>
            </div>
          )}

          {/* Leave table */}
          {onLeave && (
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving}
              className="cursor-pointer rounded-full border border-red-400/28 bg-red-500/10 px-3.5 py-1.5 text-xs font-black text-red-200 transition-all hover:bg-red-500/20 hover:text-white hover:border-red-300/50 disabled:opacity-50"
            >
              {leaving ? "Leaving..." : "Leave Table"}
            </button>
          )}

          <span className="hidden text-[10px] font-mono text-slate-600 sm:inline">
            v{version}
          </span>
        </div>
      </header>

      {/* ── Last action banner ──────────────────────────── */}
      {lastActionResult && (
        <div className="relative z-30 shrink-0 border-b border-white/8 bg-black/20 px-4 py-1.5 text-center text-xs font-semibold text-slate-400 backdrop-blur-sm">
          🔊 <span className="text-slate-200 font-bold">{lastActionResult.actor.username}</span> {lastActionResult.action}
          {lastActionResult.amount ? ` to ${lastActionResult.amount.toLocaleString()}` : ""}
          {lastActionResult.next ? ` (Next: ${lastActionResult.next})` : ""}
        </div>
      )}

      {/* ── Main table area ────────────────────────────── */}
      <main className="relative z-20 flex min-h-0 flex-1 items-center justify-center px-3 pb-28 pt-2 md:pb-24 lg:pr-[390px]">
        <div className="w-[98vw] max-w-[1280px] lg:w-[calc(100vw-430px)]">
          <TableLayout
            players={players}
            userId={userId}
            dealerIndex={dealerIndex}
            smallBlindIndex={smallBlindIndex}
            bigBlindIndex={bigBlindIndex}
            myCards={myCards}
            currentTurn={currentTurn}
            communityCards={communityCards}
            pot={pot}
            phase={phase}
            myIndex={myIndex}
            showControls={!isHandInProgress}
            canStart={players.length >= 2}
            onStartHand={handleStartHand}
            onReady={handleReady}
            timer={timer}
            lastActionResult={lastActionResult}
            lastHandEnd={lastHandEnd}
          />
        </div>
      </main>

      {/* ── Action panel: right sidebar on desktop, bottom dock on mobile ── */}
      {isHandInProgress && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t border-white/8 bg-black/10 px-4 pb-4 pt-2 backdrop-blur-sm lg:bottom-auto lg:left-auto lg:right-5 lg:top-1/2 lg:-translate-y-1/2 lg:justify-end lg:border-t-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <ActionPanel
            enabled={actionPanelEnabled}
            callAmount={actionControls.callAmount}
            minRaise={actionControls.minRaise}
            maxRaise={actionControls.maxRaise}
            canFold={actionControls.canFold}
            canCheck={actionControls.canCheck}
            canCall={actionControls.canCall}
            canRaise={actionControls.canRaise}
            onAction={handleAction}
            pot={pot}
            timer={timer?.userId === userId ? timer : null}
            totalBet={myPlayer?.totalBet ?? 0}
          />
        </div>
      )}

      {/* ── Hand end details ───────────────────────────── */}
      {lastHandEnd && (
        <div className="fixed bottom-24 left-4 z-40">
          <details className="rounded-xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
            <summary className="cursor-pointer text-xs font-bold text-slate-400 hover:text-white transition-colors">
              🏆 Hand ended details
            </summary>
            <div className="mt-2.5 space-y-1.5 border-t border-slate-800 pt-2 min-w-[200px]">
              {lastHandEnd.results
                .filter((r) => r.cards.length >= 2)
                .map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <span className="font-bold text-slate-200">{r.username}</span>
                    <span className="font-semibold text-emerald-400">
                      {r.handName || "?"}
                    </span>
                  </div>
                ))}
              {lastHandEnd.settlement.length > 0 && (
                <div className="mt-2 border-t border-slate-800 pt-2 text-[11px] text-slate-400 space-y-0.5">
                  {lastHandEnd.settlement.map((s, i) => (
                    <div key={i} className="flex justify-between">
                      <span>Winner:</span>
                      <span className="font-bold text-amber-400">+{s.totalWon.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {/* ── Waiting for players ── */}
      {phase === "waiting" && players.length < 2 && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 text-xs font-semibold text-slate-500 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800/50">
          Waiting for players... ({players.length}/2)
        </div>
      )}

      {/* ── Debug: raw snapshot JSON ───────────────────── */}
      {debugSnapshot && (
        <details className="fixed bottom-4 right-4 z-40 max-w-sm">
          <summary className="cursor-pointer rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
            Debug Snapshot JSON
          </summary>
          <pre className="mt-1 max-h-48 overflow-auto rounded border border-slate-800 bg-slate-900/90 p-2 text-[9px] font-mono shadow-xl text-slate-400">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

