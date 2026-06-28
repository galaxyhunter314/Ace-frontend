import { create } from "zustand";
import type { TableInfo } from "@/types";

interface TableState {
  /** All tables visible to the current user. */
  tables: TableInfo[];
  /** true while fetching the table list. */
  loading: boolean;
  /** Error from the last fetch. */
  error: string | null;

  /** Set the full table list (called on nav to lobby / socket update). */
  setTables: (tables: TableInfo[]) => void;
  /** Add or update a single table (socket event). */
  upsertTable: (table: TableInfo) => void;
  /** Remove a table that was deleted (socket event). */
  removeTable: (tableId: string) => void;
  /** Set an error message to display in the lobby. */
  setError: (error: string | null) => void;
}

export const useTableStore = create<TableState>()((set) => ({
  tables: [],
  loading: false,
  error: null,

  setTables: (tables) => set({ tables, error: null }),

  upsertTable: (table) =>
    set((s) => {
      const idx = s.tables.findIndex((t) => t.id === table.id);
      if (idx >= 0) {
        const next = [...s.tables];
        next[idx] = table;
        return { tables: next };
      }
      return { tables: [...s.tables, table] };
    }),

  removeTable: (tableId) =>
    set((s) => ({
      tables: s.tables.filter((t) => t.id !== tableId),
    })),

  setError: (error) => set({ error }),
}));
