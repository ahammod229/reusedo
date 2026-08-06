import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@reusedo/api-client";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@reusedo/ui";

export const AdminShipping = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "shipments", page, search],
    queryFn: () => AdminService.getShipments(page, search),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      AdminService.updateShipmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping Moderation</h1>
        <p className="text-muted-foreground">
          Monitor and manage platform shipments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
          <div className="flex justify-between items-center mt-4">
            <Input
              placeholder="Search by status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Shipment ID</th>
                  <th className="px-4 py-3">Exchange ID</th>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Receiver</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : data?.shipments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No shipments found.
                    </td>
                  </tr>
                ) : (
                  // biome-ignore lint/suspicious/noExplicitAny: Untyped API response
                  data?.shipments?.map((shipment: any) => (
                    <tr key={shipment.id as string} className="border-b">
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{shipment.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{shipment.exchange_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{shipment.sender?.display_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">@{shipment.sender?.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{shipment.receiver?.display_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">@{shipment.receiver?.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          shipment.status === "delivered" ? "default" : 
                          shipment.status === "cancelled" || shipment.status === "returned" ? "destructive" : 
                          "secondary"
                        }>
                          {shipment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {shipment.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: shipment.id, status: "processing" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Process
                            </Button>
                          )}
                          {shipment.status !== "cancelled" && shipment.status !== "delivered" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to forcibly cancel this shipment?")) {
                                  updateStatusMutation.mutate({ id: shipment.id, status: "cancelled" });
                                }
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              Total: {data?.total || 0}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!data || data.shipments.length < 20 || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
