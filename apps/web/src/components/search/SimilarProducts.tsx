import { useNavigate } from "react-router";
import { useSimilarProducts } from "../../hooks/useSearch";

interface SimilarProductsProps {
  productId: string;
  categoryId: string;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({ productId, categoryId }) => {
  const { data: similar, isLoading } = useSimilarProducts(productId, categoryId);
  const navigate = useNavigate();

  if (isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl mt-8" />;
  if (!similar || similar.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-xl font-bold mb-6">Similar Items You Might Like</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similar.map((product) => (
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
            <h4 className="font-medium text-gray-900 truncate">{product.title}</h4>
          </button>
        ))}
      </div>
    </div>
  );
};
