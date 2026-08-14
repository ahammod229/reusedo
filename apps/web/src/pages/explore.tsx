import { ProductService } from "@/services/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  PageContainer,
} from "@/shared/components/ui";
import type { Product } from "@/shared/validation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Search, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

export function Explore() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["explore_products"],
    queryFn: () => ProductService.getProducts({}),
  });

  return (
    <>
      <Helmet>
        <title>Explore - Reusedo Marketplace</title>
        <meta
          name="description"
          content="Discover items available for exchange in the Reusedo community. Find what you need and trade what you have."
        />
      </Helmet>
      <PageContainer
        title="Explore"
        description="Discover products available for exchange in the community."
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Explore" }]}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static array for skeleton
              <div key={i} className="h-[350px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 border rounded-xl bg-card">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              There are no items available right now. Check back later!
            </p>
            <Button asChild>
              <Link to="/products/create">List an Item</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {products?.map((product: Product) => (
              <Link to={`/products/${product.id}`} key={product.id}>
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        loading="lazy"
                        src={product.images[0]}
                        alt={product.title}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                        No Image
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur text-foreground hover:bg-background/90">
                      {product.condition}
                    </Badge>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="line-clamp-1 text-lg">{product.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {product.upazila}, {product.district}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-2 border-t flex justify-between items-center bg-muted/20 mt-auto">
                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Tag className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{product.exchange_preference}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Button asChild variant="outline" size="lg" className="h-12 px-8">
            <Link to="/products">
              View All Marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
