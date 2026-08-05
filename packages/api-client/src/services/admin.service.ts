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
};
