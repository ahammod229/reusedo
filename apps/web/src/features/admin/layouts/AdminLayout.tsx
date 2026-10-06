import {
  Header,
  Logo,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/shared/components/ui";
import {
  Activity,
  BarChart3,
  Box,
  FileText,
  Flag,
  Folders,
  Heart,
  LayoutDashboard,
  Megaphone,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import * as React from "react";
import { NavLink, Outlet } from "react-router";

const ADMIN_SIDEBAR_ITEMS = [
  { title: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { title: "Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { title: "Products", href: "/admin/products", icon: <Box className="h-4 w-4" /> },
  { title: "Need Requests", href: "/admin/needs", icon: <Heart className="h-4 w-4" /> },
  { title: "Exchanges", href: "/admin/exchanges", icon: <ShoppingCart className="h-4 w-4" /> },
  { title: "Ad Settings", href: "/admin/ads", icon: <Megaphone className="h-4 w-4" /> },
  { title: "Courier Requests", href: "/admin/courier", icon: <Truck className="h-4 w-4" /> },
  { title: "Shipping", href: "/admin/shipping", icon: <Truck className="h-4 w-4" /> },
  { title: "Reviews", href: "/admin/reviews", icon: <FileText className="h-4 w-4" /> },
  { title: "Reports", href: "/admin/reports", icon: <Flag className="h-4 w-4" /> },
  { title: "Verification", href: "/admin/verification", icon: <ShieldCheck className="h-4 w-4" /> },
  { title: "Categories", href: "/admin/categories", icon: <Folders className="h-4 w-4" /> },
  { title: "CMS", href: "/admin/cms", icon: <FileText className="h-4 w-4" /> },
  { title: "Settings", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
  { title: "Feature Flags", href: "/admin/features", icon: <Shield className="h-4 w-4" /> },
  { title: "Audit Logs", href: "/admin/audit", icon: <Activity className="h-4 w-4" /> },
];

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Hardcoded for now. In reality, pull from AuthContext
  const ADMIN_USER = {
    name: "Admin User",
    email: "admin@reusedo.app",
  };

  const nav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {ADMIN_SIDEBAR_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/admin"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/70 hover:bg-accent hover:text-foreground"
            }`
          }
        >
          {item.icon}
          {item.title}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="border-b p-4">
          <Logo />
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
        </div>
        {nav()}
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <div className="border-b p-4">
            <SheetTitle asChild>
              <Logo />
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs">Admin</SheetDescription>
          </div>
          {nav(() => setMenuOpen(false))}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          user={ADMIN_USER}
          hideLogoOnDesktop
          onMenuClick={() => setMenuOpen(true)}
          labels={{ search: "Search…" }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
