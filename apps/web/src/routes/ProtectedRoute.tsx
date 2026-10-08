import { isOnboarded, useAuthStore, useProfile } from "@/features/auth";
import { UI_PREVIEW } from "@/shared/uiPreview";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthReady } from "../providers/AuthProvider";

const SETUP_PATHS = ["/verify-email", "/onboarding"];

export const ProtectedRoute = () => {
  const { isReady } = useAuthReady();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfile();
  const { pathname } = useLocation();

  if (UI_PREVIEW) return <Outlet />;
  if (!isReady || status === "loading") return <div>Loading Session...</div>;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  // Sign-up must finish in order: email code first, then phone + address.
  // The API enforces the same rule, so this is about sending people to the right screen.
  if (user && !user.emailVerified) {
    return pathname === "/verify-email" ? <Outlet /> : <Navigate to="/verify-email" replace />;
  }
  if (profile && !isOnboarded(profile) && !SETUP_PATHS.includes(pathname)) {
    return <Navigate to="/onboarding" replace />;
  }
  if (pathname === "/verify-email") return <Navigate to="/home" replace />;

  return <Outlet />;
};
