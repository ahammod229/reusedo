import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Skeleton,
  Switch,
} from "@/shared/components/ui";
import {
  type UpdateNotificationPreferencesData,
  updateNotificationPreferencesSchema,
} from "@/shared/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useFCM } from "../../hooks/useFCM";
import { useNotificationPreferences } from "../../hooks/useNotifications";

export function NotificationSettings() {
  const { data: preferences, isLoading, updatePreferences } = useNotificationPreferences();
  const { hasPermission, requestPermission } = useFCM();

  const form = useForm<UpdateNotificationPreferencesData>({
    resolver: zodResolver(updateNotificationPreferencesSchema),
    defaultValues: {
      exchange_updates: true,
      messages: true,
      need_requests: true,
      product_activity: true,
      marketing: false,
      reviews: true,
      browser_notifications: true,
      push_notifications: true,
    },
  });

  const browserNotifsEnabled = form.watch("browser_notifications");

  useEffect(() => {
    if (preferences) {
      form.reset(preferences);
    }
  }, [preferences, form]);

  function onSubmit(values: UpdateNotificationPreferencesData) {
    updatePreferences.mutate(values);
  }

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what you want to be notified about and how.</CardDescription>
      </CardHeader>
      <CardContent>
        {browserNotifsEnabled && !hasPermission && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Browser Notifications Required
              </h3>
              <p className="text-sm text-yellow-600 mt-1">
                You have browser notifications enabled, but permission is not granted.
              </p>
            </div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                requestPermission();
              }}
              variant="outline"
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
            >
              Grant Permission
            </Button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Core Activity</h3>

              <FormField
                control={form.control}
                name="exchange_updates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Exchange Updates</FormLabel>
                      <FormDescription>
                        Alerts for new requests, acceptances, and cancellations.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="messages"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Direct Messages</FormLabel>
                      <FormDescription>
                        Receive notifications when someone sends you a message.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="need_requests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Need Request Offers</FormLabel>
                      <FormDescription>
                        Alerts when someone submits an offer for what you need.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <h3 className="text-lg font-medium pt-4 border-t">Delivery Channels</h3>

              <FormField
                control={form.control}
                name="browser_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Browser Notifications</FormLabel>
                      <FormDescription>
                        Receive popup alerts while you are on your device.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="push_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mobile Push</FormLabel>
                      <FormDescription>
                        Receive native push alerts on your mobile device app.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={updatePreferences.isPending || !form.formState.isDirty}
              >
                {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </div>

            {updatePreferences.isSuccess && (
              <p className="text-green-600 text-sm text-right mt-2">
                Preferences saved successfully!
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
