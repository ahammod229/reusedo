import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  user: FirebaseUser | null;
  status: AuthStatus;
  setAuth: (user: FirebaseUser | null) => void;
  setStatus: (status: AuthStatus) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setAuth: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));
