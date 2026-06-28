import { create } from "zustand";
import { io, Socket } from "socket.io-client";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

interface SocketState {
  /** The underlying Socket.IO instance (null before connect / after disconnect). */
  socket: Socket | null;
  /** Current connection status. */
  status: ConnectionStatus;
  /** JWT used for authentication (null = not connected). */
  token: string | null;

  /** Connect with the given JWT. Returns the socket instance. */
  connect: (token: string) => Socket;
  /** Gracefully disconnect. */
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  status: "disconnected",
  token: null,

  connect: (token: string) => {
    const current = get();
    console.log(
      `[SOCKET:connect] enter existingSocket=${!!current.socket}` +
      ` existingConnected=${current.socket?.connected}` +
      ` existingToken=${current.token?.slice(0,8)}` +
      ` newToken=${token.slice(0,8)}`
    );

    // If already connected with the same token, return existing socket
    if (current.socket?.connected && current.token === token) {
      console.log(`[SOCKET:connect] returning existing socket id=${current.socket.id}`);
      return current.socket;
    }
    // If connected with a different token, disconnect first
    if (current.socket) {
      console.log(`[SOCKET:connect] disconnecting old socket id=${current.socket.id}`);
      current.socket.disconnect();
    }

    set({ status: "connecting", token });

    const socket: Socket = io({
      auth: { token },
      transports: ["polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    });

    console.log(`[SOCKET:connect] created new socket id=${socket.id}`);

    socket.on("connect", () => {
      console.log(`[SOCKET:event] connect socketId=${socket.id}`);
      set({ status: "connected" });
    });

    socket.on("disconnect", (reason) => {
      console.log(`[SOCKET:event] disconnect socketId=${socket.id} reason=${reason}`);
      set((s) =>
        s.socket === socket ? { status: "disconnected" } : {},
      );
    });

    socket.on("reconnect_attempt", () => {
      console.log(`[SOCKET:event] reconnect_attempt socketId=${socket.id}`);
      set({ status: "reconnecting" });
    });

    socket.on("connect_error", (err) => {
      console.log(`[SOCKET:event] connect_error socketId=${socket.id} msg=${err.message}`);
      set({ status: "disconnected" });
    });

    // Log before replacing the Zustand reference
    console.log(
      `[SOCKET:connect] UPDATING ZUSTAND REF old=${current.socket?.id ?? "null"} new=${socket.id}`
    );
    set({ socket });
    return socket;
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, status: "disconnected", token: null });
  },
}));
