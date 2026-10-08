import { AuthService, authErrorText } from "@/features/auth";
import { useT, useTr } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/shared/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AuthShell } from "./components/AuthShell";
import { ErrorBanner, Field } from "./components/Field";

export const ForgotPassword = () => {
  const t = useT();
  const tr = useTr();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await AuthService.resetPassword(data);
      setSuccess(true);
    } catch (err) {
      // Same message whether or not the email exists, so this can't be used to probe accounts.
      if ((err as { code?: string })?.code === "auth/user-not-found") setSuccess(true);
      else setError(authErrorText(err, tr));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("forgotTitle")}
      subtitle={t("forgotSub")}
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {success && (
          <output className="block rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            {t("linkSent")}
          </output>
        )}
        <Field
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {t("sendLink")}
        </Button>
      </form>
    </AuthShell>
  );
};
