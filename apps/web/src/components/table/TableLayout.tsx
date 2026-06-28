"use client";

import type { Card } from "@ace/poker-engine/deck";
import type { ActionResult, ClientPlayerState, HandEndEvent } from "@ace/shared";
import { AnimatePresence, motion } from "motion/react";
import { Seat } from "./Seat";
import { CommunityCards } from "./CommunityCards";
import { PotDisplay } from "./PotDisplay";
import { getSeatPositions } from "./SeatPosition";
import { TableBackground } from "./TableBackground";

// ── Props ───────────────────────────────────────────────────────────

interface TableLayoutProps {
  /** All players at the table. */
  players: ClientPlayerState[];
  /** The logged-in user's ID. */
  userId: string;
  /** Index of the dealer in the players array. */
  dealerIndex: number;
  /** Small blind index. */
  smallBlindIndex: number;
  /** Big blind index. */
  bigBlindIndex: number;
  /** The current player's hole cards (undefined for others). */
  myCards: Card[];
  /** ID of the player whose turn it is. */
  currentTurn: string | null;
  /** Community (board) cards. */
  communityCards: Card[];
  /** Total chips in the pot. */
  pot: number;
  /** Current phase string. */
  phase: string;
  /** The index of the current player in the players array. */
  myIndex: number;
  /** Whether to show the "Start Hand" / "Ready" / waiting controls. */
  showControls: boolean;
  /** Player count >= 2 for start. */
  canStart: boolean;
  /** Callback to start a hand. */
  onStartHand: () => void;
  /** Callback to ready up. */
  onReady: () => void;
  /** The countdown timer state. */
  timer: { userId: string; remainingSeconds: number } | null;
  /** Last betting action for chip-flight animation only. */
  lastActionResult: ActionResult | null;
  /** Last completed hand for winner glow and pot-to-winner animation. */
  lastHandEnd: HandEndEvent | null;
}

// ── Component ───────────────────────────────────────────────────────

/**
 * Renders the poker table surface with seated players, community cards,
 * pot display, animated chips, and phase controls all positioned within
 * the table area. This layer is UI-only: no game state mutation happens here.
 */
