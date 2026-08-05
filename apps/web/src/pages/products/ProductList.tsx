import { ProductService } from "@reusedo/api-client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@reusedo/ui";
import type { Category, Product } from "@reusedo/validation";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Tag } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export function ProductList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: () =>
      ProductService.getProducts(selectedCategory ? { category_id: selectedCategory } : {}),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ProductService.getCategories,
  });

  const filteredProducts = products?.filter(
    (p: Product) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Browse items available for exchange or donation.
          </p>
        </div>
        <Button asChild>
          <Link to="/products/create">List an Item</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder="Search items..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Categories</h3>
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${selectedCategory === "" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setSelectedCategory("")}
              >
                All Categories
              </button>
              {categories?.map((category: Category) => (
                <button
                  type="button"
                  key={category.id}
                  className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static array for skeleton
                <div key={i} className="h-[350px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-20 border rounded-xl bg-card">
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts?.map((product: Product) => (
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
                        <span className="truncate max-w-[120px]">
                          {product.exchange_preference}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
