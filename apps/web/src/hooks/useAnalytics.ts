import { AnalyticsService } from "@reusedo/api-client";
import { useQuery } from "@tanstack/react-query";

export const useUserDashboardSummary = () => {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => AnalyticsService.getUserDashboardSummary(),
  });
};

export const usePersonalAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "personal"],
    queryFn: () => AnalyticsService.getPersonalAnalytics(),
  });
};

export const useAdminKpiSummary = () => {
  return useQuery({
    queryKey: ["analytics", "admin", "kpi"],
    queryFn: () => AnalyticsService.getAdminKpiSummary(),
  });
};
