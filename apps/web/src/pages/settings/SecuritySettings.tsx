import { useAuthStore } from "@/features/auth";
import { app } from "@/features/auth";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useToast,
} from "@/shared/components/ui";
import { getAuth, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { AlertTriangle, Key, Shield } from "lucide-react";
import { useState } from "react";

export function SecuritySettings() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const auth = getAuth(app);

  const handleVerifyEmail = async () => {
    if (!auth.currentUser) return;
    try {
      setIsVerifying(true);
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox to verify your email address.",
      });
    } catch (error: unknown) {
      const e = error as Error;
      toast({
        title: "Error",
        description: e.message || "Failed to send verification email.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      setIsResetting(true);
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for the password reset link.",
      });
    } catch (error: unknown) {
      const e = error as Error;
      toast({
        title: "Error",
        description: e.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Action Disabled",
      description: "For security reasons, account deletion must be requested through support.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Security & Authentication
          </CardTitle>
          <CardDescription>
            Manage your account's security settings and authentication methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b gap-4">
            <div>
              <h4 className="text-base font-medium">Email Address</h4>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.emailVerified ? (
                <span className="text-xs text-green-600 font-medium">Verified</span>
              ) : (
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} /> Not verified
                </span>
              )}
            </div>
            {!user?.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyEmail}
                disabled={isVerifying}
              >
                {isVerifying ? "Sending..." : "Verify Email"}
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b gap-4">
            <div>
              <h4 className="text-base font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">
                Change your password or request a reset link.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleResetPassword}
              disabled={isResetting}
            >
              <Key size={16} />
              {isResetting ? "Sending..." : "Reset Password"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h4 className="text-base font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
