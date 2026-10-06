import { useLang, useNum, useT, useTr } from "@/features/feed/i18n";
import { CATEGORIES } from "@/features/feed/types";
import { Button } from "@/shared/components/ui";
import {
  ArrowRight,
  Camera,
  Handshake,
  Heart,
  MapPinned,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

export function Home() {
  const t = useT();
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);

  const steps = [
    { icon: Camera, title: t("step1"), body: t("step1d") },
    { icon: Heart, title: t("step2"), body: t("step2d") },
    { icon: Handshake, title: t("step3"), body: t("step3d") },
  ];
  const stats = [
    [tr("৳০", "৳0"), tr("সম্পূর্ণ বিনামূল্যে", "completely free")],
    [num(64), tr("জেলার সবার জন্য", "districts, for everyone")],
    [tr("১ মিনিট", "1 min"), tr("ছবি তুলে পোস্ট", "photo to post")],
  ];
  const safety = [
    {
      icon: UserCheck,
      title: tr("যাচাই করা সদস্য", "Verified members"),
      body: tr(
        "ইমেইল কোড, ঠিকানা ও ফোন যাচাই ছাড়া পোস্ট করা যায় না।",
        "No posting without email code, address and phone verification.",
      ),
    },
    {
      icon: MapPinned,
      title: tr("ঠিকানা সুরক্ষিত", "Address stays private"),
      body: tr(
        "পাবলিকে শুধু এলাকা দেখায়। পুরো ঠিকানা কেবল নিশ্চিত লেনদেনে।",
        "Only your area is public. The full address only after a confirmed exchange.",
      ),
    },
    {
      icon: Truck,
      title: tr("নিরাপদ কুরিয়ার", "Safe courier"),
      body: tr(
        "অ্যাডমিন যাচাই করে কনফার্ম করলে তবেই কুরিয়ার বুক হয়।",
        "Courier is booked only after an admin reviews and confirms.",
      ),
    },
    {
      icon: ShieldCheck,
      title: tr("রিপোর্ট ও রিভিউ", "Reports & reviews"),
      body: tr(
        "প্রতিটি লেনদেনের পর রিভিউ; সন্দেহজনক হলে এক ক্লিকে রিপোর্ট।",
        "Reviews after every exchange; one-tap reports if something feels off.",
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>ReuseDo — {t("appTagline")}</title>
        <meta name="description" content={t("heroBody")} />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-background px-6 py-16 md:py-24">
        <div
          aria-hidden
          className="absolute -right-16 top-8 h-64 w-64 rounded-full bg-need/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl space-y-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm font-semibold text-primary">
            🎁 {tr("১০০% বিনামূল্যে দান", "100% free giving")}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("heroBody")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full px-8 sm:w-auto">
              <Link to="/feed">
                {t("ctaBrowse")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full px-8 sm:w-auto">
              <Link to="/register">{t("ctaJoin")}</Link>
            </Button>
          </div>
          <dl className="mx-auto grid max-w-lg grid-cols-3 gap-2 pt-4">
            {stats.map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-background/70 p-3">
                <dt className="text-xl font-extrabold text-primary">{v}</dt>
                <dd className="text-xs text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-center text-2xl font-extrabold">
            {tr("কী কী পাওয়া যায়?", "What can you find?")}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link
                  to="/feed"
                  className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br p-5 text-center font-semibold transition-transform hover:-translate-y-0.5 ${c.tone}`}
                >
                  <span className="text-4xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <span className="text-foreground">{lang === "bn" ? c.bn : c.en}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-muted/50 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold">
            {tr("কীভাবে কাজ করে", "How it works")}
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center space-y-3 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon className="h-8 w-8" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {num(i + 1)}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold">
            {tr("নিরাপত্তা আমাদের অগ্রাধিকার", "Safety comes first")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {safety.map((s) => (
              <div key={s.title} className="flex gap-4 rounded-2xl border bg-card p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary px-6 py-16 text-primary-foreground">
        <div className="mx-auto max-w-2xl space-y-5 text-center">
          <h2 className="text-3xl font-extrabold">
            {tr("আজই একটি জিনিস দিয়ে দিন", "Give one thing away today")}
          </h2>
          <p className="text-primary-foreground/85">
            {tr(
              "এক মিনিটে ছবি তুলে পোস্ট করুন — কেউ না কেউ অপেক্ষায় আছে।",
              "Snap a photo, post in a minute — someone is waiting for it.",
            )}
          </p>
          <Button asChild size="lg" variant="secondary" className="px-8 text-primary">
            <Link to="/register">{t("ctaJoin")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
