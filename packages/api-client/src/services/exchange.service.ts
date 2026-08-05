import type { Exchange, ExchangeEvent, CreateExchangeData, CounterOfferData } from "@reusedo/validation";
import { apiClient } from "../index";

export const ExchangeService = {
  createExchange: async (data: CreateExchangeData): Promise<Exchange> => {
    const response = await apiClient.post<{ success: boolean; data: Exchange }>("/exchanges", data);
    return response.data.data;
  },

  getIncomingExchanges: async (): Promise<Exchange[]> => {
    const response = await apiClient.get<{ success: boolean; data: Exchange[] }>("/exchanges/incoming");
    return response.data.data;
  },

  getOutgoingExchanges: async (): Promise<Exchange[]> => {
    const response = await apiClient.get<{ success: boolean; data: Exchange[] }>("/exchanges/outgoing");
    return response.data.data;
  },

  getExchangeHistory: async (): Promise<Exchange[]> => {
    const response = await apiClient.get<{ success: boolean; data: Exchange[] }>("/exchanges/history");
    return response.data.data;
  },

  getExchangeById: async (id: string): Promise<Exchange> => {
    const response = await apiClient.get<{ success: boolean; data: Exchange }>(`/exchanges/${id}`);
    return response.data.data;
  },

  getExchangeEvents: async (id: string): Promise<ExchangeEvent[]> => {
    const response = await apiClient.get<{ success: boolean; data: ExchangeEvent[] }>(`/exchanges/${id}/events`);
    return response.data.data;
  },

  acceptExchange: async (id: string): Promise<Exchange> => {
    const response = await apiClient.post<{ success: boolean; data: Exchange }>(`/exchanges/${id}/accept`);
    return response.data.data;
  },

  rejectExchange: async (id: string): Promise<Exchange> => {
    const response = await apiClient.post<{ success: boolean; data: Exchange }>(`/exchanges/${id}/reject`);
    return response.data.data;
  },

  cancelExchange: async (id: string): Promise<Exchange> => {
    const response = await apiClient.post<{ success: boolean; data: Exchange }>(`/exchanges/${id}/cancel`);
    return response.data.data;
  },

  counterOffer: async (id: string, data: CounterOfferData): Promise<Exchange> => {
    const response = await apiClient.post<{ success: boolean; data: Exchange }>(`/exchanges/${id}/counter`, data);
    return response.data.data;
  }
};