export function TableLayout({
  players,
  userId,
  dealerIndex,
  smallBlindIndex,
  bigBlindIndex,
  myCards,
  currentTurn,
  communityCards,
  pot,
  phase,
  myIndex,
  showControls,
  canStart,
  onStartHand,
  onReady,
  timer,
  lastActionResult,
  lastHandEnd,
}: TableLayoutProps) {
  const seatPositions = getSeatPositions(players.length, myIndex);
  const isWaiting = phase === "waiting";
  const isFinished = phase === "finished";
  const winnerIds = new Set(
    lastHandEnd?.settlement
      .filter((entry) => entry.totalWon > 0)
      .map((entry) => entry.userId) ?? [],
  );
  const actionPlayerIndex = lastActionResult
    ? players.findIndex((player) => player.userId === lastActionResult.actor.userId)
    : -1;
  const actionChipPosition = actionPlayerIndex >= 0 ? seatPositions[actionPlayerIndex] : null;
  const primaryWinnerIndex = players.findIndex((player) => winnerIds.has(player.userId));
  const primaryWinnerPosition = primaryWinnerIndex >= 0 ? seatPositions[primaryWinnerIndex] : null;

  return (
    <div className="relative mx-auto aspect-[7/4] w-full max-w-[1344px]">
      {/* Background felt */}
      <TableBackground />

      {/* Seats — absolutely positioned around the table */}
      <div className="absolute inset-0">
        {players.map((player, i) => {
          const pos = seatPositions[i];
          if (!pos) return null;

          return (
            <div
              key={player.userId}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <Seat
                player={player}
                myUserId={userId}
                dealerIndex={dealerIndex}
                smallBlindIndex={smallBlindIndex}
                bigBlindIndex={bigBlindIndex}
                myCards={i === myIndex ? myCards : undefined}
                playerIndex={i}
                isCurrentTurn={player.userId === currentTurn}
                totalPlayers={players.length}
                timer={timer?.userId === player.userId ? timer : null}
                isWinner={winnerIds.has(player.userId)}
              />
            </div>
          );
        })}
      </div>

      {/* Bet chips & dealer buttons on the felt */}
      <div className="pointer-events-none absolute inset-0 z-20 select-none">
        {players.map((player, i) => {
          const pos = seatPositions[i];
          if (!pos) return null;

          const hasBet = !player.folded && player.betThisRound > 0;
          const isDealer = i === dealerIndex;

          return (
            <div key={`felt-assets-${player.userId}`}>
              {hasBet && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.72, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="absolute flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-slate-950/85 px-3 py-1 shadow-lg"
                  style={{
                    left: `${pos.chipX}%`,
                    top: `${pos.chipY}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <img src="/assets/svg/chips/chip-stack-1.svg" alt="" draggable={false} className="h-5 w-5 drop-shadow" />
                  <span className="font-mono text-xs font-black leading-none text-amber-300">
                    {player.betThisRound.toLocaleString()}
                  </span>
                </motion.div>
              )}

              {isDealer && (
                <div
                  className="absolute flex h-8 w-8 items-center justify-center transition-all duration-300 drop-shadow-xl"
                  style={{
                    left: `${pos.dbX}%`,
                    top: `${pos.dbY}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title="Dealer Button"
                >
                  <img src="/assets/svg/table/dealer-button.svg" alt="Dealer" draggable={false} className="h-full w-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium one-shot chip flights into the pot and from pot to winner. */}
      <div className="pointer-events-none absolute inset-0 z-30 select-none">
        <AnimatePresence>
          {actionChipPosition && lastActionResult?.amount ? (
            <motion.img
              key={`chip-flight-${lastActionResult.version}-${lastActionResult.actor.userId}-${lastActionResult.action}`}
              src="/assets/svg/chips/chip-stack-5.svg"
              alt=""
              draggable={false}
              className="absolute h-10 w-10 drop-shadow-[0_16px_20px_rgba(0,0,0,.55)]"
              initial={{ left: `${actionChipPosition.chipX}%`, top: `${actionChipPosition.chipY}%`, opacity: 0, scale: 0.55, rotate: -18 }}
              animate={{ left: "50%", top: "49%", opacity: [0, 1, 1, 0], scale: [0.55, 1.08, 0.9, 0.42], rotate: 24 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, ease: "easeInOut" }}
              style={{ translateX: "-50%", translateY: "-50%" }}
            />
          ) : null}

          {isFinished && primaryWinnerPosition ? (
            <motion.img
              key={`pot-win-${lastHandEnd?.version ?? "finished"}-${primaryWinnerIndex}`}
              src="/assets/svg/chips/chip-stack-10.svg"
              alt=""
              draggable={false}
              className="absolute h-12 w-12 drop-shadow-[0_18px_24px_rgba(251,191,36,.35)]"
              initial={{ left: "50%", top: "50%", opacity: 0, scale: 0.8 }}
              animate={{ left: `${primaryWinnerPosition.chipX}%`, top: `${primaryWinnerPosition.chipY}%`, opacity: [0, 1, 1, 0], scale: [0.8, 1.15, 1, 0.58] }}
              transition={{ duration: 1.05, ease: "easeInOut" }}
              style={{ translateX: "-50%", translateY: "-50%" }}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Center area: community cards + pot */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3.5 select-none">
        {pot > 0 && (
          <div className="pointer-events-auto z-20">
            <PotDisplay pot={pot} phase={phase} pulse={!!lastActionResult?.amount} />
          </div>
        )}

        <div className="pointer-events-auto z-20">
          <CommunityCards cards={communityCards} />
        </div>

        {showControls && (
          <div className="pointer-events-auto z-20 mt-2">
            {isWaiting && (
              <>
                {canStart ? (
                  <button
                    type="button"
                    onClick={onStartHand}
                    className="cursor-pointer rounded-full border border-emerald-200/40 bg-gradient-to-r from-emerald-400 to-teal-500 px-7 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-95 sm:text-sm"
                  >
                    Start Hand
                  </button>
                ) : (
                  <p className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] text-slate-300 shadow-md backdrop-blur-sm sm:text-xs">
                    Waiting for players... ({players.length}/2)
                  </p>
                )}
              </>
            )}

            {isFinished && (
              <button
                type="button"
                onClick={onReady}
                className="cursor-pointer rounded-full border border-amber-200/40 bg-gradient-to-r from-amber-300 to-orange-500 px-7 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-95 sm:text-sm"
              >
                Ready for next hand
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
