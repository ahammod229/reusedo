import { useLang, useNum, useT } from "@/features/feed/i18n";
import { BD_DIVISIONS, isBdMobile, normalizePhone } from "@/features/geo/bd";
import { Button, cn } from "@/shared/components/ui";
import { Check, LocateFixed, MapPin, PartyPopper, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { AuthShell } from "./components/AuthShell";
import { ErrorBanner, Field, SelectField } from "./components/Field";
import { saveVerificationProfile } from "./otp.api";

type Step = 1 | 2 | 3;

export function Onboarding() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const num = useNum();
  const [step, setStep] = useState<Step>(2); // email step is already done when we arrive
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
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

  const steps = [t("stepEmail"), t("stepAddress"), t("stepPhone")];

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
      await saveVerificationProfile({ ...f, phone: normalizePhone(f.phone) });
      setDone(true);
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
            <Link to="/feed">{t("goFeed")}</Link>
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" disabled>
              <LocateFixed className="mr-2 h-4 w-4" /> {t("useMyLocation")}
            </Button>
            <Button type="button" variant="outline" className="flex-1" disabled>
              <MapPin className="mr-2 h-4 w-4" /> {t("pinOnMap")}
            </Button>
          </div>

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
    </AuthShell>
  );
}
