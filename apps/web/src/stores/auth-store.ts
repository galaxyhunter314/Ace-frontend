import { create } from "zustand";
import type { User } from "@/types";
import { fetchMe, logout } from "@/lib/api";

interface AuthState {
  /** Whether we've tried loading the session at least once. */
  loaded: boolean;
  /** The authenticated user, or null when not logged in. */
  user: User | null;
  /** true while a fetch/action is in flight. */
  loading: boolean;
  /** Error message (if any) from the last operation. */
  error: string | null;

  /** Fetch /api/me and update state. */
  initialize: () => Promise<void>;
  /** POST /api/auth/logout and clear state. */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  loaded: false,
  user: null,
  loading: false,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchMe();
      set({
        loaded: true,
        user: res.authenticated ? (res.user ?? null) : null,
        loading: false,
      });
    } catch (err) {
      set({
        loaded: true,
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to check auth",
      });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await logout();
      set({ user: null, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Logout failed",
        loading: false,
      });
    }
  },
}));
