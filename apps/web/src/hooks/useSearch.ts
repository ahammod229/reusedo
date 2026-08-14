import { SearchService } from "@/services/api";
import type {
  CreateSavedSearchData,
  LogSearchAnalyticsData,
  SearchFilters,
} from "@/shared/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGlobalSearch = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ["search", "global", filters],
    queryFn: () => SearchService.getGlobalSearch(filters),
    enabled: !!filters.q || !!filters.category,
    staleTime: 60 * 1000,
  });
};

export const useSearchProducts = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ["search", "products", filters],
    queryFn: () => SearchService.searchProducts(filters),
  });
};

export const useSearchNeeds = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ["search", "needs", filters],
    queryFn: () => SearchService.searchNeeds(filters),
  });
};

export const useSearchUsers = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ["search", "users", filters],
    queryFn: () => SearchService.searchUsers(filters),
  });
};

// Saved Searches
export const useSavedSearches = () => {
  return useQuery({
    queryKey: ["search", "saved"],
    queryFn: () => SearchService.getSavedSearches(),
  });
};

export const useSaveSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavedSearchData) => SearchService.saveSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    },
  });
};

export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SearchService.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    },
  });
};

// Recently Viewed
export const useRecentlyViewed = () => {
  return useQuery({
    queryKey: ["search", "recently-viewed"],
    queryFn: () => SearchService.getRecentlyViewed(),
  });
};

export const useLogRecentlyViewed = () => {
  return useMutation({
    mutationFn: ({ type, id }: { type: "product" | "need" | "user"; id: string }) =>
      SearchService.logRecentlyViewed(type, id),
  });
};

// Recommendations
export const useRecommendations = () => {
  return useQuery({
    queryKey: ["search", "recommendations"],
    queryFn: () => SearchService.getRecommendations(),
  });
};

export const useSimilarProducts = (productId: string, categoryId: string) => {
  return useQuery({
    queryKey: ["search", "similar", productId],
    queryFn: () => SearchService.getSimilarProducts(productId, categoryId),
    enabled: !!productId && !!categoryId,
  });
};

// Analytics
export const useLogSearchAnalytics = () => {
  return useMutation({
    mutationFn: (data: LogSearchAnalyticsData) => SearchService.logSearchAnalytics(data),
  });
};
