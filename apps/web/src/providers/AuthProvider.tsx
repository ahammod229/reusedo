import { apiClient, setupAuthInterceptor } from "@reusedo/api-client";
import { AuthService, auth, useAuthStore } from "@reusedo/auth";
import { useQuery } from "@tanstack/react-query";
import { type User, onAuthStateChanged } from "firebase/auth";
import type React from "react";
import { createContext, useContext, useEffect } from "react";

// Setup global Axios interceptor to always attach the latest Firebase token
setupAuthInterceptor(() => AuthService.getIdToken());

type AuthContextType = {
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType>({ isReady: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, user } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        setAuth(firebaseUser);
        try {
          // Sync session with backend to get Supabase profile
          await apiClient.post("/auth/session");
        } catch (error) {
          console.error("Failed to sync session with backend", error);
        }
      } else {
        setAuth(null);
      }
    });

    return () => unsubscribe();
  }, [setAuth]);

  // Fetch backend profile data when user is authenticated
  const { isLoading: profileLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await apiClient.get("/auth/me");
      return response.data.profile;
    },
    enabled: !!user,
    retry: false,
  });

  const isReady = useAuthStore((state) => state.status !== "loading") && !profileLoading;

  return <AuthContext.Provider value={{ isReady }}>{children}</AuthContext.Provider>;
};

export const useAuthReady = () => useContext(AuthContext);
