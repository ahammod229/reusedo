import { useAuthStore } from "@reusedo/auth";
import { Navigate, Outlet } from "react-router";
import { useAuthReady } from "../providers/AuthProvider";

export const ProtectedRoute = () => {
  const { isReady } = useAuthReady();
  const status = useAuthStore((state) => state.status);

  if (!isReady || status === "loading") return <div>Loading Session...</div>;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  return <Outlet />;
};
