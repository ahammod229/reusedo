import { ProductService, UserService } from "@reusedo/api-client";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Separator } from "@reusedo/ui";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, Eye, MapPin, RefreshCcw, Share2, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();

  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => ProductService.getProductById(id as string),
    enabled: !!id,
  });

  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ["user", product?.owner_id],
    queryFn: () => UserService.getPublicProfile(product?.owner_id as string),
    enabled: !!product?.owner_id,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ProductService.getCategories,
  });

  const category = categories?.find((c) => c.id === product?.category_id);

  if (productLoading) {
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

  if (productError || !product) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The item you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/products">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Helmet>
        <title>{product.title} - Reusedo</title>
        <meta name="description" content={product.description.substring(0, 150)} />
      </Helmet>
      <div className="mb-6">
        <Link
          to="/products"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          &larr; Back to Marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border relative">
            {product.images && product.images.length > 0 ? (
              <img
                loading="lazy"
                src={product.images[0]}
                alt={product.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
            <Badge className="absolute top-4 right-4 text-sm px-3 py-1 bg-background/80 backdrop-blur text-foreground">
              {product.condition}
            </Badge>
          </div>

          {/* Thumbnails (if multiple images) */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  type="button"
                  key={img}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${i === 0 ? "border-primary" : "border-transparent"}`}
                >
                  <img
                    loading="lazy"
                    src={img}
                    alt={`${product.title} ${i + 1}`}
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
                <Eye className="w-4 h-4" /> {product.view_count} views
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {new Date(product.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{product.title}</h1>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg">
                {product.upazila}, {product.district}
              </span>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
            <h3 className="font-semibold flex items-center gap-2 mb-2 text-primary">
              <RefreshCcw className="w-5 h-5" /> Exchange Preference
            </h3>
            <p className="text-lg">{product.exchange_preference}</p>
          </div>

          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="text-xl font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Additional Details */}
            {(product.brand || product.model || product.color || product.purchase_year) && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.brand && (
                    <div>
                      <span className="text-muted-foreground">Brand:</span>{" "}
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div>
                      <span className="text-muted-foreground">Model:</span>{" "}
                      <span className="font-medium">{product.model}</span>
                    </div>
                  )}
                  {product.color && (
                    <div>
                      <span className="text-muted-foreground">Color:</span>{" "}
                      <span className="font-medium">{product.color}</span>
                    </div>
                  )}
                  {product.purchase_year && (
                    <div>
                      <span className="text-muted-foreground">Year:</span>{" "}
                      <span className="font-medium">{product.purchase_year}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {tag}
                  </Badge>
                ))}
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
              {/* Future feature: Message/Exchange button would go here */}
              <Button
                className="flex-1 sm:flex-none cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                Request Exchange
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
