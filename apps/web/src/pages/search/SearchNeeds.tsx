import type { SearchFilters } from "@/shared/validation";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AdvancedFilters } from "../../components/search/AdvancedFilters";
import { SortDropdown } from "../../components/search/SortDropdown";
import { useSaveSearch, useSearchNeeds } from "../../hooks/useSearch";

export const SearchNeeds = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters: SearchFilters = {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    district: searchParams.get("district") || undefined,
    sortBy: (searchParams.get("sortBy") as "newest" | "oldest") || "newest",
    limit: 20,
    offset: 0,
  };

  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const { data, isLoading } = useSearchNeeds(filters);
  const saveSearch = useSaveSearch();

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
        type: "needs",
        query: filters.q || null,
        filters: filters as Record<string, string | number | boolean>,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <AdvancedFilters type="needs" filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Need Requests Search</h1>
              <p className="text-gray-500">{data?.count || 0} results found</p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
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
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse h-32 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="space-y-4">
              {data.data.map((need) => (
                <Link
                  to={`/needs/${need.id}`}
                  key={need.id}
                  className="block bg-white p-6 rounded-xl border hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{need.title}</h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full uppercase tracking-wider">
                      {need.deadline ? new Date(need.deadline).toLocaleDateString() : "No deadline"}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2 text-sm mb-4">{need.description}</p>
                  <div className="text-sm text-gray-500 flex items-center space-x-4">
                    <span>📍 {need.district}</span>
                    <span>📅 {new Date(need.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <p className="text-gray-500 font-medium">No needs match your criteria.</p>
              <button
                type="button"
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
