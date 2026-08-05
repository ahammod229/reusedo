import type { CreateNeedData, NeedRequest, UpdateNeedData } from "@reusedo/validation";
import { apiClient } from "../index";

export const NeedService = {
  getNeeds: async (filters?: { category_id?: string; district?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category_id) params.append("category_id", filters.category_id);
    if (filters?.district) params.append("district", filters.district);
    const { data } = await apiClient.get<NeedRequest[]>("/needs", { params: filters });
    return data;
  },

  getMyNeeds: async (status?: string) => {
    const { data } = await apiClient.get<NeedRequest[]>("/needs/me", { params: { status } });
    return data;
  },

  getNeedById: async (id: string) => {
    const { data } = await apiClient.get<NeedRequest>(`/needs/${id}`);
    return data;
  },

  createNeed: async (payload: CreateNeedData) => {
    const { data } = await apiClient.post<NeedRequest>("/needs", payload);
    return data;
  },

  updateNeed: async (id: string, payload: UpdateNeedData & { status?: string }) => {
    const { data } = await apiClient.patch<NeedRequest>(`/needs/${id}`, payload);
    return data;
  },

  deleteNeed: async (id: string) => {
    await apiClient.delete(`/needs/${id}`);
  },

  publishNeed: async (id: string) => {
    const { data } = await apiClient.post<NeedRequest>(`/needs/${id}/publish`);
    return data;
  },

  archiveNeed: async (id: string) => {
    const { data } = await apiClient.post<NeedRequest>(`/needs/${id}/archive`);
    return data;
  },
};
