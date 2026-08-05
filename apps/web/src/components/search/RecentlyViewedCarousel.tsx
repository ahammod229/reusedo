import { useNavigate } from "react-router";
import { useRecentlyViewed } from "../../hooks/useSearch";

export const RecentlyViewedCarousel = () => {
  const { data: viewed, isLoading } = useRecentlyViewed();
  const navigate = useNavigate();

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  if (!viewed || viewed.length === 0) return null;

  return (
    <div className="py-6 border-t mt-8">
      <h2 className="text-xl font-bold mb-4">Recently Viewed</h2>
      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
        {viewed.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => navigate(`/${item.item_type}s/${item.item_id}`)}
            className="flex-none w-48 text-left bg-white border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors"
          >
            <div className="text-xs text-primary mb-1 uppercase font-semibold">
              {item.item_type}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              ID: {item.item_id.substring(0, 8)}...
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(item.viewed_at).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
