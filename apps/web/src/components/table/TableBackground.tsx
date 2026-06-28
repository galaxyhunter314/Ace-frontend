"use client";

/** Single source of truth for the table surface: render only the provided table image. */
export function TableBackground() {
  return (
    <img
      src="/assets/svg/table/table-felt.png"
      alt="Poker table felt"
      draggable={false}
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
    />
  );
}
