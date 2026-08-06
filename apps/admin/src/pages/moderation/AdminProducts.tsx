import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@reusedo/api-client";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@reusedo/ui";

export const AdminProducts = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page, search],
    queryFn: () => AdminService.getProducts(page, search),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      AdminService.updateProductStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => AdminService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products Moderation</h1>
        <p className="text-muted-foreground">
          Manage all products, update statuses, or delete listings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <div className="flex justify-between items-center mt-4">
            <Input
              placeholder="Search products..."
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
                  <th className="px-4 py-3">ID / Title</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : data?.products?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  // biome-ignore lint/suspicious/noExplicitAny: Untyped API response
                  data?.products?.map((product: any) => (
                    <tr key={product.id as string} className="border-b">
                      <td className="px-4 py-3">
                        <div className="font-medium">{product.title}</div>
                        <div className="text-xs text-muted-foreground">{product.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{product.owner?.display_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">@{product.owner?.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.status === "published" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {product.status !== "published" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: product.id, status: "published" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Approve
                            </Button>
                          )}
                          {product.status !== "archived" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: product.id, status: "archived" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Archive
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this product?")) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            disabled={deleteProductMutation.isPending}
                          >
                            Delete
                          </Button>
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
                disabled={!data || data.products.length < 20 || isLoading}
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
