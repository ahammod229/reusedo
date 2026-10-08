import { isAdminProfile, useAuthStore, useProfile } from "@/features/auth";
import { UI_PREVIEW } from "@/shared/uiPreview";
import { Navigate, Outlet } from "react-router";

export const AdminRoute = () => {
  const { status } = useAuthStore();
  const { data: profile, isLoading } = useProfile();

  if (UI_PREVIEW) return <Outlet />;

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // This only hides the screens. Every /api/admin call is checked again on the server.
  if (status !== "authenticated" || !isAdminProfile(profile)) {
    return <Navigate to={status === "authenticated" ? "/home" : "/login"} replace />;
  }

  return <Outlet />;
};
