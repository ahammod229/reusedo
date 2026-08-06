import { zodResolver } from "@hookform/resolvers/zod";
import { UserService } from "@reusedo/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PageContainer,
  Skeleton,
  Textarea,
} from "@reusedo/ui";
import { type UpdateProfileData, updateProfileSchema } from "@reusedo/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: UserService.getMyProfile,
  });

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      display_name: "",
      username: "",
      bio: "",
      phone_number: "",
      district: "",
      upazila: "",
      avatar_url: "",
      cover_url: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        phone_number: profile.phone_number || "",
        district: profile.district || "",
        upazila: profile.upazila || "",
        avatar_url: profile.avatar_url || "",
        cover_url: profile.cover_url || "",
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: UserService.updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      navigate("/profile");
    },
  });

  function onSubmit(values: UpdateProfileData) {
    updateMutation.mutate(values);
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-[600px] w-full max-w-2xl mx-auto rounded-lg" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[
        { title: "Home", href: "/" },
        { title: "My Profile", href: "/profile" },
        { title: "Edit Profile", href: "/profile/edit" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe123" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell the community about yourself..."
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Maximum 500 characters.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." type="url" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cover_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." type="url" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+880..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Input placeholder="Dhaka" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="upazila"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upazila / Area</FormLabel>
                        <FormControl>
                          <Input placeholder="Gulshan" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || !form.formState.isDirty}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
