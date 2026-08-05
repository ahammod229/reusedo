import { PageContainer } from "@reusedo/ui";
import { cn } from "@reusedo/ui/src/lib/utils";
import { Bell, Lock, Shield, User } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";

const SETTINGS_NAV = [
  {
    title: "General",
    href: "/profile/settings",
    icon: User,
  },
  {
    title: "Privacy",
    href: "/profile/privacy",
    icon: Shield,
  },
  {
    title: "Notifications",
    href: "/profile/notifications",
    icon: Bell,
  },
  {
    title: "Security",
    href: "/profile/security",
    icon: Lock,
  },
];

export function SettingsLayout() {
  const location = useLocation();

  return (
    <PageContainer
      breadcrumbs={[
        { title: "Home", href: "/" },
        { title: "My Profile", href: "/profile" },
        { title: "Settings", href: location.pathname },
      ]}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/profile/settings"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <Icon size={18} />
                  {item.title}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  );
}
