import { Menu, Search } from "lucide-react";
import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export interface HeaderLabels {
  menu: string;
  search: string;
  profile: string;
  settings: string;
  login: string;
  logout: string;
}

const DEFAULT_LABELS: HeaderLabels = {
  menu: "Menu",
  search: "Search…",
  profile: "Profile",
  settings: "Settings",
  login: "Log in",
  logout: "Log out",
};

export interface HeaderProps {
  onMenuClick?: () => void;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
  notificationAction?: React.ReactNode;
  /** Extra controls on the right (language toggle, primary CTA). */
  actions?: React.ReactNode;
  /** Hide the logo from md up (e.g. when a sidebar already shows it). */
  hideLogoOnDesktop?: boolean;
  labels?: Partial<HeaderLabels>;
}

export function Header({
  onMenuClick,
  user,
  onLogout,
  notificationAction,
  actions,
  labels,
  hideLogoOnDesktop,
}: HeaderProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-2 px-3 sm:h-16 sm:gap-3 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">{l.menu}</span>
        </Button>

        <Link
          to="/"
          className={cn("shrink-0", hideLogoOnDesktop && "md:hidden")}
          aria-label="ReuseDo"
        >
          <Logo />
        </Link>

        <form
          // biome-ignore lint/a11y/useSemanticElements: a search landmark needs the form, not just the input
          role="search"
          action="/search"
          className="relative mx-auto hidden w-full max-w-md flex-1 sm:block"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            type="search"
            placeholder={l.search}
            aria-label={l.search}
            className="h-10 w-full rounded-full border border-input bg-muted/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link to="/search" aria-label={l.search}>
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          {actions}
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
          {notificationAction}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name || "User"} />
                    <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">{l.profile}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">{l.settings}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>{l.logout}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="h-9 rounded-full px-4">
              <Link to="/login">{l.login}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
