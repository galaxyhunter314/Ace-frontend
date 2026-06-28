"use client";

import { useEffect, useMemo, useState, type ButtonHTMLAttributes } from "react";
import type { ActionType } from "@ace/poker-engine/types";
import { motion } from "motion/react";

interface ActionPanelProps {
  enabled: boolean;
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  canRaise: boolean;
  onAction: (action: ActionType, amount?: number) => void;
  pot?: number;
  timer?: { userId: string; remainingSeconds: number } | null;
  totalBet?: number;
}

export function ActionPanel({
  enabled,
  callAmount,
  minRaise,
  maxRaise,
  canFold,
  canCheck,
  canCall,
  canRaise,
  onAction,
  pot = 0,
  timer,
  totalBet = 0,
}: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  const potOdds = useMemo(() => {
    if (callAmount <= 0) return 0;
    return Math.round((callAmount / (pot + callAmount)) * 100);
  }, [callAmount, pot]);

  const controlsEnabled = enabled;

  const buttonBase =
    "rounded-2xl px-4 py-3 text-sm font-black tracking-wide transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_12px_24px_rgba(0,0,0,.34)]";

  const pct = timer ? Math.max(0, Math.min(100, (timer.remainingSeconds / 30) * 100)) : 0;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ type: "spring", stiffness: 230, damping: 28 }}
      className="w-full max-w-[360px] select-none text-slate-100"
    >
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,.94),rgba(2,6,23,.98))] p-4 shadow-[0_24px_70px_rgba(0,0,0,.64),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/80">Action</div>
            <div className="text-lg font-black text-white">{controlsEnabled ? "Your move" : "Waiting"}</div>
          </div>
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="27" className="fill-none stroke-white/10" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r="27"
                className={`${timer && timer.remainingSeconds <= 10 ? "stroke-red-400" : "stroke-amber-300"} fill-none transition-all duration-300`}
                strokeWidth="5"
                strokeDasharray={169.65}
                strokeDashoffset={169.65 - (169.65 * pct) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-black text-white">
              {timer?.remainingSeconds ?? "—"}s
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Pot Odds" value={callAmount > 0 ? `${potOdds}%` : "Free"} />
          <Stat label="Pot" value={pot.toLocaleString()} />
          <Stat label="Bet" value={totalBet.toLocaleString()} />
        </div>

        {controlsEnabled && canRaise && (
          <div className="mb-4 rounded-2xl border border-white/8 bg-black/24 p-3 shadow-inner">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-300">
              <span>Raise slider</span>
              <span className="rounded-full border border-amber-300/24 bg-amber-300/10 px-3 py-1 font-mono text-xs font-black text-amber-200">
                {raiseAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={Math.max(1, Math.floor((maxRaise - minRaise) / 100))}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-amber-300 focus:outline-none"
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              <QuickButton onClick={() => setRaiseAmount(minRaise)}>Min</QuickButton>
              <QuickButton disabled={pot <= 0 || Math.floor(pot / 2) < minRaise || Math.floor(pot / 2) > maxRaise} onClick={() => setRaiseAmount(Math.max(minRaise, Math.min(maxRaise, Math.floor(pot / 2))))}>1/2</QuickButton>
              <QuickButton disabled={pot <= 0 || pot < minRaise || pot > maxRaise} onClick={() => setRaiseAmount(Math.max(minRaise, Math.min(maxRaise, pot)))}>Pot</QuickButton>
              <QuickButton onClick={() => setRaiseAmount(maxRaise)}>Max</QuickButton>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => onAction("fold")} disabled={!controlsEnabled || !canFold} className={`${buttonBase} border border-red-400/35 bg-[linear-gradient(180deg,#7f1d1d,#450a0a)] text-red-50 hover:brightness-125`}>
            Fold
          </button>

          {canCheck ? (
            <button type="button" onClick={() => onAction("check")} disabled={!controlsEnabled || !canCheck} className={`${buttonBase} border border-emerald-300/35 bg-[linear-gradient(180deg,#047857,#064e3b)] text-emerald-50 hover:brightness-125`}>
              Check
            </button>
          ) : (
            <button type="button" onClick={() => onAction("call")} disabled={!controlsEnabled || !canCall} className={`${buttonBase} border border-emerald-200/45 bg-[linear-gradient(180deg,#10b981,#047857)] text-white hover:brightness-115`}>
              Call {callAmount > 0 ? callAmount.toLocaleString() : ""}
            </button>
          )}

          <button type="button" onClick={() => onAction("raise", raiseAmount)} disabled={!controlsEnabled || !canRaise} className={`${buttonBase} border border-amber-200/45 bg-[linear-gradient(180deg,#f59e0b,#b45309)] text-slate-950 hover:brightness-110`}>
            Raise
          </button>

          <button type="button" onClick={() => onAction("allin")} disabled={!controlsEnabled || (!canRaise && !canCall)} className={`${buttonBase} border border-orange-200/45 bg-[linear-gradient(180deg,#f97316,#c2410c)] text-white hover:brightness-110`}>
            All-In
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 px-2 py-2 shadow-inner">
      <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 truncate font-mono text-xs font-black text-slate-100">{value}</div>
    </div>
  );
}

function QuickButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-xl border border-white/8 bg-white/5 py-1.5 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
    >
      {children}
    </button>
  );
}
