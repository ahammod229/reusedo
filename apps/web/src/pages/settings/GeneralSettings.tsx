import { ThemeToggle } from "@/shared/components/ui";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui";
import { MapPin, User } from "lucide-react";
import { Link } from "react-router";

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how Reusedo looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted p-4 rounded-lg">
            <div>
              <h4 className="font-medium">Theme</h4>
              <p className="text-sm text-muted-foreground">
                Select your preferred interface theme.
              </p>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Manage your personal information and addresses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <User size={20} />
              </div>
              <div>
                <h4 className="font-medium">Profile Information</h4>
                <p className="text-sm text-muted-foreground">
                  Update your display name, bio, and contact details.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/profile/edit">Edit Profile</Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-medium">Saved Addresses</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your addresses for shipping and pickups.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/profile/addresses">Manage Addresses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
