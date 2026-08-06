import { apiClient } from "../index";
import type { 
  SavedSearch,
  CreateSavedSearchData,
  RecentlyViewed,
  SearchFilters,
  LogSearchAnalyticsData,
  Product,
  NeedRequest as Need,
  UserProfile
} from "@reusedo/validation";

export interface SearchResults {
  products: Product[];
  needs: Need[];
  users: UserProfile[];
  totalCount: number;
}

export const SearchService = {
  getGlobalSearch: async (filters: SearchFilters): Promise<SearchResults> => {
    const response = await apiClient.get("/search", { params: filters });
    return response.data;
  },

  searchProducts: async (filters: SearchFilters): Promise<{ data: Product[], count: number }> => {
    const response = await apiClient.get("/search/products", { params: filters });
    return response.data;
  },

  searchNeeds: async (filters: SearchFilters): Promise<{ data: Need[], count: number }> => {
    const response = await apiClient.get("/search/needs", { params: filters });
    return response.data;
  },

  searchUsers: async (filters: SearchFilters): Promise<{ data: UserProfile[], count: number }> => {
    const response = await apiClient.get("/search/users", { params: filters });
    return response.data;
  },

  // Saved Searches
  saveSearch: async (data: CreateSavedSearchData): Promise<SavedSearch> => {
    const response = await apiClient.post("/search/saved", data);
    return response.data;
  },

  getSavedSearches: async (): Promise<SavedSearch[]> => {
    const response = await apiClient.get("/search/saved");
    return response.data;
  },

  deleteSavedSearch: async (id: string): Promise<void> => {
    await apiClient.delete(`/search/saved/${id}`);
  },

  // Recently Viewed
  logRecentlyViewed: async (item_type: 'product' | 'need' | 'user', item_id: string): Promise<void> => {
    await apiClient.post("/search/recently-viewed", { item_type, item_id });
  },

  getRecentlyViewed: async (): Promise<RecentlyViewed[]> => {
    const response = await apiClient.get("/search/recently-viewed");
    return response.data;
  },

  // Recommendations
  getRecommendations: async (): Promise<Product[]> => {
    const response = await apiClient.get("/search/recommendations");
    return response.data;
  },

  getSimilarProducts: async (productId: string, categoryId: string): Promise<Product[]> => {
    const response = await apiClient.get(`/search/similar/products/${productId}`, { params: { categoryId } });
    return response.data;
  },

  // Analytics
  logSearchAnalytics: async (data: LogSearchAnalyticsData): Promise<void> => {
    await apiClient.post("/search/analytics", data);
  }
};
