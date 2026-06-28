/** Auth user returned by the API. */
export interface User {
  discordId: string;
  username: string;
  avatar: string | null;
  admin: boolean;
}

/** Response from GET /api/me */
export interface MeResponse {
  authenticated: boolean;
  user?: User;
}

/** A table as returned by table list/details. */
export interface TableInfo {
  id: string;
  phase: string;
  playerCount: number;
  maxPlayers: number;
  speedMode: string;
  buyIn: number;
  smallBlind: number;
  bigBlind: number;
  handNumber: number;
  players: {
    userId: string;
    username: string;
    stack: number;
  }[];
  createdBy: string;
}

/** Timer broadcast payload. */
export interface TimerPayload {
  tableId: string;
  userId: string;
  remainingSeconds: number;
}
