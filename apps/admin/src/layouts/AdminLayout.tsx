import { Header } from "@reusedo/ui";
import {
  Activity,
  BarChart3,
  Box,
  FileText,
  Flag,
  Folders,
  Heart,
  LayoutDashboard,
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
  { title: "Dashboard", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Analytics", href: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { title: "Users", href: "/users", icon: <Users className="h-4 w-4" /> },
  { title: "Products", href: "/products", icon: <Box className="h-4 w-4" /> },
  { title: "Need Requests", href: "/needs", icon: <Heart className="h-4 w-4" /> },
  { title: "Exchanges", href: "/exchanges", icon: <ShoppingCart className="h-4 w-4" /> },
  { title: "Shipping", href: "/shipping", icon: <Truck className="h-4 w-4" /> },
  { title: "Reviews", href: "/reviews", icon: <FileText className="h-4 w-4" /> },
  { title: "Reports", href: "/reports", icon: <Flag className="h-4 w-4" /> },
  { title: "Verification", href: "/verification", icon: <ShieldCheck className="h-4 w-4" /> },
  { title: "Categories", href: "/categories", icon: <Folders className="h-4 w-4" /> },
  { title: "CMS", href: "/cms", icon: <FileText className="h-4 w-4" /> },
  { title: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
  { title: "Feature Flags", href: "/feature-flags", icon: <Shield className="h-4 w-4" /> },
  { title: "Audit Logs", href: "/audit-logs", icon: <Activity className="h-4 w-4" /> },
];

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Hardcoded for now. In reality, pull from AuthContext
  const ADMIN_USER = {
    name: "Admin User",
    email: "admin@reusedo.app",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-emerald-600">Reusedo Admin</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {ADMIN_SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {item.icon}
              {item.title}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={ADMIN_USER} onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
