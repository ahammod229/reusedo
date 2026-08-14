import { apiClient } from "../index";

export const AdminService = {
  async getUsers(page: number, search: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) query.append("search", search);

    const { data } = await apiClient.get(`/admin/users?${query.toString()}`);
    return data;
  },

  async updateUserRole(userId: string, role: string | null) {
    const { data } = await apiClient.patch(`/admin/users/${userId}/role`, { role });
    return data;
  },

  async getProducts(page: number, search: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) query.append("search", search);

    const { data } = await apiClient.get(`/admin/products?${query.toString()}`);
    return data;
  },

  async updateProductStatus(productId: string, status: string) {
    const { data } = await apiClient.patch(`/admin/products/${productId}/status`, { status });
    return data;
  },

  async deleteProduct(productId: string) {
    const { data } = await apiClient.delete(`/admin/products/${productId}`);
    return data;
  },

  async getNeeds(page: number, search: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) query.append("search", search);

    const { data } = await apiClient.get(`/admin/needs?${query.toString()}`);
    return data;
  },

  async updateNeedStatus(needId: string, status: string) {
    const { data } = await apiClient.patch(`/admin/needs/${needId}/status`, { status });
    return data;
  },

  async deleteNeed(needId: string) {
    const { data } = await apiClient.delete(`/admin/needs/${needId}`);
    return data;
  },

  async getExchanges(page: number, search: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) query.append("search", search);

    const { data } = await apiClient.get(`/admin/exchanges?${query.toString()}`);
    return data;
  },

  async updateExchangeStatus(exchangeId: string, status: string) {
    const { data } = await apiClient.patch(`/admin/exchanges/${exchangeId}/status`, { status });
    return data;
  },

  async getShipments(page: number, search: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) query.append("search", search);

    const { data } = await apiClient.get(`/admin/shipments?${query.toString()}`);
    return data;
  },

  async updateShipmentStatus(shipmentId: string, status: string) {
    const { data } = await apiClient.patch(`/admin/shipments/${shipmentId}/status`, { status });
    return data;
  },
};
