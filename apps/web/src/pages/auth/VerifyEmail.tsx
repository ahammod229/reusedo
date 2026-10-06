import { AuthService, useAuthStore } from "@/features/auth";
import { useNum, useT } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AuthShell } from "./components/AuthShell";
import { ErrorBanner } from "./components/Field";
import { OtpInput } from "./components/OtpInput";
import { resendEmailCode, verifyEmailCode } from "./otp.api";

const RESEND_SECONDS = 60;

export const VerifyEmail = () => {
  const t = useT();
  const num = useNum();
  const navigate = useNavigate();
  const email = useAuthStore((s) => s.user?.email) ?? "you@example.com";
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    setWrong(false);
    try {
      await verifyEmailCode(value);
      navigate("/onboarding");
    } catch (e) {
      if ((e as Error).message === "invalid_code") {
        setWrong(true);
        setError(t("wrongCode"));
        setCode("");
      } else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    setCode(v);
    setWrong(false);
    if (v.length === 6) submit(v);
  };

  const resend = async () => {
    setError(null);
    try {
      await resendEmailCode();
      setInfo(t("codeSentAgain"));
      setLeft(RESEND_SECONDS);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <AuthShell
      title={t("verifyTitle")}
      footer={
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => {
            AuthService.logout();
            navigate("/login");
          }}
        >
          {t("changeEmail")}
        </button>
      }
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("verifySent")}
          <br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>

        <OtpInput value={code} onChange={onChange} invalid={wrong} autoFocus />

        <div aria-live="polite" className="min-h-5 space-y-2">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {info && !error && <p className="text-sm font-medium text-success">{info}</p>}
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={code.length !== 6 || loading}
          onClick={() => submit()}
        >
          {loading ? t("verifying") : t("verifyBtn")}
        </Button>

        <div className="text-sm text-muted-foreground">
          {left > 0 ? (
            <span>
              {t("resendIn")} {num(left)} {t("seconds")}
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="font-semibold text-primary hover:underline"
            >
              {t("resend")}
            </button>
          )}
          <p className="mt-2 text-xs">{t("checkSpam")}</p>
        </div>
      </div>
    </AuthShell>
  );
};
