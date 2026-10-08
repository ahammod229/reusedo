import { apiClient } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./auth.store";

export type BackendProfile = {
  id: string;
  role?: "USER" | "ADMIN";
  admin_role?: string | null;
  phone_number?: string | null;
  district?: string | null;
};

/** The signed-in person's backend profile (role, address, phone). Shared cache across the app. */
export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => (await apiClient.get("/auth/me")).data.profile as BackendProfile,
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });
}

export const isAdminProfile = (p?: BackendProfile | null) =>
  !!p && (p.role === "ADMIN" || !!p.admin_role);

/** Onboarding is complete once the profile has a phone number and a district. */
export const isOnboarded = (p?: BackendProfile | null) => !!p?.phone_number && !!p?.district;
