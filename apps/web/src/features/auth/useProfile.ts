import { apiClient } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./auth.store";

/** The signed-in person as `GET /api/users/me` returns it. */
export interface MyProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  phone: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  area: string | null;
  hasPin: boolean;
  level: import("@/features/feed/types").EduLevel | null;
  institution: string;
  showInstitution: boolean;
  interests: import("@/features/feed/types").CategoryId[];
  showOnMap: boolean;
  verified: boolean;
  emailVerified: boolean;
  /** Area and phone are saved (onboarding step 2). */
  onboarded: boolean;
  adminRole: "super_admin" | "admin" | "moderator" | null;
  trust: number;
  joinedAt: string;
  settings: {
    language: "bn" | "en";
    notifyPush: boolean;
    notifyEmail: boolean;
    notifyScope: "area" | "district" | "country";
    allowMessages: boolean;
  } | null;
}

export const profileKey = ["auth", "me"] as const;

/** The signed-in person's profile. Shared cache across the app (route guards, Home, profile). */
export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: profileKey,
    queryFn: async () => (await apiClient.get("/users/me")).data.data as MyProfile,
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });
}

export const isAdminProfile = (p?: MyProfile | null) => !!p?.adminRole;

/** Onboarding is complete once the profile has a phone number and a district. */
export const isOnboarded = (p?: MyProfile | null) => !!p?.onboarded;
