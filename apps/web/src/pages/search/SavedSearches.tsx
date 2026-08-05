import { useNavigate } from "react-router";
import { useDeleteSavedSearch, useSavedSearches } from "../../hooks/useSearch";

interface SavedSearch {
  id: string;
  name: string;
  type: string;
  query?: string;
  filters?: Record<string, unknown>;
}

export const SavedSearches = () => {
  const { data, isLoading } = useSavedSearches();
  const deleteSearch = useDeleteSavedSearch();
  const navigate = useNavigate();

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.query) params.set("q", search.query);
    if (search.filters) {
      for (const [k, v] of Object.entries(search.filters)) {
        if (v !== undefined && v !== null && k !== "q") {
          params.set(k, v.toString());
        }
      }
    }

    if (search.type === "products") navigate(`/search/products?${params.toString()}`);
    else if (search.type === "needs") navigate(`/search/needs?${params.toString()}`);
    else if (search.type === "users") navigate(`/search/users?${params.toString()}`);
    else navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Saved Searches</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((search) => (
            <div
              key={search.id}
              className="bg-white border rounded-lg p-5 flex justify-between items-center hover:shadow-sm transition-shadow"
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{search.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Type: <span className="capitalize">{search.type}</span>
                  {search.query && ` • Query: "${search.query}"`}
                </p>
              </div>
              <div className="flex space-x-3">
                <button type="button"
                  onClick={() => handleRunSearch(search)}
                  className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-md hover:bg-primary/20 transition-colors"
                >
                  Run Search
                </button>
                <button type="button"
                  onClick={() => deleteSearch.mutate(search.id)}
                  disabled={deleteSearch.isPending}
                  className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed">
          <p className="text-gray-500 font-medium">You haven't saved any searches yet.</p>
        </div>
      )}
    </div>
  );
};
