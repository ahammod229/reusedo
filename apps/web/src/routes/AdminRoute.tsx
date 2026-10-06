import { useAuthStore } from "@/features/auth";
import { UI_PREVIEW } from "@/shared/uiPreview";
import { Navigate, Outlet } from "react-router";

export const AdminRoute = () => {
  const { user, status } = useAuthStore();
  const loading = status === "loading";

  if (UI_PREVIEW) return <Outlet />;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (user as { role?: string }).role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
