import { AuthService, useAuthStore, useProfile } from "@/features/auth";
import { useQueryClient } from "@tanstack/react-query";
import { LangToggle } from "@/features/feed/LangToggle";
import { useT } from "@/features/feed/i18n";
import { Button, Footer, Header, MobileBottomNav, Sidebar } from "@/shared/components/ui";
import {
  Bookmark,
  HelpCircle,
  Home,
  MessageCircle,
  Newspaper,
  PackageOpen,
  Plus,
  Repeat,
  Settings,
  Truck,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { NotificationBadge } from "../components/NotificationBadge";
import { MobileMenu } from "./MobileMenu";

export function MainLayout() {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ic = "h-5 w-5";
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebarItems = [
    { title: t("navHome"), href: "/home", icon: <Home className={ic} /> },
    { title: t("navFeed"), href: "/feed", icon: <Newspaper className={ic} /> },
    { title: t("navMyPosts"), href: "/my-posts", icon: <PackageOpen className={ic} /> },
    { title: t("navExchanges"), href: "/exchanges", icon: <Repeat className={ic} /> },
    { title: t("navCourier"), href: "/courier", icon: <Truck className={ic} /> },
    { title: t("navMessages"), href: "/messages", icon: <MessageCircle className={ic} /> },
    { title: t("navSaved"), href: "/saved", icon: <Bookmark className={ic} /> },
    { title: t("navProfile"), href: "/profile", icon: <UserIcon className={ic} /> },
    { title: t("navSettings"), href: "/settings", icon: <Settings className={ic} /> },
    { title: t("navHelp"), href: "/help", icon: <HelpCircle className={ic} /> },
  ];

  const mobileItems = [
    { title: t("navHome"), href: "/home", icon: <Home className={ic} /> },
    { title: t("navFeed"), href: "/feed", icon: <Newspaper className={ic} /> },
    { title: t("navPost"), href: "/post/new", icon: <Plus className="h-7 w-7" />, primary: true },
    { title: t("navMessages"), href: "/messages", icon: <MessageCircle className={ic} /> },
    { title: t("navProfile"), href: "/profile", icon: <UserIcon className={ic} /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        user={
          user
            ? {
                name: profile?.name || user.displayName || "User",
                email: user.email || "",
                avatar: profile?.avatarUrl ?? user.photoURL ?? undefined,
              }
            : null
        }
        onLogout={async () => {
          await AuthService.logout();
          qc.clear();
          navigate("/login", { replace: true });
        }}
        labels={{
          menu: t("menu"),
          search: t("searchPlaceholder"),
          profile: t("navProfile"),
          settings: t("navSettings"),
          login: t("login"),
          logout: t("logout"),
        }}
        onMenuClick={() => setMenuOpen(true)}
        notificationAction={user ? <NotificationBadge /> : null}
        actions={
          <>
            <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
              <Link to="/post/new">
                <Plus className="mr-1 h-4 w-4" /> {t("postCta")}
              </Link>
            </Button>
            <LangToggle />
          </>
        }
      />

      <div className="mx-auto flex w-full max-w-[88rem] flex-1">
        <Sidebar items={sidebarItems} title={t("menu")} />
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      <Footer
        labels={{
          rights: t("footerRights"),
          about: t("footerAbout"),
          terms: t("footerTerms"),
          privacy: t("footerPrivacy"),
          contact: t("footerContact"),
          note: t("footerNote"),
        }}
      />
      <MobileBottomNav items={mobileItems} />
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} items={sidebarItems} />
    </div>
  );
}
