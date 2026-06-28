"use client";

import { motion } from "motion/react";

interface PotDisplayProps {
  pot: number;
  phase: string;
  pulse?: boolean;
}

/** Pot badge with real chip asset and subtle chip-stack depth. */
export function PotDisplay({ pot, phase, pulse = false }: PotDisplayProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: pulse ? [1, 1.07, 1] : 1 }}
      transition={{ duration: 0.38 }}
      className="flex flex-col items-center gap-1.5 select-none"
    >
      <span className="text-[10px] font-extrabold tracking-[0.24em] text-emerald-300/90 uppercase drop-shadow">
        {phase}
      </span>

      {pot > 0 && (
        <div className="relative flex items-center gap-2.5 rounded-full border border-amber-300/38 bg-[linear-gradient(180deg,rgba(15,23,42,.95),rgba(2,6,23,.96))] px-5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="absolute -inset-1 rounded-full bg-amber-300/10 blur-xl" />
          <img src="/assets/svg/chips/chip-stack-10.svg" alt="" draggable={false} className="relative h-8 w-8 drop-shadow-lg" />
          <span className="relative text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Pot</span>
          <span className="relative font-mono text-lg sm:text-xl font-black text-amber-300 leading-none">
            {pot.toLocaleString()}
          </span>
        </div>
      )}
    </motion.div>
  );
}
