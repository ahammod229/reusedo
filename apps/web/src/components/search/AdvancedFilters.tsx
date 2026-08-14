import type { SearchFilters } from "@/shared/validation";
import type React from "react";

interface AdvancedFiltersProps {
  type: "products" | "needs" | "users";
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ type, filters, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type: inputType, checked } = e.target as HTMLInputElement;
    onChange({
      ...filters,
      [name]: inputType === "checkbox" ? checked : value || undefined,
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        {/* Category */}
        {(type === "products" || type === "needs") && (
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={filters.category || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">All Categories</option>
              {/* These would normally come from an API */}
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
            </select>
          </div>
        )}

        {/* Location */}
        {(type === "products" || type === "needs") && (
          <div className="mb-4">
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
              District
            </label>
            <select
              name="district"
              value={filters.district || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">All Districts</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Sylhet">Sylhet</option>
            </select>
          </div>
        )}

        {/* Condition - Products Only */}
        {type === "products" && (
          <div className="mb-4">
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              name="condition"
              value={filters.condition || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Any Condition</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        )}

        {/* Urgency - Needs Only */}
        {type === "needs" && (
          <div className="mb-4">
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              name="urgency"
              value={filters.urgency || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Any Urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        )}

        {/* Users Only */}
        {type === "users" && (
          <div className="mb-4">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="verified"
                checked={!!filters.verified}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <span>Verified Users Only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
