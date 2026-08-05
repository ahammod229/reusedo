import { useNavigate } from "react-router";
import { useRecommendations } from "../../hooks/useSearch";

export const PersonalizedRecommendations = () => {
  const { data: recommendations, isLoading } = useRecommendations();
  const navigate = useNavigate();

  if (isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recommendations.map((product) => (
          <button
            type="button"
            key={product.id}
            onClick={() => navigate(`/products/${product.id}`)}
            className="cursor-pointer text-left group"
          >
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
              {product.images?.[0] ? (
                <img
                  loading="lazy"
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
            <p className="text-sm text-gray-500 truncate">{product.district}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
