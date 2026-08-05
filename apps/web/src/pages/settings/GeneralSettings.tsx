import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reusedo/ui";
import { Link } from "react-router";

export function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage your account's general preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-medium">Profile Information</h4>
            <p className="text-sm text-muted-foreground">
              Update your name, bio, and contact details from your profile editor.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/profile/edit">Edit Profile</Link>
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-medium">Addresses</h4>
            <p className="text-sm text-muted-foreground">
              Manage your saved addresses for shipping and pickups.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/profile/addresses">Manage Addresses</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
