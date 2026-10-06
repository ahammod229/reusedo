import { LangToggle } from "@/features/feed/LangToggle";
import { useLang, useTr } from "@/features/feed/i18n";
import { PageHeading } from "@/features/feed/parts";
import { Switch, ThemeToggle, cn } from "@/shared/components/ui";
import {
  Bell,
  ChevronRight,
  Globe,
  KeyRound,
  LogOut,
  MapPin,
  Palette,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y overflow-hidden rounded-2xl border bg-card">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  right,
  to,
  danger,
}: {
  icon: typeof Bell;
  label: string;
  hint?: string;
  right?: ReactNode;
  to?: string;
  danger?: boolean;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[15px] font-semibold", danger && "text-destructive")}>
          {label}
        </span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      {right ?? (to && <ChevronRight className="h-5 w-5 text-muted-foreground" />)}
    </>
  );
  const cls = "flex items-center gap-3 px-4 py-3.5";
  return to ? (
    <Link to={to} className={cn(cls, "hover:bg-accent/60")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function SettingsPage() {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const [n, setN] = useState({ email: true, push: true, match: true, marketing: false });
  const [hideExact, setHideExact] = useState(true);
  const toggle = (k: keyof typeof n) => (v: boolean) => setN((s) => ({ ...s, [k]: v }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-5">
      <Helmet>
        <title>{tr("সেটিংস", "Settings")} — ReuseDo</title>
      </Helmet>
      <PageHeading title={tr("সেটিংস", "Settings")} />

      <Group title={tr("সাধারণ", "General")}>
        <Row
          icon={Globe}
          label={tr("ভাষা", "Language")}
          hint={lang === "bn" ? "বাংলা" : "English"}
          right={<LangToggle />}
        />
        <Row
          icon={Palette}
          label={tr("থিম", "Theme")}
          hint={tr("লাইট / ডার্ক / সিস্টেম", "Light / dark / system")}
          right={<ThemeToggle />}
        />
      </Group>

      <Group title={tr("নোটিফিকেশন", "Notifications")}>
        <Row
          icon={Bell}
          label={tr("ইমেইল নোটিফিকেশন", "Email notifications")}
          hint={tr("রিকোয়েস্ট, কুরিয়ার আপডেট (আবশ্যক)", "Requests, courier updates (required)")}
          right={<Switch checked disabled aria-label="email" />}
        />
        <Row
          icon={Bell}
          label={tr("পুশ নোটিফিকেশন", "Push notifications")}
          right={<Switch checked={n.push} onCheckedChange={toggle("push")} aria-label="push" />}
        />
        <Row
          icon={Bell}
          label={tr("কাছাকাছি নতুন মিল", "Nearby matches")}
          hint={tr("আপনার খোঁজা জিনিস পোস্ট হলে জানান", "Tell me when something I need is posted")}
          right={<Switch checked={n.match} onCheckedChange={toggle("match")} aria-label="match" />}
        />
        <Row
          icon={Bell}
          label={tr("খবর ও টিপস", "News & tips")}
          right={
            <Switch checked={n.marketing} onCheckedChange={toggle("marketing")} aria-label="news" />
          }
        />
      </Group>

      <Group title={tr("ঠিকানা ও গোপনীয়তা", "Address & privacy")}>
        <Row
          icon={MapPin}
          label={tr("আমার ঠিকানা", "My address")}
          hint="মিরপুর ১০, ঢাকা"
          to="/onboarding"
        />
        <Row
          icon={ShieldCheck}
          label={tr("সঠিক ঠিকানা লুকানো", "Hide exact address")}
          hint={tr("লেনদেন নিশ্চিত হলে তবেই দেখাবে", "Shown only after a confirmed exchange")}
          right={<Switch checked={hideExact} onCheckedChange={setHideExact} aria-label="privacy" />}
        />
      </Group>

      <Group title={tr("নিরাপত্তা", "Security")}>
        <Row icon={KeyRound} label={tr("পাসওয়ার্ড বদলান", "Change password")} to="/forgot-password" />
        <Row icon={LogOut} label={tr("লগআউট", "Log out")} to="/login" />
        <Row
          icon={Trash2}
          danger
          label={tr("অ্যাকাউন্ট মুছে ফেলুন", "Delete account")}
          hint={tr("এটা ফেরানো যাবে না", "This cannot be undone")}
        />
      </Group>
    </div>
  );
}
