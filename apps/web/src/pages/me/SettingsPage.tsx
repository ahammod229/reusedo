import { AuthService } from "@/features/auth";
import { profileKey, useProfile } from "@/features/auth/useProfile";
import { LangToggle } from "@/features/feed/LangToggle";
import { Field } from "@/pages/auth/components/Field";
import { apiClient } from "@/services/api";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Link, useNavigate } from "react-router";

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
  onClick,
  danger,
}: {
  icon: typeof Bell;
  label: string;
  hint?: string;
  right?: ReactNode;
  to?: string;
  onClick?: () => void;
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
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cls, "w-full text-left hover:bg-accent/60")}
      >
        {inner}
      </button>
    );
  }
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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useProfile();
  const [deleting, setDeleting] = useState(false);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiClient.patch("/users/me", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKey }),
  });
  const push = me?.settings?.notifyPush ?? true;
  const onMap = me?.showOnMap ?? false;

  const logout = async () => {
    await AuthService.logout();
    qc.clear();
    navigate("/login", { replace: true });
  };

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
          right={
            <Switch checked disabled aria-label={tr("ইমেইল নোটিফিকেশন", "Email notifications")} />
          }
        />
        <Row
          icon={Bell}
          label={tr("পুশ নোটিফিকেশন", "Push notifications")}
          right={
            <Switch
              checked={push}
              disabled={!me || save.isPending}
              onCheckedChange={(v) => save.mutate({ settings: { notifyPush: v } })}
              aria-label={tr("পুশ নোটিফিকেশন", "Push notifications")}
            />
          }
        />
      </Group>

      <Group title={tr("ঠিকানা ও গোপনীয়তা", "Address & privacy")}>
        <Row
          icon={MapPin}
          label={tr("আমার এলাকা", "My area")}
          hint={me?.area && me.district ? `${me.area}, ${me.district}` : undefined}
          to="/onboarding"
        />
        <Row
          icon={ShieldCheck}
          label={tr("দানের মানচিত্রে আমার নাম", "My name on the donation map")}
          hint={tr(
            "শুধু প্রথম নাম ও জেলা — কখনো ঠিকানা নয়",
            "First name and district only — never an address",
          )}
          right={
            <Switch
              checked={onMap}
              disabled={!me || save.isPending}
              onCheckedChange={(v) => save.mutate({ showOnMap: v })}
              aria-label={tr("দানের মানচিত্রে আমার নাম", "My name on the donation map")}
            />
          }
        />
        <Row
          icon={ShieldCheck}
          label={tr("পুরো ঠিকানা সবসময় গোপন", "Your full address stays private")}
          hint={tr(
            "অন্যরা শুধু এলাকা দেখেন; কুরিয়ারে পাঠালে ঠিকানা শুধু কুরিয়ার পায়",
            "Others see only your area; for courier deliveries only the courier gets it",
          )}
        />
      </Group>
      {save.isError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {tr("সংরক্ষণ হয়নি, আবার চেষ্টা করুন।", "Couldn't save — please try again.")}
        </p>
      )}

      <Group title={tr("নিরাপত্তা", "Security")}>
        <Row icon={KeyRound} label={tr("পাসওয়ার্ড বদলান", "Change password")} to="/forgot-password" />
        <Row icon={LogOut} label={tr("লগআউট", "Log out")} onClick={logout} />
        <Row
          icon={Trash2}
          danger
          label={tr("অ্যাকাউন্ট মুছে ফেলুন", "Delete account")}
          hint={tr("এটা ফেরানো যাবে না", "This cannot be undone")}
          onClick={() => setDeleting(true)}
        />
      </Group>
      {deleting && me && (
        <DeleteAccount username={me.username} onClose={() => setDeleting(false)} onDone={logout} />
      )}
    </div>
  );
}

function DeleteAccount({
  username,
  onClose,
  onDone,
}: { username: string; onClose: () => void; onDone: () => void }) {
  const tr = useTr();
  const [typed, setTyped] = useState("");
  const del = useMutation({
    mutationFn: () => apiClient.delete("/users/me", { data: { confirm: username } }),
    onSuccess: onDone,
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr("অ্যাকাউন্ট মুছে ফেলবেন?", "Delete your account?")}</DialogTitle>
          <DialogDescription>
            {tr(
              "আপনার পোস্ট, মেসেজ ও লেনদেন সব মুছে যাবে। নিশ্চিত হলে নিচে আপনার ইউজারনেম লিখুন:",
              "Your posts, messages and exchanges will be removed. To confirm, type your username:",
            )}{" "}
            <b className="font-mono">{username}</b>
          </DialogDescription>
        </DialogHeader>
        <Field
          label={tr("ইউজারনেম", "Username")}
          value={typed}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => setTyped(e.target.value.trim())}
        />
        {del.isError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {tr("মুছে ফেলা যায়নি, আবার চেষ্টা করুন।", "Couldn't delete — please try again.")}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {tr("বাতিল", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={typed !== username || del.isPending}
            onClick={() => del.mutate()}
          >
            {tr("মুছে ফেলুন", "Delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
