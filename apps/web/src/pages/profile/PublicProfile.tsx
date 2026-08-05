import { UserService } from "@reusedo/api-client";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageContainer,
  Skeleton,
} from "@reusedo/ui";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Mail, MapPin, Phone, User } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router";

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => UserService.getPublicProfile(username || ""),
    enabled: !!username,
    retry: false,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="flex items-start gap-6">
            <Skeleton className="h-32 w-32 rounded-full -mt-16" />
            <div className="space-y-3 mt-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer>
        <EmptyState
          icon={<User />}
          title="User Not Found"
          description="The user you are looking for does not exist or has hidden their profile."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Helmet>
        <title>
          {profile.display_name} (@{profile.username}) - Reusedo
        </title>
        <meta
          name="description"
          content={
            profile.bio
              ? profile.bio.substring(0, 150)
              : `View the profile of ${profile.display_name} on Reusedo.`
          }
        />
      </Helmet>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cover & Avatar Header */}
        <div className="relative">
          <div className="h-48 md:h-64 bg-muted rounded-xl overflow-hidden w-full object-cover">
            {profile.cover_url ? (
              <img
                loading="lazy"
                src={profile.cover_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10" />
            )}
          </div>
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="w-32 h-32 rounded-full border-4 border-background bg-muted overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  loading="lazy"
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary">
                  <User size={48} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                {profile.is_verified && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    <CheckCircle size={14} /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-lg">@{profile.username}</p>
            </div>

            {profile.bio && (
              <div className="prose dark:prose-invert">
                <p>{profile.bio}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.join_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Joined {new Date(profile.join_date).toLocaleDateString()}</span>
                </div>
              )}
              {(profile.district || profile.upazila) && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>
                    {profile.upazila ? `${profile.upazila}, ` : ""}
                    {profile.district}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Card (if visible) */}
          {(profile.email || profile.phone_number) && (
            <Card className="w-full md:w-80 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <a href={`mailto:${profile.email}`} className="hover:underline">
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-muted-foreground" />
                    <a href={`tel:${profile.phone_number}`} className="hover:underline">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
