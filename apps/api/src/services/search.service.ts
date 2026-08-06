import { SearchRepository } from "@reusedo/database";
import type {
  CreateSavedSearchData,
  LogSearchAnalyticsData,
  SearchFilters,
} from "@reusedo/validation";

export const SearchService = {
  async searchProducts(filters: SearchFilters) {
    return SearchRepository.searchProducts(filters);
  },

  async searchNeeds(filters: SearchFilters) {
    return SearchRepository.searchNeeds(filters);
  },

  async searchUsers(filters: SearchFilters) {
    return SearchRepository.searchUsers(filters);
  },

  async getGlobalSearch(filters: SearchFilters) {
    // For global search, we fetch a few of each category and return them combined
    // Usually limit is small, e.g. 5 for instant autocomplete
    const customFilters = { ...filters, limit: filters.limit || 5 };
    const [products, needs, users] = await Promise.all([
      SearchRepository.searchProducts(customFilters),
      SearchRepository.searchNeeds(customFilters),
      SearchRepository.searchUsers(customFilters),
    ]);

    return {
      products: products.data,
      needs: needs.data,
      users: users.data,
      totalCount: products.count + needs.count + users.count,
    };
  },

  // Saved Searches
  async saveSearch(userId: string, data: CreateSavedSearchData) {
    return SearchRepository.saveSearch(userId, data);
  },

  async getSavedSearches(userId: string) {
    return SearchRepository.getSavedSearches(userId);
  },

  async deleteSavedSearch(id: string, userId: string) {
    return SearchRepository.deleteSavedSearch(id, userId);
  },

  // Recently Viewed
  async logRecentlyViewed(userId: string, itemType: string, itemId: string) {
    return SearchRepository.logRecentlyViewed(userId, itemType, itemId);
  },

  async getRecentlyViewed(userId: string) {
    return SearchRepository.getRecentlyViewed(userId);
  },

  // Recommendations
  async getRecommendations(userId: string) {
    return SearchRepository.getRecommendedProducts(userId);
  },

  async getSimilarProducts(productId: string, categoryId: string) {
    return SearchRepository.getSimilarProducts(productId, categoryId);
  },

  // Analytics
  async logSearchAnalytics(userId: string | null, data: LogSearchAnalyticsData) {
    // TODO: implement actual analytics DB logging here via repository
    // SearchRepository.logSearchAnalytics(userId, data);
    return { success: true };
  },
};
