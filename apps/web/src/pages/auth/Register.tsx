import { AuthService, authErrorText, isSilentAuthError } from "@/features/auth";
import { useT, useTr } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { type RegisterInput, registerSchema } from "@/shared/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { AuthShell } from "./components/AuthShell";
import { ErrorBanner, Field, PasswordField } from "./components/Field";
import { GoogleButton } from "./components/GoogleButton";

export const Register = () => {
  const t = useT();
  const tr = useTr();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.register(data);
      navigate("/verify-email");
    } catch (err) {
      setError(authErrorText(err, tr));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await AuthService.loginWithGoogle();
      navigate("/onboarding");
    } catch (err) {
      if (!isSilentAuthError(err)) setError(authErrorText(err, tr));
    }
  };

  return (
    <AuthShell
      title={t("registerTitle")}
      subtitle={t("registerSub")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogle} label={t("withGoogle")} />
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orContinue")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Field
          label={t("fullName")}
          autoComplete="name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Field
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label={t("password")}
          autoComplete="new-password"
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          hint={t("pwRule")}
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordField
          label={t("confirmPassword")}
          autoComplete="new-password"
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t("signingUp") : t("signUp")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("agreeTerms")}</p>
      </form>
    </AuthShell>
  );
};
