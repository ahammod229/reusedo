import { NeedService, OfferService, ProductService, UserService } from "@/services/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Separator,
} from "@/shared/components/ui";
import type { Product } from "@/shared/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, Eye, MapPin, Share2, Target, X } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router";

export function NeedDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const {
    data: need,
    isLoading: needLoading,
    error: needError,
  } = useQuery({
    queryKey: ["need", id],
    queryFn: () => NeedService.getNeedById(id as string),
    enabled: !!id,
  });

  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ["user", need?.owner_id],
    queryFn: () => UserService.getPublicProfile(need?.owner_id as string),
    enabled: !!need?.owner_id,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ProductService.getCategories,
  });

  // Fetch the current user's published products for the offer modal
  const { data: myPublishedProducts } = useQuery({
    queryKey: ["myProducts", "published"],
    queryFn: () => ProductService.getMyProducts("published"),
    // Only fetch if they open the modal to save requests
    enabled: isOfferModalOpen,
  });

  const category = categories?.find((c) => c.id === need?.category_id);

  const offerMutation = useMutation({
    mutationFn: (productId: string) =>
      OfferService.submitOffer(id as string, { product_id: productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["need", id] });
      setIsOfferModalOpen(false);
      alert("Offer submitted successfully!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      alert(err?.response?.data?.error || err.message || "Failed to submit offer.");
    },
  });

  if (needLoading) {
    return (
      <div className="container mx-auto py-12 px-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="space-y-6">
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="space-y-2 mt-8">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needError || !need) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Need Request Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The request you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/needs">Back to Needs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Helmet>
        <title>{need.title} - Reusedo</title>
        <meta name="description" content={need.description.substring(0, 150)} />
      </Helmet>
      <div className="mb-6">
        <Link
          to="/needs"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          &larr; Back to Needs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border relative flex items-center justify-center">
            {need.images && need.images.length > 0 ? (
              <img
                loading="lazy"
                src={need.images[0]}
                alt={need.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Target className="w-16 h-16 mb-2 opacity-50" />
                <span className="text-lg font-medium">Looking For</span>
              </div>
            )}
            <Badge className="absolute top-4 right-4 text-sm px-3 py-1 bg-background/80 backdrop-blur text-foreground">
              {need.preferred_condition}
            </Badge>
          </div>

          {/* Thumbnails (if multiple images) */}
          {need.images && need.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {need.images.map((img, i) => (
                <button
                  type="button"
                  key={img}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${i === 0 ? "border-primary" : "border-transparent"}`}
                >
                  <img
                    loading="lazy"
                    src={img}
                    alt={`${need.title} ${i + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span>{category?.name || "Category"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {need.view_count} views
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {new Date(need.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{need.title}</h1>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg">
                {need.upazila}, {need.district}
              </span>
            </div>
          </div>

          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="text-xl font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {need.description}
              </p>
            </div>

            {/* Additional Details */}
            {(need.preferred_brand ||
              need.preferred_model ||
              need.estimated_value ||
              need.deadline) && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Preferences</h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-xl border">
                  {need.preferred_brand && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Preferred Brand:</span>
                      <span className="font-medium">{need.preferred_brand}</span>
                    </div>
                  )}
                  {need.preferred_model && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Preferred Model:</span>
                      <span className="font-medium">{need.preferred_model}</span>
                    </div>
                  )}
                  {need.estimated_value && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Estimated Value:</span>
                      <span className="font-medium">৳{need.estimated_value}</span>
                    </div>
                  )}
                  {need.deadline && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Needed By:</span>
                      <span className="font-medium">
                        {new Date(need.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {/* Owner Info & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Avatar className="w-12 h-12 border">
                <AvatarImage src={owner?.avatar_url || ""} />
                <AvatarFallback>{owner?.display_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">
                  {ownerLoading ? "Loading..." : owner?.display_name}
                </p>
                <Link
                  to={`/users/${owner?.username}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" size="icon" title="Share">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button onClick={() => setIsOfferModalOpen(true)} className="flex-1 sm:flex-none">
                Offer My Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal for Submitting Offer */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Submit an Offer</h2>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-muted-foreground mb-4">
                Select one of your published products to offer for this need request.
              </p>

              {!myPublishedProducts && (
                <div className="py-8 text-center">Loading your products...</div>
              )}

              {myPublishedProducts && myPublishedProducts.length === 0 && (
                <div className="text-center py-8 border rounded-lg bg-muted/30">
                  <p className="text-muted-foreground mb-4">
                    You don't have any published products.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/products/create">List a Product</Link>
                  </Button>
                </div>
              )}

              {myPublishedProducts && myPublishedProducts.length > 0 && (
                <div className="space-y-3">
                  {myPublishedProducts.map((p: Product) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${selectedProductId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50 hover:bg-muted/50"}`}
                    >
                      <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                        {p.images && p.images.length > 0 ? (
                          <img
                            loading="lazy"
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-medium truncate">{p.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{p.condition}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-muted/10 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsOfferModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => offerMutation.mutate(selectedProductId)}
                disabled={!selectedProductId || offerMutation.isPending}
              >
                {offerMutation.isPending ? "Submitting..." : "Submit Offer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
