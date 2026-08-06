import { AdminRepository } from "@reusedo/database";
import type { AdminRole, CMSPageData, FeatureFlagData } from "@reusedo/validation";

export const AdminService = {
  // Users
  async getUsers(page: number, limit: number, search?: string) {
    return await AdminRepository.getUsers(page, limit, search);
  },

  async getProducts(page: number, limit: number, search?: string) {
    return await AdminRepository.getProducts(page, limit, search);
  },

  async updateProductStatus(adminId: string, productId: string, status: string) {
    return await AdminRepository.updateProductStatus(productId, status, adminId);
  },

  async deleteProduct(adminId: string, productId: string) {
    return await AdminRepository.deleteProduct(productId, adminId);
  },

  async getNeeds(page: number, limit: number, search?: string) {
    return await AdminRepository.getNeeds(page, limit, search);
  },

  async updateNeedStatus(adminId: string, needId: string, status: string) {
    return await AdminRepository.updateNeedStatus(needId, status, adminId);
  },

  async deleteNeed(adminId: string, needId: string) {
    return await AdminRepository.deleteNeed(needId, adminId);
  },

  async getExchanges(page: number, limit: number, search?: string) {
    return await AdminRepository.getExchanges(page, limit, search);
  },

  async updateExchangeStatus(adminId: string, exchangeId: string, status: string) {
    return await AdminRepository.updateExchangeStatus(exchangeId, status, adminId);
  },

  async getShipments(page: number, limit: number, search?: string) {
    return await AdminRepository.getShipments(page, limit, search);
  },

  async updateShipmentStatus(adminId: string, shipmentId: string, status: string) {
    return await AdminRepository.updateShipmentStatus(shipmentId, status, adminId);
  },

  async updateUserRole(adminId: string, targetUserId: string, role: AdminRole | null) {
    const previous = null; // Normally we'd fetch previous state, skipping for simplicity
    const updated = await AdminRepository.updateUserRole(targetUserId, role);

    await AdminRepository.createAuditLog(
      adminId,
      "UPDATE_USER_ROLE",
      "profile",
      targetUserId,
      { role: previous },
      { role },
    );
    return updated;
  },

  // Audit Logs
  async getAuditLogs(page: number, limit: number) {
    return await AdminRepository.getAuditLogs(page, limit);
  },

  // CMS
  async getCMSPages() {
    return await AdminRepository.getCMSPages();
  },

  async createCMSPage(adminId: string, pageData: Partial<CMSPageData>) {
    const created = await AdminRepository.createCMSPage({ ...pageData, author_id: adminId });
    await AdminRepository.createAuditLog(
      adminId,
      "CREATE_CMS_PAGE",
      "cms_page",
      created.id,
      null,
      created,
    );
    return created;
  },

  async updateCMSPage(adminId: string, slug: string, pageData: Partial<CMSPageData>) {
    const updated = await AdminRepository.updateCMSPage(slug, pageData);
    await AdminRepository.createAuditLog(
      adminId,
      "UPDATE_CMS_PAGE",
      "cms_page",
      updated.id,
      null,
      updated,
    );
    return updated;
  },

  // Settings
  async getPlatformSettings() {
    return await AdminRepository.getPlatformSettings();
  },

  async updatePlatformSetting(adminId: string, key: string, value: unknown) {
    const updated = await AdminRepository.updatePlatformSetting(key, value, adminId);
    await AdminRepository.createAuditLog(adminId, "UPDATE_SETTING", "platform_setting", key, null, {
      value,
    });
    return updated;
  },

  // Feature Flags
  async getFeatureFlags() {
    return await AdminRepository.getFeatureFlags();
  },

  async updateFeatureFlag(adminId: string, key: string, updates: Partial<FeatureFlagData>) {
    const updated = await AdminRepository.updateFeatureFlag(key, updates, adminId);
    await AdminRepository.createAuditLog(
      adminId,
      "UPDATE_FEATURE_FLAG",
      "feature_flag",
      key,
      null,
      updates,
    );
    return updated;
  },

  // Dashboard Metrics
  async getDashboardMetrics() {
    return await AdminRepository.getDashboardMetrics();
  },
};
