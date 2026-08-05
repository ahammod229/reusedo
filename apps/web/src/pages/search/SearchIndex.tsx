import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router";
import { GlobalSearch } from "../../components/search/GlobalSearch";
import { PersonalizedRecommendations } from "../../components/search/PersonalizedRecommendations";
import { RecentlyViewedCarousel } from "../../components/search/RecentlyViewedCarousel";
import { useGlobalSearch } from "../../hooks/useSearch";

export const SearchIndex = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useGlobalSearch({ q: query, limit: 10, offset: 0 });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>{query ? `Search: ${query} - Reusedo` : "Search & Discovery - Reusedo"}</title>
        <meta
          name="description"
          content="Discover products, needs, and users on the Reusedo platform."
        />
      </Helmet>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Search & Discovery</h1>
      </div>

      <div className="mb-12">
        <GlobalSearch />
      </div>

      {!query ? (
        <>
          <PersonalizedRecommendations />
          <RecentlyViewedCarousel />
        </>
      ) : (
        <div className="space-y-12">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Searching...</div>
          ) : data && data.totalCount > 0 ? (
            <>
              {/* Products Section */}
              {data.products.length > 0 && (
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-2xl font-bold">Products</h2>
                    <Link
                      to={`/search/products?q=${encodeURIComponent(query)}`}
                      className="text-primary hover:underline font-medium"
                    >
                      View all products
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {data.products.map((product) => (
                      <Link to={`/products/${product.id}`} key={product.id} className="block group">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
                        <h3 className="font-medium truncate group-hover:text-primary">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-500">{product.district}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Needs Section */}
              {data.needs.length > 0 && (
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-2xl font-bold">Need Requests</h2>
                    <Link
                      to={`/search/needs?q=${encodeURIComponent(query)}`}
                      className="text-primary hover:underline font-medium"
                    >
                      View all needs
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {data.needs.map((need) => (
                      <Link
                        to={`/needs/${need.id}`}
                        key={need.id}
                        className="block bg-white border p-4 rounded-lg hover:border-primary"
                      >
                        <h3 className="font-medium text-lg">{need.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          Deadline:{" "}
                          {need.deadline ? new Date(need.deadline).toLocaleDateString() : "None"}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Users Section */}
              {data.users.length > 0 && (
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-2xl font-bold">Users</h2>
                    <Link
                      to={`/search/users?q=${encodeURIComponent(query)}`}
                      className="text-primary hover:underline font-medium"
                    >
                      View all users
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.users.map((user) => (
                      <Link
                        to={`/users/${user.id}`}
                        key={user.id}
                        className="block bg-white border p-4 rounded-lg flex items-center space-x-4 hover:border-primary"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div>
                          <h3 className="font-medium">{user.display_name}</h3>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              <p className="text-xl font-medium text-gray-900 mb-2">
                No results found for "{query}"
              </p>
              <p>Try adjusting your search terms or exploring categories.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
