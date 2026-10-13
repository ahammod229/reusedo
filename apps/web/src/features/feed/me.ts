import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CategoryId, EduLevel } from "./types";

// The signed-in user's study info and interests (onboarding step 4 / edit profile).
// Kept on the device until `PATCH /api/users/me` exists; used to personalise Home.
interface MeState {
  level?: EduLevel;
  institution: string;
  /** Off by default — many users are minors (docs/STUDENT_UX.md §3). */
  showInstitution: boolean;
  interests: CategoryId[];
  /** Exchange ids the user already thanked. */
  thanked: string[];
  set: (p: Partial<Omit<MeState, "set">>) => void;
}

export const useMe = create<MeState>()(
  persist(
    (set) => ({
      level: "ssc",
      institution: "",
      showInstitution: false,
      interests: ["books", "stationery"],
      thanked: [],
      set: (p) => set(p),
    }),
    { name: "reusedo-me" },
  ),
);

/** Username of the demo account used by the sample data (local development only). */
export const DEMO_USERNAME = "rakib";
