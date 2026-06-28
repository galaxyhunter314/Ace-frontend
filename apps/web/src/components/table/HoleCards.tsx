"use client";

import type { Card } from "@ace/poker-engine/deck";
import { AnimatePresence, motion } from "motion/react";
import { CardFace, CardBack } from "./CardDisplay";

interface HoleCardsProps {
  cards: Card[];
  faceDown: boolean;
  isMe?: boolean;
}

/** Render overlapping hole cards with premium deal/hover motion. */
export function HoleCards({ cards, faceDown, isMe = false }: HoleCardsProps) {
  if (cards.length === 0) return null;

  return (
    <motion.div
      layout
      className={`flex justify-center ${isMe ? "-space-x-8 sm:-space-x-9" : "-space-x-4"}`}
      initial={false}
    >
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => (
          <motion.div
            layout
            key={faceDown ? `back-${i}` : `${card?.rank ?? "x"}-${card?.suit ?? "x"}-${i}`}
            className="relative transition-transform hover:z-50"
            style={{ zIndex: i + 1 }}
            initial={{ opacity: 0, x: isMe ? 80 : 34, y: -46, rotate: i === 0 ? -10 : 10 }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              rotate: isMe ? (i === 0 ? -6 : 6) : (i === 0 ? -4 : 4),
            }}
            exit={{ opacity: 0, y: 18, scale: 0.9 }}
            transition={{ duration: 0.42, delay: i * 0.08, type: "spring", stiffness: 230, damping: 22 }}
            whileHover={isMe ? { y: -14, rotate: i === 0 ? -9 : 9, scale: 1.04 } : { y: -5 }}
          >
            {faceDown ? (
              <CardBack className="h-[48px] w-[34px] sm:h-[54px] sm:w-[38px]" delay={i * 0.06} />
            ) : isMe ? (
              <CardFace card={card} className="h-[112px] w-[80px] sm:h-[134px] sm:w-[96px] xl:h-[146px] xl:w-[104px]" delay={i * 0.07} />
            ) : (
              <CardFace card={card} className="h-[58px] w-[42px] sm:h-[68px] sm:w-[49px]" delay={i * 0.05} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
