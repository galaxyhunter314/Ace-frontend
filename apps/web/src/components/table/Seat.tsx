"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClientPlayerState } from "@ace/shared";
import type { Card } from "@ace/poker-engine/deck";
import { motion } from "motion/react";
import { HoleCards } from "./HoleCards";

interface SeatProps {
  player: ClientPlayerState;
  myUserId: string;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  myCards: Card[] | undefined;
  playerIndex: number;
  isCurrentTurn: boolean;
  totalPlayers: number;
  timer: { userId: string; remainingSeconds: number } | null;
  isWinner?: boolean;
}

const GRADIENTS = [
  "from-fuchsia-500 to-rose-600",
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-violet-500 to-purple-700",
];

export function Seat({
  player,
  myUserId,
  smallBlindIndex,
  bigBlindIndex,
  myCards,
  playerIndex,
  isCurrentTurn,
  timer,
  isWinner = false,
}: SeatProps) {
  const isMe = player.userId === myUserId;
  const folded = player.folded;
  const allIn = player.allIn;
  const isSmallBlind = playerIndex === smallBlindIndex;
  const isBigBlind = playerIndex === bigBlindIndex;

  const initials = player.username.slice(0, 2).toUpperCase();
  const gradient = useMemo(() => {
    const hash = player.username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return GRADIENTS[hash % GRADIENTS.length];
  }, [player.username]);

  const [maxSeconds, setMaxSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (timer) {
      setMaxSeconds((current) => (current === null || timer.remainingSeconds > current ? timer.remainingSeconds : current));
    } else {
      setMaxSeconds(null);
    }
  }, [timer]);

  const pct = maxSeconds && timer ? (timer.remainingSeconds / maxSeconds) * 100 : 0;
  const isWarning = !!timer && timer.remainingSeconds <= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.82, y: 18 }}
      animate={{
        opacity: folded ? 0.45 : 1,
        scale: isCurrentTurn ? 1.035 : 1,
        y: 0,
        filter: folded ? "grayscale(1)" : "grayscale(0)",
      }}
      exit={{ opacity: 0, scale: 0.82 }}
      transition={{ type: "spring", stiffness: 210, damping: 24 }}
      className="relative flex w-[132px] flex-col items-center select-none sm:w-[156px]"
    >
      {isWinner && (
        <motion.div
          className="pointer-events-none absolute -inset-5 z-0 rounded-[28px] bg-amber-300/18 blur-2xl"
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.96, 1.1, 0.96] }}
          transition={{ duration: 1.25, repeat: Infinity }}
        />
      )}

      {isCurrentTurn && !folded && (
        <motion.div
          className={`pointer-events-none absolute -inset-3 z-0 rounded-[28px] ${isWarning ? "bg-red-500/16" : "bg-amber-300/14"} blur-xl`}
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.96, 1.08, 0.96] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative z-20 mb-1 flex h-[54px] items-end justify-center sm:h-[64px]">
        {isMe && myCards && myCards.length > 0 ? (
          <HoleCards cards={myCards} faceDown={false} isMe />
        ) : !isMe && player.holeCount > 0 && !folded ? (
          <HoleCards cards={Array(player.holeCount).fill(null)} faceDown isMe={false} />
        ) : null}
      </div>

      <motion.div
        className={`relative z-10 w-full overflow-visible rounded-2xl border px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_12px_30px_rgba(0,0,0,.5)] backdrop-blur-md transition-colors ${
          isWinner
            ? "border-amber-200/80 bg-[linear-gradient(180deg,rgba(71,44,8,.98),rgba(8,10,14,.96))]"
            : isCurrentTurn
            ? isWarning
              ? "border-red-400/80 ring-2 ring-red-500/25 bg-[linear-gradient(180deg,rgba(33,12,18,.96),rgba(7,10,15,.96))]"
              : "border-amber-300/75 ring-2 ring-amber-300/20 bg-[linear-gradient(180deg,rgba(30,25,12,.97),rgba(7,10,15,.96))]"
            : isMe
            ? "border-emerald-300/55 bg-[linear-gradient(180deg,rgba(9,27,22,.95),rgba(7,10,15,.94))]"
            : "border-white/12 bg-[linear-gradient(180deg,rgba(21,27,39,.92),rgba(7,10,15,.92))]"
        }`}
      >
        <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />

        <div className="absolute -right-1.5 -top-3 z-30 flex gap-1">
          {isSmallBlind && <img src="/assets/svg/badges/small-blind.svg" alt="Small blind" className="h-6 w-6 drop-shadow-lg" draggable={false} />}
          {isBigBlind && <img src="/assets/svg/badges/big-blind.svg" alt="Big blind" className="h-6 w-6 drop-shadow-lg" draggable={false} />}
        </div>

        {isWinner && (
          <div className="absolute -left-2 -top-3 rounded-full border border-amber-100/70 bg-amber-300 px-2 py-0.5 text-[8px] font-black text-slate-950 shadow-lg shadow-amber-400/35">
            WINNER
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            {isCurrentTurn && timer && (
              <svg className="absolute -inset-2 h-[60px] w-[60px] -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" className="fill-none stroke-white/10" strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className={`fill-none transition-all duration-300 ease-linear ${isWarning ? "stroke-red-400" : "stroke-amber-300"}`}
                  strokeWidth="4"
                  strokeDasharray={175.9}
                  strokeDashoffset={175.9 - (175.9 * pct) / 100}
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[11px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.34),0_6px_14px_rgba(0,0,0,.35)] ring-1 ring-white/18`}>
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className={`truncate text-[11px] font-black leading-tight ${isMe ? "text-emerald-200" : "text-white"}`}>
              {player.username}{isMe ? " (you)" : ""}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-300/16 bg-black/28 px-2 py-0.5 font-mono text-[10px] font-black text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.8)]" />
              {player.stack.toLocaleString()}
            </div>
          </div>
        </div>

        {allIn && !folded && (
          <span className="absolute -bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-orange-200/55 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-0.5 text-[8px] font-black tracking-wider text-white shadow-lg animate-pulse whitespace-nowrap">
            ALL-IN
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
