import { AuthService } from "@/features/auth";
import { useState } from "react";
import { useNavigate } from "react-router";

export const VerifyEmail = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await AuthService.sendVerificationEmail();
      setSuccess("Verification email resent. Please check your inbox.");
      // biome-ignore lint/suspicious/noExplicitAny: Firebase error
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a verification link to your email address. Please verify your email to access
          all features.
        </p>

        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-500 text-sm">{success}</div>}

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </button>

          <button
            type="button"
            onClick={() => {
              AuthService.logout();
              navigate("/login");
            }}
            className="w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
