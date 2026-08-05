import { useAuthStore } from "@reusedo/auth";
import { Navigate, Outlet } from "react-router";
import { useAuthReady } from "../providers/AuthProvider";

export const GuestRoute = () => {
  const { isReady } = useAuthReady();
  const status = useAuthStore((state) => state.status);

  if (!isReady || status === "loading") return <div>Loading Session...</div>;
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};
