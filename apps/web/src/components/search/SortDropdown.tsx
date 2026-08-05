import type { SearchFilters } from "@reusedo/validation";
import type React from "react";

interface SortDropdownProps {
  value: SearchFilters["sortBy"];
  onChange: (sort: SearchFilters["sortBy"]) => void;
  options: { label: string; value: SearchFilters["sortBy"] }[];
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange, options }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      <select
        value={value || "newest"}
        onChange={(e) => onChange(e.target.value as SearchFilters["sortBy"])}
        className="border-none bg-transparent font-medium text-gray-900 focus:ring-0 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
