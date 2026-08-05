import { NeedService, ProductService } from "@reusedo/api-client";
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
import type { Category, NeedRequest } from "@reusedo/validation";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Target } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export function NeedList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: needs, isLoading } = useQuery({
    queryKey: ["needs", selectedCategory],
    queryFn: () => NeedService.getNeeds(selectedCategory ? { category_id: selectedCategory } : {}),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ProductService.getCategories,
  });

  const filteredNeeds = needs?.filter(
    (n: NeedRequest) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Need Requests</h1>
          <p className="text-muted-foreground mt-2">
            Browse what other people are looking for and make an offer.
          </p>
        </div>
        <Button asChild>
          <Link to="/needs/create">Post a Need</Link>
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
                placeholder="Search needs..."
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

        {/* Needs Grid */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static array for skeleton
                <div key={i} className="h-[280px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredNeeds?.length === 0 ? (
            <div className="text-center py-20 border rounded-xl bg-card">
              <h3 className="text-xl font-semibold mb-2">No need requests found</h3>
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
              {filteredNeeds?.map((need: NeedRequest) => (
                <Link to={`/needs/${need.id}`} key={need.id}>
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="p-4 pb-2 border-b">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20"
                        >
                          Looking For
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {need.offer_count} offers
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg leading-tight">
                        {need.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 py-3 flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {need.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Condition</span>
                          <span className="font-medium truncate">{need.preferred_condition}</span>
                        </div>
                        {need.estimated_value && (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Est. Value</span>
                            <span className="font-medium truncate">৳{need.estimated_value}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-3 border-t bg-muted/10 mt-auto flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[120px]">
                          {need.upazila}, {need.district}
                        </span>
                      </div>
                      <div className="text-primary">
                        <Target className="h-4 w-4" />
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
