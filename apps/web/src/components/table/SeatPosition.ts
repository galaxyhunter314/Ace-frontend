/**
 * Seat position math for a poker table.
 *
 * Pre-defined premium seat layouts for 2 to 6 players.
 * Coordinates are percentage-based relative to the table image container,
 * which has aspect ratio 7:4 (matching the 1344×768 table-felt.png).
 * Index 0 in each layout is ALWAYS the bottom-center seat (where the hero sits).
 * The remaining seats are distributed clockwise around the felt.
 */
export interface SeatCoords {
  x: number;
  y: number;
  chipX: number;
  chipY: number;
  dbX: number;
  dbY: number;
}

const LAYOUTS: Record<number, SeatCoords[]> = {
  2: [
    { x: 50, y: 86, chipX: 50, chipY: 62, dbX: 53, dbY: 58 }, // Hero
    { x: 50, y: 14, chipX: 50, chipY: 38, dbX: 47, dbY: 42 }, // Top
  ],
  3: [
    { x: 50, y: 86, chipX: 50, chipY: 62, dbX: 53, dbY: 58 }, // Hero
    { x: 12, y: 22, chipX: 25, chipY: 31, dbX: 28, dbY: 28 }, // Top Left
    { x: 88, y: 22, chipX: 75, chipY: 31, dbX: 72, dbY: 28 }, // Top Right
  ],
  4: [
    { x: 50, y: 86, chipX: 50, chipY: 62, dbX: 53, dbY: 58 }, // Hero
    { x: 8, y: 50, chipX: 22, chipY: 50, dbX: 25, dbY: 46 },  // Left
    { x: 50, y: 14, chipX: 50, chipY: 38, dbX: 47, dbY: 42 }, // Top
    { x: 92, y: 50, chipX: 78, chipY: 50, dbX: 75, dbY: 46 }, // Right
  ],
  5: [
    { x: 50, y: 86, chipX: 50, chipY: 62, dbX: 53, dbY: 58 }, // Hero
    { x: 10, y: 68, chipX: 23, chipY: 62, dbX: 27, dbY: 57 }, // Bottom Left
    { x: 18, y: 18, chipX: 29, chipY: 29, dbX: 32, dbY: 26 }, // Top Left
    { x: 82, y: 18, chipX: 71, chipY: 29, dbX: 68, dbY: 26 }, // Top Right
    { x: 90, y: 68, chipX: 77, chipY: 62, dbX: 73, dbY: 57 }, // Bottom Right
  ],
  6: [
    { x: 50, y: 86, chipX: 50, chipY: 62, dbX: 53, dbY: 58 }, // Hero
    { x: 10, y: 72, chipX: 23, chipY: 65, dbX: 27, dbY: 59 }, // Bottom Left
    { x: 10, y: 28, chipX: 23, chipY: 35, dbX: 27, dbY: 32 }, // Top Left
    { x: 50, y: 14, chipX: 50, chipY: 38, dbX: 47, dbY: 42 }, // Top Center
    { x: 90, y: 28, chipX: 77, chipY: 35, dbX: 73, dbY: 32 }, // Top Right
    { x: 90, y: 72, chipX: 77, chipY: 65, dbX: 73, dbY: 59 }, // Bottom Right
  ],
};

export function getSeatPositions(
  count: number,
  heroIndex: number,
): SeatCoords[] {
  if (count < 1) return [];

  const layout = LAYOUTS[count] ?? LAYOUTS[6] ?? [];
  const safeHeroIndex = heroIndex >= 0 ? heroIndex : 0;

  const seatPositions: SeatCoords[] = [];
  for (let i = 0; i < count; i++) {
    const rotatedIndex = (i - safeHeroIndex + count) % count;
    const pos = layout[rotatedIndex] || { x: 50, y: 50, chipX: 50, chipY: 50, dbX: 50, dbY: 50 };
    seatPositions.push(pos);
  }

  return seatPositions;
}
