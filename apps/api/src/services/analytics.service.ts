import { AnalyticsRepository } from "@reusedo/database";

export const AnalyticsService = {
  async getUserDashboardSummary(userId: string) {
    return AnalyticsRepository.getUserDashboardSummary(userId);
  },

  async getPersonalAnalytics(userId: string) {
    return AnalyticsRepository.getPersonalAnalytics(userId);
  },

  async getAdminKpiSummary() {
    return AnalyticsRepository.getAdminKpiSummary();
  }
};
