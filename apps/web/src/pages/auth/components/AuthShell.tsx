import { useT } from "@/features/feed/i18n";
import { Logo } from "@/shared/components/ui";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const points = [t("authPoint1"), t("authPoint2"), t("authPoint3")];
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl grid-cols-[minmax(0,1fr)] lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-center gap-8 overflow-hidden p-12 lg:flex">
        <div
          aria-hidden
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-need/10 blur-3xl"
        />
        <Logo className="relative" />
        <h2 className="relative text-4xl font-extrabold leading-tight tracking-tight">
          {t("authBrandTitle")}
        </h2>
        <p className="relative max-w-md text-lg text-muted-foreground">{t("authBrandBody")}</p>
        <ul className="relative space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {p}
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
