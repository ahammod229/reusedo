import type { SearchFilters } from "@reusedo/validation";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AdvancedFilters } from "../../components/search/AdvancedFilters";
import { SortDropdown } from "../../components/search/SortDropdown";
import { useSaveSearch, useSearchProducts } from "../../hooks/useSearch";

export const SearchProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters: SearchFilters = {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    district: searchParams.get("district") || undefined,
    condition: (searchParams.get("condition") as "new" | "like_new" | "good" | "fair" | "poor") || undefined,
    sortBy: (searchParams.get("sortBy") as "relevant" | "newest" | "oldest" | "most_viewed" | "alphabetical") || "newest",
    limit: 20,
    offset: 0,
  };

  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const { data, isLoading } = useSearchProducts(filters);
  const saveSearch = useSaveSearch();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value.toString());
    }
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleSaveSearch = () => {
    const name = prompt("Name this search:");
    if (name) {
      saveSearch.mutate({
        name,
        type: "products",
        query: filters.q || null,
        filters: filters as Record<string, string | number | boolean>,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <AdvancedFilters type="products" filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products Search</h1>
              <p className="text-gray-500">{data?.count || 0} results found</p>
            </div>

            <div className="flex items-center space-x-4">
              <button type="button"
                onClick={handleSaveSearch}
                className="text-sm font-medium text-primary hover:bg-primary/5 px-3 py-1.5 rounded-md transition-colors"
              >
                Save Search
              </button>
              <SortDropdown
                value={filters.sortBy}
                onChange={(s) => setFilters({ ...filters, sortBy: s })}
                options={[
                  { label: "Newest First", value: "newest" },
                  { label: "Oldest First", value: "oldest" },
                  { label: "Most Relevant", value: "relevant" },
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 aspect-square rounded-lg" />
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.data.map((product) => (
                <Link to={`/products/${product.id}`} key={product.id} className="block group">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    {product.images?.[0] && (
                      <img
                        loading="lazy"
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-primary">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {product.district} • {product.condition}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <p className="text-gray-500 font-medium">No products match your criteria.</p>
              <button type="button"
                onClick={() => setFilters(initialFilters)}
                className="mt-4 text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
