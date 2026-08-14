import { ProductService } from "@/services/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui";
import type { Product } from "@/shared/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle, Edit, Eye, Loader2, Tag, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { useState } from "react";

export function MyProducts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("published");

  const { data: products, isLoading } = useQuery({
    queryKey: ["myProducts"],
    queryFn: () => ProductService.getMyProducts(),
  });

  const publishMutation = useMutation({
    mutationFn: ProductService.publishProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myProducts"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: ProductService.archiveProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myProducts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: ProductService.deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myProducts"] }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const drafts = products?.filter((p) => p.status === "draft") || [];
  const published = products?.filter((p) => p.status === "published") || [];
  const archived = products?.filter((p) => p.status === "archived") || [];

  const ProductGrid = ({ items, emptyMessage }: { items: Product[]; emptyMessage: string }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-16 border rounded-xl bg-card border-dashed">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((product) => (
          <Card key={product.id} className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-1" title={product.title}>
                  {product.title}
                </CardTitle>
                <Badge variant={product.status === "published" ? "default" : "secondary"}>
                  {product.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Eye className="w-3 h-3" /> {product.view_count} views
              </p>
            </CardHeader>
            <CardContent className="pb-2 flex-grow">
              <div className="aspect-video bg-muted rounded-md overflow-hidden mb-3">
                {product.images?.[0] ? (
                  <img
                    loading="lazy"
                    src={product.images[0]}
                    alt={product.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            </CardContent>
            <CardFooter className="pt-4 border-t flex flex-wrap gap-2 mt-auto">
              {product.status !== "draft" && (
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/products/${product.id}`}>
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link to={`/products/${product.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Link>
              </Button>

              {product.status === "draft" && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => publishMutation.mutate(product.id)}
                  disabled={publishMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Publish
                </Button>
              )}

              {product.status === "published" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => archiveMutation.mutate(product.id)}
                  disabled={archiveMutation.isPending}
                >
                  <Archive className="w-4 h-4 mr-2" /> Archive
                </Button>
              )}

              <Button
                variant="destructive"
                size="icon"
                title="Delete"
                className="shrink-0"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this?"))
                    deleteMutation.mutate(product.id);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your listings, drafts, and archived items.
          </p>
        </div>
        <Button asChild>
          <Link to="/products/create">
            <Tag className="w-4 h-4 mr-2" /> List New Item
          </Link>
        </Button>
      </div>

      <div className="flex gap-6 mb-6 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("published")}
          className={`pb-2 text-sm font-medium transition-colors hover:text-primary ${activeTab === "published" ? "border-b-2 border-primary text-primary" : "text-muted-foreground border-transparent"}`}
        >
          Published ({published.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("drafts")}
          className={`pb-2 text-sm font-medium transition-colors hover:text-primary ${activeTab === "drafts" ? "border-b-2 border-primary text-primary" : "text-muted-foreground border-transparent"}`}
        >
          Drafts ({drafts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          className={`pb-2 text-sm font-medium transition-colors hover:text-primary ${activeTab === "archived" ? "border-b-2 border-primary text-primary" : "text-muted-foreground border-transparent"}`}
        >
          Archived ({archived.length})
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "published" && (
          <ProductGrid items={published} emptyMessage="You don't have any published products." />
        )}
        {activeTab === "drafts" && (
          <ProductGrid items={drafts} emptyMessage="You don't have any saved drafts." />
        )}
        {activeTab === "archived" && (
          <ProductGrid items={archived} emptyMessage="No archived products." />
        )}
      </div>
    </div>
  );
}
