import { UserService } from "@reusedo/api-client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageContainer,
  Progress,
  Skeleton,
} from "@reusedo/ui";
import { useQuery } from "@tanstack/react-query";
import { Edit, MapPin, Settings, Shield, User } from "lucide-react";
import { Link } from "react-router";

export function MyProfile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: UserService.getMyProfile,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <EmptyState
          icon={<User />}
          title="Profile Error"
          description="Failed to load your profile."
        />
      </PageContainer>
    );
  }

  // Calculate profile completeness
  const completableFields = [
    profile.avatar_url,
    profile.cover_url,
    profile.bio,
    profile.phone_number,
    profile.district,
    profile.date_of_birth,
  ];
  const completedFields = completableFields.filter(Boolean).length;
  const completionPercentage = Math.round((completedFields / completableFields.length) * 100);

  return (
    <PageContainer
      breadcrumbs={[
        { title: "Home", href: "/" },
        { title: "My Profile", href: "/profile" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/profile/settings">
                <Settings className="mr-2" size={16} />
                Settings
              </Link>
            </Button>
            <Button asChild>
              <Link to="/profile/edit">
                <Edit className="mr-2" size={16} />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Completion Card */}
        {completionPercentage < 100 && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Profile Completion</span>
                <span className="text-blue-600 dark:text-blue-400">{completionPercentage}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={completionPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Complete your profile to build trust in the community.
              </p>
              <Button size="sm" variant="outline" asChild className="bg-white dark:bg-transparent">
                <Link to="/profile/edit">Complete Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Identity Section */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                <div className="w-32 h-32 rounded-full border-4 border-background bg-muted overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      loading="lazy"
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile.display_name}</h2>
                  <p className="text-muted-foreground">@{profile.username || "setup_username"}</p>
                </div>
                <Badge variant={profile.is_verified ? "default" : "secondary"}>
                  {profile.is_verified ? "Verified User" : "Unverified"}
                </Badge>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full flex-col h-20 gap-2" asChild>
                <Link to={`/users/${profile.username}`}>
                  <User size={20} />
                  <span className="text-xs">Public View</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full flex-col h-20 gap-2" asChild>
                <Link to="/profile/security">
                  <Shield size={20} />
                  <span className="text-xs">Security</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Details Section */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {profile.bio || "No bio added yet. Tell the community about yourself!"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Contact & Location</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile/edit">Edit</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-muted-foreground">Email</div>
                  <div>{profile.email}</div>

                  <div className="text-muted-foreground">Phone</div>
                  <div>{profile.phone_number || "Not added"}</div>

                  <div className="text-muted-foreground">District</div>
                  <div>{profile.district || "Not added"}</div>

                  <div className="text-muted-foreground">Upazila</div>
                  <div>{profile.upazila || "Not added"}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Address Book</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile/addresses">Manage</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                  <MapPin size={24} className="text-primary" />
                  <p>Manage your saved addresses for shipping and pickups.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
