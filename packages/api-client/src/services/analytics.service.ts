import { apiClient } from "../index";
import type { UserDashboardSummary, PersonalAnalytics, AdminKpiSummary } from "@reusedo/validation";

export const AnalyticsService = {
  getUserDashboardSummary: async (): Promise<UserDashboardSummary> => {
    const response = await apiClient.get("/api/analytics/dashboard");
    return response.data;
  },
  getPersonalAnalytics: async (): Promise<PersonalAnalytics> => {
    const response = await apiClient.get("/api/analytics/personal");
    return response.data;
  },
  getAdminKpiSummary: async (): Promise<AdminKpiSummary> => {
    const response = await apiClient.get("/api/analytics/admin/kpi");
    return response.data;
  }
};
