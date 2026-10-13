import { supabase } from "@/services/supabase";
import { useQuery } from "@tanstack/react-query";
import { auth } from "./firebase.config";
import { useAuthStore } from "./auth.store";
import { ensureSupabaseSession } from "./session";

export type BackendProfile = {
  id: string;
  username: string | null;
  display_name: string;
  role: "user" | "admin";
  phone_number: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  area: string | null;
  show_on_map: boolean;
};

/**
 * The signed-in person's profile. First call after sign-in also makes sure Supabase accepts their token and
 * creates the profile row (`ensure_profile`), so there is no separate "session sync" step anywhere else.
 */
export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["auth", "me", user?.uid],
    queryFn: async (): Promise<BackendProfile | null> => {
      const u = auth.currentUser;
      if (!u?.emailVerified) return null; // still on the email-code screen
      await ensureSupabaseSession(u);
      const { data, error } = await supabase().rpc("ensure_profile");
      if (error) throw error;
      return data as BackendProfile;
    },
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });
}

export const isAdminProfile = (p?: BackendProfile | null) => !!p && p.role === "admin";

/** Onboarding is complete once the profile has a phone number and a district. */
export const isOnboarded = (p?: BackendProfile | null) => !!p?.phone_number && !!p?.district;
