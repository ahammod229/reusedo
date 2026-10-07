import { useAuthStore } from "@/features/auth";
import { UI_PREVIEW } from "@/shared/uiPreview";
import { Navigate, Outlet } from "react-router";
import { useAuthReady } from "../providers/AuthProvider";

export const GuestRoute = () => {
  const { isReady } = useAuthReady();
  const status = useAuthStore((state) => state.status);

  if (UI_PREVIEW) return <Outlet />;
  if (!isReady || status === "loading") return <div>Loading Session...</div>;
  if (status === "authenticated") return <Navigate to="/home" replace />;

  return <Outlet />;
};
