import { useLang, useT } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { ArrowRight, Camera, Handshake, Heart } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

export function Home() {
  const t = useT();
  const { lang, setLang } = useLang();
  const steps = [
    { icon: Camera, title: t("step1"), body: t("step1d") },
    { icon: Heart, title: t("step2"), body: t("step2d") },
    { icon: Handshake, title: t("step3"), body: t("step3d") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>ReuseDo — {t("appTagline")}</title>
        <meta name="description" content={t("heroBody")} />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 to-background px-6 py-20 md:py-28">
        <button
          type="button"
          onClick={() => setLang(lang === "bn" ? "en" : "bn")}
          className="absolute right-4 top-4 rounded-full border bg-background px-3 py-1 text-sm hover:bg-accent"
        >
          {lang === "bn" ? "English" : "বাংলা"}
        </button>
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="text-5xl">🎁</div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("heroBody")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 w-full px-8 text-base sm:w-auto">
              <Link to="/feed">
                {t("ctaBrowse")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full px-8 text-base sm:w-auto"
            >
              <Link to="/register">{t("ctaJoin")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center space-y-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <s.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">
                {i + 1}. {s.title}
              </h3>
              <p className="text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
