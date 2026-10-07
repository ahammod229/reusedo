import { AuthService } from "@/features/auth";
import { useT } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { type LoginInput, loginSchema } from "@/shared/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { AuthShell } from "./components/AuthShell";
import { ErrorBanner, Field, PasswordField } from "./components/Field";
import { GoogleButton } from "./components/GoogleButton";

export const Login = () => {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.login(data);
      navigate("/home");
    } catch (err) {
      setError((err as Error).message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await AuthService.loginWithGoogle();
      navigate("/home");
      // biome-ignore lint/suspicious/noExplicitAny: Firebase error
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    }
  };

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={t("loginSub")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t("signUp")}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && <ErrorBanner>{error}</ErrorBanner>}
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
          autoComplete="current-password"
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t("signingIn") : t("signIn")}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orContinue")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton onClick={handleGoogleLogin} label={t("withGoogle")} />
    </AuthShell>
  );
};
