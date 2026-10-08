import { useLang, useNum, useT, useTr } from "@/features/feed/i18n";
import { useMe } from "@/features/feed/me";
import { CATEGORIES, type CategoryId, EDU_LEVELS, type EduLevel } from "@/features/feed/types";
import { BD_DIVISIONS, isBdMobile, normalizePhone } from "@/features/geo/bd";
import { DISTRICT_CENTERS, type LatLng, coarse, inBangladesh } from "@/features/geo/places";
import { Button, Switch, cn } from "@/shared/components/ui";
import { Check, LocateFixed, MapPin, PartyPopper, ShieldCheck } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { Link } from "react-router";
import { AuthShell } from "./components/AuthShell";
import { ErrorBanner, Field, SelectField } from "./components/Field";
import { saveVerificationProfile } from "./otp.api";

type Step = 1 | 2 | 3 | 4;

// Leaflet only loads if someone opens the picker.
const LocationPicker = lazy(() => import("@/features/geo/LocationPicker"));

export function Onboarding() {
  const t = useT();
  const tr = useTr();
  const me = useMe();
  const [about, setAbout] = useState<{
    level?: EduLevel;
    institution: string;
    showInstitution: boolean;
    interests: CategoryId[];
  }>({
    level: me.level,
    institution: me.institution,
    showInstitution: me.showInstitution,
    interests: me.interests,
  });
  const lang = useLang((s) => s.lang);
  const num = useNum();
  const [step, setStep] = useState<Step>(2); // email step is already done when we arrive
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocNote(
        tr(
          "এই ব্রাউজারে লোকেশন পাওয়া যায় না — ম্যাপে পিন করুন",
          "Location isn't available — pin it on the map",
        ),
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p: LatLng = [pos.coords.latitude, pos.coords.longitude];
        if (inBangladesh(p)) setPin(coarse(p));
        else
          setLocNote(
            tr(
              "আপনার অবস্থান বাংলাদেশের বাইরে দেখাচ্ছে — ম্যাপে পিন করুন",
              "You appear to be outside Bangladesh — pin it on the map",
            ),
          );
      },
      () => {
        setLocating(false);
        setLocNote(tr("অনুমতি পাওয়া যায়নি — ম্যাপে পিন করুন", "Permission denied — pin it on the map"));
      },
      { timeout: 8000 },
    );
  };
  const [f, setF] = useState({
    division: "",
    district: "",
    upazila: "",
    area: "",
    landmark: "",
    phone: "",
  });
  const set = (k: keyof typeof f) => (v: string) =>
    setF((s) => ({ ...s, [k]: v, ...(k === "division" ? { district: "" } : {}) }));

  const div = BD_DIVISIONS.find((d) => d.id === f.division);
  const addressOk = !!(f.division && f.district && f.upazila.trim() && f.area.trim());
  const phoneOk = isBdMobile(f.phone);
  const req = touched ? t("required") : undefined;

  const steps = [t("stepEmail"), t("stepAddress"), t("stepPhone"), tr("আপনি", "You")];

  const next = () => {
    setTouched(true);
    if (!addressOk) return;
    setTouched(false);
    setStep(3);
  };

  const finish = async () => {
    setTouched(true);
    if (!phoneOk) return;
    setSaving(true);
    setError(null);
    try {
      await saveVerificationProfile({
        ...f,
        phone: normalizePhone(f.phone),
        pin: pin ?? undefined,
      });
      setTouched(false);
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AuthShell title={t("verifiedDone")} subtitle={t("verifiedDoneSub")}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="h-10 w-10" />
          </div>
          <Button asChild size="lg" className="w-full">
            <Link to="/home">{tr("হোমে যান", "Go to home")}</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("setupTitle")} subtitle={t("setupSub")}>
      <ol className="mb-6 flex items-center" aria-label="progress">
        {steps.map((label, i) => {
          const n = i + 1;
          const complete = n < step || n === 1;
          const current = n === step;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold",
                    complete && "border-primary bg-primary text-primary-foreground",
                    current && !complete && "border-primary text-primary",
                    !complete && !current && "border-border text-muted-foreground",
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : num(n)}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    current ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mx-2 mb-5 h-0.5 flex-1 rounded",
                    n < step ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {step === 2 && (
        <div className="space-y-4">
          <SelectField
            label={t("division")}
            value={f.division}
            onChange={set("division")}
            placeholder={t("selectOne")}
            options={BD_DIVISIONS.map((d) => ({ value: d.id, label: lang === "bn" ? d.bn : d.en }))}
            error={!f.division ? req : undefined}
          />
          <SelectField
            label={t("districtLbl")}
            value={f.district}
            onChange={set("district")}
            placeholder={t("selectOne")}
            disabled={!div}
            options={(div?.districts ?? []).map((d) => ({ value: d, label: d }))}
            error={!f.district ? req : undefined}
          />
          <Field
            label={t("upazila")}
            value={f.upazila}
            onChange={(e) => set("upazila")(e.target.value)}
            error={!f.upazila.trim() ? req : undefined}
          />
          <Field
            label={t("areaLbl")}
            value={f.area}
            onChange={(e) => set("area")(e.target.value)}
            error={!f.area.trim() ? req : undefined}
          />
          <Field
            label={t("landmark")}
            value={f.landmark}
            onChange={(e) => set("landmark")(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 basis-44"
              disabled={locating}
              onClick={locateMe}
            >
              <LocateFixed className="mr-2 h-4 w-4" /> {t("useMyLocation")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 basis-44"
              onClick={() => setPicking(true)}
            >
              <MapPin className="mr-2 h-4 w-4" /> {t("pinOnMap")}
            </Button>
          </div>
          {(pin || locNote) && (
            <p
              className={cn("text-sm font-medium", pin ? "text-success" : "text-muted-foreground")}
            >
              {pin
                ? tr(
                    "📍 ম্যাপে এলাকা চিহ্নিত হয়েছে (প্রায় ১০০ মিটারের মধ্যে)",
                    "📍 Area marked on the map (within ~100 m)",
                  )
                : locNote}
            </p>
          )}
          {picking && (
            <Suspense fallback={null}>
              <LocationPicker
                open={picking}
                onOpenChange={setPicking}
                value={pin}
                start={DISTRICT_CENTERS[f.district] ?? null}
                onPick={setPin}
              />
            </Suspense>
          )}

          <p className="flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {t("addressPrivacy")}
          </p>
          <Button size="lg" className="w-full" onClick={next}>
            {t("next")}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Field
            label={t("phoneLbl")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phoneHint")}
            value={f.phone}
            onChange={(e) => set("phone")(e.target.value)}
            error={touched && !phoneOk ? t("phoneInvalid") : undefined}
            hint={t("phoneWhy")}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setTouched(false);
                setStep(2);
              }}
            >
              {t("back")}
            </Button>
            <Button size="lg" className="flex-1" disabled={saving} onClick={finish}>
              {t("finish")}
            </Button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-5">
          <p className="rounded-xl bg-primary/5 p-3 text-sm">
            {tr(
              "ঐচ্ছিক — জানালে আপনার ক্লাসের বই আর দরকারি জিনিস আগে দেখাব।",
              "Optional — it lets us show things for your class first.",
            )}
          </p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">
              {tr("আপনি কী পড়েন?", "What are you studying?")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {[
                ...EDU_LEVELS.map((l) => [l.id, lang === "bn" ? l.bn : l.en] as const),
                ["none", tr("পড়ি না / অভিভাবক", "Not a student / parent")] as const,
              ].map(([id, label]) => {
                const on = id === "none" ? !about.level : about.level === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAbout((a) => ({
                        ...a,
                        level: id === "none" ? undefined : (id as EduLevel),
                      }))
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="space-y-2">
            <Field
              label={tr(
                "স্কুল / কলেজ / বিশ্ববিদ্যালয় (ঐচ্ছিক)",
                "School / college / university (optional)",
              )}
              value={about.institution}
              maxLength={80}
              onChange={(e) => setAbout((a) => ({ ...a, institution: e.target.value }))}
            />
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <span className="text-sm">
                <span className="block font-semibold">
                  {tr("প্রোফাইলে দেখাব", "Show on my profile")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {tr(
                    "বন্ধ থাকলে কেউ দেখবে না — নিরাপত্তার জন্য ডিফল্টে বন্ধ।",
                    "Hidden unless you turn it on — off by default for safety.",
                  )}
                </span>
              </span>
              <Switch
                checked={about.showInstitution}
                onCheckedChange={(v) => setAbout((a) => ({ ...a, showInstitution: v }))}
                aria-label={tr("প্রোফাইলে দেখাব", "Show on my profile")}
              />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">
              {tr("কোন জিনিসে আগ্রহ?", "What are you interested in?")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = about.interests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAbout((a) => ({
                        ...a,
                        interests: on
                          ? a.interests.filter((x) => x !== c.id)
                          : [...a.interests, c.id],
                      }))
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      on ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                    )}
                  >
                    {c.emoji} {lang === "bn" ? c.bn : c.en}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={() => setDone(true)}>
              {tr("পরে করব", "Skip")}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                me.set(about);
                setDone(true);
              }}
            >
              {t("finish")}
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
