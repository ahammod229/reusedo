import { Footer, Header, MobileBottomNav, Sidebar } from "@reusedo/ui";
import {
  Compass,
  HelpCircle,
  Home,
  MessageCircle,
  Repeat,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import * as React from "react";
import { Outlet } from "react-router";
import { NotificationBadge } from "../components/NotificationBadge";

// This is a placeholder user. In reality, you'd get this from your auth store.
const DUMMY_USER = {
  name: "John Doe",
  email: "john@example.com",
};

const SIDEBAR_ITEMS = [
  { title: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
  { title: "Explore", href: "/explore", icon: <Compass className="h-4 w-4" /> },
  { title: "Products", href: "/products", icon: <Search className="h-4 w-4" /> },
  { title: "Needs", href: "/needs", icon: <Search className="h-4 w-4" /> },
  { title: "Exchanges", href: "/exchanges", icon: <Repeat className="h-4 w-4" /> },
  { title: "Messages", href: "/messages", icon: <MessageCircle className="h-4 w-4" /> },
  { title: "Profile", href: "/profile", icon: <UserIcon className="h-4 w-4" /> },
  { title: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
  { title: "Help", href: "/help", icon: <HelpCircle className="h-4 w-4" /> },
];

const MOBILE_NAV_ITEMS = [
  { title: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
  { title: "Search", href: "/explore", icon: <Search className="h-5 w-5" /> },
  { title: "Exchange", href: "/exchanges", icon: <Repeat className="h-5 w-5" /> },
  { title: "Messages", href: "/messages", icon: <MessageCircle className="h-5 w-5" /> },
  { title: "Profile", href: "/profile", icon: <UserIcon className="h-5 w-5" /> },
];

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        user={DUMMY_USER}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        notificationAction={<NotificationBadge />}
      />

      <div className="flex flex-1">
        <Sidebar items={SIDEBAR_ITEMS} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Footer />
      <MobileBottomNav items={MOBILE_NAV_ITEMS} />
    </div>
  );
}
