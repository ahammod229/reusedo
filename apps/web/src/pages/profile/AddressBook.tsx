import { UserService } from "@reusedo/api-client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PageContainer,
  Skeleton,
  Switch,
} from "@reusedo/ui";
import { type AddressData, addressSchema } from "@reusedo/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type * as z from "zod";

function AddressForm({
  onSuccess,
  onCancel,
  defaultValues,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: AddressData & { id?: string };
}) {
  const queryClient = useQueryClient();
  const isEditing = !!defaultValues?.id;

  const form = useForm<z.infer<typeof addressSchema>>({
    // biome-ignore lint/suspicious/noExplicitAny: Required for ZodResolver
    resolver: zodResolver(addressSchema as any),
    defaultValues: defaultValues || {
      label: "",
      recipient_name: "",
      phone: "",
      district: "",
      upazila: "",
      area: "",
      postal_code: "",
      landmark: "",
      is_default: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof addressSchema>) =>
      isEditing && defaultValues.id
        ? UserService.updateAddress(defaultValues.id, data)
        : UserService.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      onSuccess();
    },
  });

  function onSubmit(values: z.infer<typeof addressSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label (e.g. Home, Office)</FormLabel>
                <FormControl>
                  <Input placeholder="Home" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipient_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+880..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <FormControl>
                  <Input placeholder="Dhaka" {...field} />
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
                <FormLabel>Upazila / Thana</FormLabel>
                <FormControl>
                  <Input placeholder="Gulshan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area / Street</FormLabel>
                <FormControl>
                  <Input placeholder="Road 1, Block A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="1212" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="landmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Landmark (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Near the hospital" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Set as Default Address</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end mt-4 gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEditing ? "Update Address" : "Save Address"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function AddressBook() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<(AddressData & { id: string }) | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: UserService.getMyAddresses,
  });

  const deleteMutation = useMutation({
    mutationFn: UserService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => UserService.updateAddress(id, { is_default: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[
        { title: "Home", href: "/" },
        { title: "My Profile", href: "/profile" },
        { title: "Address Book", href: "/profile/addresses" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Address Book</h1>
          {!isAdding && !editingAddress && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2" size={16} />
              Add Address
            </Button>
          )}
        </div>

        {isAdding && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle>Add New Address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressForm
                onSuccess={() => setIsAdding(false)}
                onCancel={() => setIsAdding(false)}
              />
            </CardContent>
          </Card>
        )}

        {editingAddress && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle>Edit Address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressForm
                defaultValues={editingAddress}
                onSuccess={() => setEditingAddress(null)}
                onCancel={() => setEditingAddress(null)}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {addresses?.length === 0 && !isAdding && !editingAddress && (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                <MapPin size={48} className="text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No addresses saved</h3>
                  <p className="text-muted-foreground">Add an address for shipping or pickups.</p>
                </div>
                <Button variant="outline" onClick={() => setIsAdding(true)}>
                  Add Address
                </Button>
              </CardContent>
            </Card>
          )}

          {!isAdding &&
            !editingAddress &&
            addresses?.map((address) => (
              <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {address.label}
                      {address.is_default && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="font-medium">{address.recipient_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Set as Default"
                        onClick={() => setDefaultMutation.mutate(address.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star size={16} className="text-muted-foreground" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      // biome-ignore lint/suspicious/noExplicitAny: State cast
                      onClick={() => setEditingAddress(address as any)}
                    >
                      <Edit size={16} className="text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm("Delete this address?")) {
                          deleteMutation.mutate(address.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{address.phone}</p>
                    <p>{address.area}</p>
                    <p>
                      {address.upazila}, {address.district} - {address.postal_code}
                    </p>
                    {address.landmark && <p>Landmark: {address.landmark}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </PageContainer>
  );
}
