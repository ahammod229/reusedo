import type { NeedRequest as Need, Product, UserProfile } from "@reusedo/validation";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounce } from "use-debounce";
import { useGlobalSearch, useLogSearchAnalytics } from "../../hooks/useSearch";

export const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading } = useGlobalSearch({ q: debouncedQuery, limit: 5, offset: 0 });
  const logAnalytics = useLogSearchAnalytics();

  useEffect(() => {
    if (debouncedQuery && data) {
      // Log search analytically once we have results (debounce prevents spamming)
      logAnalytics.mutate({ keyword: debouncedQuery, result_count: data.totalCount });
    }
  }, [debouncedQuery, data, logAnalytics.mutate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    setIsOpen(false);
    if (type === "product") navigate(`/products/${id}`);
    else if (type === "need") navigate(`/needs/${id}`);
    else if (type === "user") navigate(`/users/${id}`);

    // Log click
    logAnalytics.mutate({
      keyword: debouncedQuery,
      result_count: data?.totalCount || 0,
      clicked_item_id: id,
    });
  };

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="search"
          placeholder="Search for products, needs, users..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Search icon</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </form>

      {isOpen && query.length > 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border z-50 max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : data && data.totalCount > 0 ? (
            <div className="space-y-6">
              {data.products.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Products
                  </h3>
                  <div className="space-y-2">
                    {data.products.map((product: Product) => (
                      <button
                        type="button"
                        key={product.id}
                        className="cursor-pointer w-full text-left hover:bg-gray-50 p-2 rounded flex items-center space-x-3"
                        onClick={() => handleResultClick("product", product.id)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.title}</p>
                          <p className="text-xs text-gray-500">{product.district}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {data.needs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Needs
                  </h3>
                  <div className="space-y-2">
                    {data.needs.map((need: Need) => (
                      <button
                        type="button"
                        key={need.id}
                        className="cursor-pointer w-full text-left hover:bg-gray-50 p-2 rounded"
                        onClick={() => handleResultClick("need", need.id)}
                      >
                        <p className="text-sm font-medium text-gray-900">{need.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {data.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Users
                  </h3>
                  <div className="space-y-2">
                    {data.users.map((user: UserProfile) => (
                      <button
                        type="button"
                        key={user.id}
                        className="cursor-pointer w-full text-left hover:bg-gray-50 p-2 rounded"
                        onClick={() => handleResultClick("user", user.id)}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {user.display_name}{" "}
                          <span className="text-gray-500 text-xs">@{user.username}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No results found for "{query}"</div>
          )}

          <button type="button"
            onClick={() => {
              setIsOpen(false);
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="w-full mt-4 p-2 text-center text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
          >
            View all results
          </button>
        </div>
      )}
    </div>
  );
};
