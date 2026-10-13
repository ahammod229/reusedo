import { auth, useAuthStore, useProfile } from "@/features/auth";
import { resetSupabaseSession } from "@/features/auth/session";
import { type User, onAuthStateChanged } from "firebase/auth";
import type React from "react";
import { createContext, useContext, useEffect } from "react";

type AuthContextType = {
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType>({ isReady: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (!firebaseUser) resetSupabaseSession();
      setAuth(firebaseUser);
    });
    return () => unsubscribe();
  }, [setAuth]);

  // Profile (role, phone, district) — loading it also signs the person in to Supabase; the route guards read it too.
  const { isLoading: profileLoading } = useProfile();

  const isReady = useAuthStore((state) => state.status !== "loading") && !profileLoading;

  return <AuthContext.Provider value={{ isReady }}>{children}</AuthContext.Provider>;
};

export const useAuthReady = () => useContext(AuthContext);
