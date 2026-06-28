"use client";

import type { Card } from "@ace/poker-engine/deck";
import { AnimatePresence, motion } from "motion/react";
import { CardFace } from "./CardDisplay";

interface CommunityCardsProps {
  cards: Card[];
}

/** Center board tray: five slots, deal one-by-one and flip into reveal. */
export function CommunityCards({ cards }: CommunityCardsProps) {
  const totalSlots = 5;

  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.09),0_18px_44px_rgba(0,0,0,.34)] backdrop-blur-[2px] sm:px-4 sm:py-3">
      <div className="flex justify-center gap-1.5 sm:gap-2.5">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const card = cards[i];
          return (
            <div key={`board-slot-${i}`} className="relative h-[64px] w-[46px] sm:h-[82px] sm:w-[59px] md:h-[100px] md:w-[72px]">
              <AnimatePresence mode="wait">
                {card ? (
                  <CardFace
                    key={`${card.rank}-${card.suit}-${i}`}
                    card={card}
                    delay={i * 0.09}
                    className="h-full w-full"
                  />
                ) : (
                  <motion.div
                    key={`empty-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, rotateY: 90 }}
                    className="flex h-full w-full items-center justify-center rounded-[10px] border border-emerald-100/12 bg-emerald-950/26 text-[20px] text-emerald-100/14 shadow-inner select-none sm:text-[24px]"
                  >
                    ♠
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
