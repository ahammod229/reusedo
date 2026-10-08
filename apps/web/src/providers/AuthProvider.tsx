import { AuthService, auth, useAuthStore, useProfile } from "@/features/auth";
import { apiClient, setupAuthInterceptor } from "@/services/api";
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
  const { setAuth } = useAuthStore();

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

  // Backend profile (role, phone, district) — shared cache, also read by the route guards
  const { isLoading: profileLoading } = useProfile();

  const isReady = useAuthStore((state) => state.status !== "loading") && !profileLoading;

  return <AuthContext.Provider value={{ isReady }}>{children}</AuthContext.Provider>;
};

export const useAuthReady = () => useContext(AuthContext);
