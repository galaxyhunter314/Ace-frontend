"use client";

import type { CSSProperties } from "react";
import type { Card } from "@ace/poker-engine/deck";
import { motion } from "motion/react";

const SUIT_TO_CODE: Record<string, string> = {
  "♣": "C",
  "♦": "D",
  "♥": "H",
  "♠": "S",
};

const SUIT_COLOR: Record<string, string> = {
  "♣": "#101827",
  "♦": "#dc2626",
  "♥": "#dc2626",
  "♠": "#101827",
};

function cardAsset(card: Card) {
  const rank = card.rank === "T" ? "10" : card.rank;
  const suit = SUIT_TO_CODE[card.suit] ?? "S";
  return `/cards/${rank}${suit}.svg`;
}

interface CardFaceProps {
  card: Card;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  largePips?: boolean;
}

/** Crisp readable card face, backed by the real deck SVG assets with a text fallback. */
export function CardFace({ card, className = "", style, delay = 0 }: CardFaceProps) {
  const color = SUIT_COLOR[card.suit] ?? "#101827";

  return (
    <motion.div
      initial={{ opacity: 0, y: -80, rotateY: 180, scale: 0.86 }}
      animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      transition={{ duration: 0.48, delay, type: "spring", stiffness: 210, damping: 22 }}
      whileHover={{ y: -8, scale: 1.035 }}
      className={`relative overflow-hidden rounded-[10px] border border-white/90 bg-white text-left shadow-[0_12px_26px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.95)] select-none [transform-style:preserve-3d] ${className}`}
      style={{ color, ...style }}
      title={`${card.rank}${card.suit}`}
    >
      <img
        src={cardAsset(card)}
        alt={`${card.rank}${card.suit}`}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <div className="absolute inset-[3px] rounded-[7px] border border-slate-900/5" />
      <div className="relative z-10 flex flex-col items-center leading-none font-black tracking-tighter p-1">
        <span className="text-[12px] sm:text-[14px] md:text-[16px]">{card.rank}</span>
        <span className="-mt-0.5 text-[10px] sm:text-[12px] md:text-[13px]">{card.suit}</span>
      </div>
      <div className="absolute bottom-1 right-1 z-10 leading-none opacity-95">
        <span className="text-[22px] sm:text-[28px] md:text-[34px]">{card.suit}</span>
      </div>
    </motion.div>
  );
}

interface CardBackProps {
  className?: string;
  style?: CSSProperties;
  delay?: number;
}

/** Face-down card using the provided premium back asset. */
export function CardBack({ className = "", style, delay = 0 }: CardBackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -64, rotate: -5, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.42, delay, type: "spring", stiffness: 220, damping: 24 }}
      className={`relative overflow-hidden rounded-[10px] border border-white/80 shadow-[0_12px_22px_rgba(0,0,0,.44)] select-none ${className}`}
      style={style}
    >
      <img
        src="/assets/svg/cards/card-back.svg"
        alt="Card back"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-[5px] rounded-md border border-white/24 shadow-inner" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.18),transparent_35%),linear-gradient(145deg,rgba(0,0,0,.05),rgba(0,0,0,.24))]" />
    </motion.div>
  );
}
