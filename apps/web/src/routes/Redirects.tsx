import { useAuthStore } from "@/features/auth";
import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router";

/** Old product/need detail URLs now live under /post/:id. */
export const ToPost = () => {
  const { id } = useParams();
  return <Navigate to={`/post/${id}`} replace />;
};

/** "/" is the landing page for visitors; signed-in people go straight to their Home. */
export function LandingOrHome({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === "authenticated") return <Navigate to="/home" replace />;
  return <>{children}</>;
}
