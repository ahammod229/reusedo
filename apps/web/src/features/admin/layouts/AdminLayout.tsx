import { LangToggle } from "@/features/feed/LangToggle";
import { useNum, useTr } from "@/features/feed/i18n";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Logo,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  ThemeToggle,
  cn,
} from "@/shared/components/ui";
import {
  Activity,
  BarChart3,
  Boxes,
  ExternalLink,
  FileText,
  Flag,
  Folders,
  LayoutDashboard,
  Megaphone,
  Menu,
  PlugZap,
  Repeat,
  ScanSearch,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Star,
  ToggleRight,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { useAdminStats } from "../data/hooks";
import { type ACCESS, can, useAdminRole } from "../permissions";

type Area = keyof typeof ACCESS;
interface Item {
  area: Area;
  to: string;
  end?: boolean;
  icon: ReactNode;
  bn: string;
  en: string;
  badge?:
    | "pendingCourier"
    | "openReports"
    | "pendingVerifications"
    | "pendingPayments"
    | "openRisk";
}
const ic = "h-[18px] w-[18px]";

const GROUPS: { bn: string; en: string; items: Item[] }[] = [
  {
    bn: "ওভারভিউ",
    en: "Overview",
    items: [
      {
        area: "dashboard",
        to: "/admin",
        end: true,
        icon: <LayoutDashboard className={ic} />,
        bn: "ড্যাশবোর্ড",
        en: "Dashboard",
      },
      {
        area: "analytics",
        to: "/admin/analytics",
        icon: <BarChart3 className={ic} />,
        bn: "অ্যানালিটিক্স",
        en: "Analytics",
      },
    ],
  },
  {
    bn: "মডারেশন",
    en: "Moderation",
    items: [
      {
        area: "posts",
        to: "/admin/posts",
        icon: <Boxes className={ic} />,
        bn: "পোস্ট",
        en: "Posts",
      },
      {
        area: "reports",
        to: "/admin/reports",
        icon: <Flag className={ic} />,
        bn: "রিপোর্ট",
        en: "Reports",
        badge: "openReports",
      },
      {
        area: "verification",
        to: "/admin/verification",
        icon: <ShieldAlert className={ic} />,
        bn: "যাচাই",
        en: "Review",
        badge: "pendingVerifications",
      },
      {
        area: "reviews",
        to: "/admin/reviews",
        icon: <Star className={ic} />,
        bn: "রিভিউ",
        en: "Reviews",
      },
      {
        area: "users",
        to: "/admin/users",
        icon: <Users className={ic} />,
        bn: "ইউজার",
        en: "Users",
      },
    ],
  },
  {
    bn: "অপারেশন",
    en: "Operations",
    items: [
      {
        area: "exchanges",
        to: "/admin/exchanges",
        icon: <Repeat className={ic} />,
        bn: "লেনদেন",
        en: "Exchanges",
      },
      {
        area: "courier",
        to: "/admin/courier",
        icon: <Truck className={ic} />,
        bn: "কুরিয়ার",
        en: "Courier",
        badge: "pendingCourier",
      },
      {
        area: "risk",
        to: "/admin/risk",
        icon: <ScanSearch className={ic} />,
        bn: "ফ্রড ও ঠিকানা চেক",
        en: "Fraud check",
        badge: "openRisk",
      },
    ],
  },
  {
    bn: "পেমেন্ট ও বিজ্ঞাপন",
    en: "Payments & ads",
    items: [
      {
        area: "payments",
        to: "/admin/payments",
        icon: <Wallet className={ic} />,
        bn: "পেমেন্ট",
        en: "Payments",
        badge: "pendingPayments",
      },
      {
        area: "ads",
        to: "/admin/ads",
        icon: <Megaphone className={ic} />,
        bn: "বিজ্ঞাপন ম্যানেজার",
        en: "Ads manager",
      },
    ],
  },
  {
    bn: "কনটেন্ট",
    en: "Content",
    items: [
      {
        area: "categories",
        to: "/admin/categories",
        icon: <Folders className={ic} />,
        bn: "ক্যাটাগরি",
        en: "Categories",
      },
      {
        area: "cms",
        to: "/admin/cms",
        icon: <FileText className={ic} />,
        bn: "পেজ কনটেন্ট",
        en: "Pages",
      },
    ],
  },
  {
    bn: "প্ল্যাটফর্ম",
    en: "Platform",
    items: [
      {
        area: "integrations",
        to: "/admin/integrations",
        icon: <PlugZap className={ic} />,
        bn: "API ও ইন্টিগ্রেশন",
        en: "APIs & integrations",
      },
      {
        area: "features",
        to: "/admin/features",
        icon: <ToggleRight className={ic} />,
        bn: "ফিচার ফ্ল্যাগ",
        en: "Feature flags",
      },
      {
        area: "settings",
        to: "/admin/settings",
        icon: <SettingsIcon className={ic} />,
        bn: "সেটিংস",
        en: "Settings",
      },
      {
        area: "audit",
        to: "/admin/audit",
        icon: <Activity className={ic} />,
        bn: "অডিট লগ",
        en: "Audit log",
      },
    ],
  },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const tr = useTr();
  const num = useNum();
  const role = useAdminRole();
  const { data: stats } = useAdminStats();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Admin">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => can(role, i.area));
        if (items.length === 0) return null;
        return (
          <div key={g.en}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tr(g.bn, g.en)}
            </p>
            <ul className="space-y-0.5">
              {items.map((i) => {
                const n = i.badge && stats ? stats[i.badge] : 0;
                return (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      end={i.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/75 hover:bg-accent hover:text-foreground",
                        )
                      }
                    >
                      {i.icon}
                      <span className="flex-1">{tr(i.bn, i.en)}</span>
                      {n > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">
                          {num(n)}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminLayout() {
  const tr = useTr();
  const role = useAdminRole();
  const [open, setOpen] = useState(false);
  const roleLabel = {
    super_admin: "Super admin",
    admin: "Admin",
    moderator: tr("মডারেটর", "Moderator"),
  }[role];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="border-b px-4 py-4">
          <Logo />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Admin · {roleLabel}
          </p>
        </div>
        <Nav />
        <div className="border-t p-3">
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link to="/feed">
              <ExternalLink className="mr-2 h-4 w-4" /> {tr("সাইটে ফিরুন", "Back to site")}
            </Link>
          </Button>
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <div className="border-b px-4 py-4">
            <SheetTitle asChild>
              <Logo />
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs">Admin · {roleLabel}</SheetDescription>
          </div>
          <Nav onNavigate={() => setOpen(false)} />
          <div className="border-t p-3">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <Link to="/feed">
                <ExternalLink className="mr-2 h-4 w-4" /> {tr("সাইটে ফিরুন", "Back to site")}
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">{tr("মেনু", "Menu")}</span>
          </Button>
          <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground md:hidden">
            <ShieldCheck className="h-4 w-4 text-primary" /> Admin
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <LangToggle />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0" aria-label="Account">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                      A
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold">{roleLabel}</p>
                  <p className="text-xs text-muted-foreground">admin@reusedo.app</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/feed">{tr("সাইটে ফিরুন", "Back to site")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
