import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SavedState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

/** Bookmarked posts, kept on the device (becomes a server list once the API supports it). */
export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
      has: (id) => get().ids.includes(id),
    }),
    { name: "reusedo-saved" },
  ),
);
