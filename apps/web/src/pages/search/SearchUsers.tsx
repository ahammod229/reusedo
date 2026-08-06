import type { SearchFilters } from "@reusedo/validation";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AdvancedFilters } from "../../components/search/AdvancedFilters";
import { SortDropdown } from "../../components/search/SortDropdown";
import { useSearchUsers } from "../../hooks/useSearch";

export const SearchUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters: SearchFilters = {
    q: searchParams.get("q") || undefined,
    verified: searchParams.get("verified") === "true",
    sortBy: (searchParams.get("sortBy") as "relevant" | "newest") || "relevant",
    limit: 20,
    offset: 0,
  };

  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const { data, isLoading } = useSearchUsers(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value.toString());
    }
    setSearchParams(params);
  }, [filters, setSearchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <AdvancedFilters type="users" filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users Search</h1>
              <p className="text-gray-500">{data?.count || 0} results found</p>
            </div>

            <SortDropdown
              value={filters.sortBy}
              onChange={(s) => setFilters({ ...filters, sortBy: s })}
              options={[
                { label: "Highest Trust Score", value: "relevant" }, // Hijacking 'relevant' for Trust Score
                { label: "Newest Members", value: "newest" },
              ]}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map((user) => (
                <Link
                  to={`/users/${user.id}`}
                  key={user.id}
                  className="block bg-white border p-4 rounded-xl flex items-center space-x-4 hover:border-primary transition-colors"
                >
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                    {user.avatar_url && (
                      <img
                        loading="lazy"
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate flex items-center">
                      {user.display_name}
                      {user.is_verified && (
                        <svg
                          className="w-4 h-4 text-blue-500 ml-1 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <title>Verified</title>
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                    {user.trust_score !== undefined && (
                      <p className="text-xs text-primary font-medium mt-1">
                        Trust Score: {user.trust_score}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <p className="text-gray-500 font-medium">No users match your criteria.</p>
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
