import { apiClient, setupAuthInterceptor } from "@reusedo/api-client";
import { AuthService, auth, useAuthStore } from "@reusedo/auth";
import { useQuery } from "@tanstack/react-query";
import { type User, onAuthStateChanged } from "firebase/auth";
import type React from "react";
import { createContext, useContext, useEffect } from "react";

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
          await apiClient.post("/auth/session");
        } catch (error) {
          console.error("Failed to sync admin session", error);
        }
      } else {
        setAuth(null);
      }
    });

    return () => unsubscribe();
  }, [setAuth]);

  const { isLoading: profileLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await apiClient.get("/auth/me");
      return response.data.profile;
    },
    enabled: !!user,
  });

  const isReady = useAuthStore((state) => state.status !== "loading") && !profileLoading;

  return <AuthContext.Provider value={{ isReady }}>{children}</AuthContext.Provider>;
};

export const useAuthReady = () => useContext(AuthContext);
