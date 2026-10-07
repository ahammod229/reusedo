import type { FeedFilters } from "@/features/data/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** "Tell me when this shows up" — a saved search. Becomes `saved_searches` + a matcher job on the API. */
export interface SearchAlert {
  id: string;
  label: string;
  filters: FeedFilters;
  /** Posts newer than this many hours count as "new" for the alert. */
  createdHoursAgo: number;
}

interface AlertsState {
  list: SearchAlert[];
  add: (a: Omit<SearchAlert, "id" | "createdHoursAgo">) => void;
  remove: (id: string) => void;
}

export const useAlerts = create<AlertsState>()(
  persist(
    (set) => ({
      list: [
        {
          id: "seed-1",
          label: "SSC বই",
          filters: { kind: "all", category: "books", scope: "country", level: "ssc" },
          createdHoursAgo: 72,
        },
      ],
      add: (a) =>
        set((s) => ({
          list: [{ ...a, id: `al${Date.now()}`, createdHoursAgo: 0 }, ...s.list].slice(0, 10),
        })),
      remove: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
    }),
    { name: "reusedo-alerts" },
  ),
);
