import { AdminService } from "@/services/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/components/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const AdminExchanges = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exchanges", page, search],
    queryFn: () => AdminService.getExchanges(page, search),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      AdminService.updateExchangeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exchanges"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exchange Moderation</h1>
        <p className="text-muted-foreground">Monitor exchanges happening on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exchanges</CardTitle>
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
                  <th className="px-4 py-3">Exchange ID</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
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
                ) : data?.exchanges?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No exchanges found.
                    </td>
                  </tr>
                ) : (
                  // biome-ignore lint/suspicious/noExplicitAny: Untyped API response
                  data?.exchanges?.map((exchange: any) => (
                    <tr key={exchange.id as string} className="border-b">
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{exchange.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {exchange.requester?.display_name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{exchange.requester?.username}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {exchange.recipient?.display_name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{exchange.recipient?.username}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            exchange.status === "completed"
                              ? "default"
                              : exchange.status === "cancelled" || exchange.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {exchange.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(exchange.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {exchange.status !== "cancelled" && exchange.status !== "completed" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm("Are you sure you want to forcibly cancel this exchange?")
                                ) {
                                  updateStatusMutation.mutate({
                                    id: exchange.id,
                                    status: "cancelled",
                                  });
                                }
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              Force Cancel
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
            <span className="text-sm text-muted-foreground">Total: {data?.total || 0}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data || data.exchanges.length < 20 || isLoading}
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
