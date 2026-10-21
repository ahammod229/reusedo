import { profileKey, useProfile } from "@/features/auth/useProfile";
import { USE_MOCK } from "@/features/data/mode";
import { apiClient } from "@/services/api";
import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CategoryId, EduLevel } from "./types";

// The signed-in user's study info and interests (onboarding step 4 / edit profile),
// used to personalise Home. With the API this mirrors the profile and saveMe() writes
// through; with mock data it stays on the device.
interface StudyInfo {
  level?: EduLevel;
  institution: string;
  /** Off by default — many users are minors (docs/STUDENT_UX.md §3). */
  showInstitution: boolean;
  interests: CategoryId[];
}

interface MeState extends StudyInfo {
  set: (p: Partial<StudyInfo>) => void;
}

export const useMe = create<MeState>()(
  persist(
    (set) => ({
      level: "ssc",
      institution: "",
      showInstitution: false,
      interests: ["books", "stationery"],
      set: (p) => set(p),
    }),
    { name: "reusedo-me" },
  ),
);

/** Saves study info and interests; with the API also to the profile. */
export async function saveMe(p: Partial<StudyInfo>, qc?: QueryClient) {
  useMe.getState().set(p);
  if (USE_MOCK) return;
  await apiClient.patch("/users/me", {
    ...(p.level !== undefined && { level: p.level }),
    ...(p.institution !== undefined && { institution: p.institution }),
    ...(p.showInstitution !== undefined && { showInstitution: p.showInstitution }),
    ...(p.interests !== undefined && { interests: p.interests }),
  });
  await qc?.invalidateQueries({ queryKey: profileKey });
}

/** Copies the server profile into the local store once it loads. */
export function syncMeFromProfile(p: {
  level: EduLevel | null;
  institution: string;
  showInstitution: boolean;
  interests: CategoryId[];
}) {
  useMe.getState().set({
    level: p.level ?? undefined,
    institution: p.institution,
    showInstitution: p.showInstitution,
    interests: p.interests,
  });
}

/** The mock data's demo account. */
export const DEMO_USERNAME = "rakib";

/** The signed-in user's username: the demo account with mock data, else from the profile. */
export function useMyUsername(): string {
  const { data } = useProfile();
  return USE_MOCK ? DEMO_USERNAME : (data?.username ?? "");
}
