import { useTr } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { type ACCESS, can, useAdminRole } from "./permissions";

/** Hides an admin screen from roles that lack access (the API enforces the same rule server-side). */
export function RequireArea({
  area,
  children,
}: { area: keyof typeof ACCESS; children: ReactNode }) {
  const tr = useTr();
  const role = useAdminRole();
  if (can(role, area)) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </span>
      <h1 className="text-xl font-bold">{tr("অনুমতি নেই", "No access")}</h1>
      <p className="text-sm text-muted-foreground">
        {tr("এই পেজ দেখার অনুমতি আপনার ভূমিকায় নেই।", "Your role can't open this page.")}
      </p>
      <Button asChild variant="outline">
        <Link to="/admin">{tr("ড্যাশবোর্ডে ফিরুন", "Back to dashboard")}</Link>
      </Button>
    </div>
  );
}
