import { useAuthStore } from "@reusedo/auth";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reusedo/ui";
import { AlertTriangle, Key, Shield } from "lucide-react";

export function SecuritySettings() {
  const { user } = useAuthStore();

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
          <div className="flex items-center justify-between py-4 border-b">
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
              <Button variant="outline" size="sm">
                Verify Email
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <h4 className="text-base font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">
                Change your password or request a reset link.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Key size={16} />
              Reset Password
            </Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="text-base font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
