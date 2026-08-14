import type { AdminKpiSummary, PersonalAnalytics, UserDashboardSummary } from "@/shared/validation";
import { apiClient } from "../index";

export const AnalyticsService = {
  getUserDashboardSummary: async (): Promise<UserDashboardSummary> => {
    const response = await apiClient.get("/analytics/dashboard");
    return response.data;
  },
  getPersonalAnalytics: async (): Promise<PersonalAnalytics> => {
    const response = await apiClient.get("/analytics/personal");
    return response.data;
  },
  getAdminKpiSummary: async (): Promise<AdminKpiSummary> => {
    const response = await apiClient.get("/analytics/admin/kpi");
    return response.data;
  },
};
