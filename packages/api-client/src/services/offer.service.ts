import type { Offer, SubmitOfferData } from "@reusedo/validation";
import { apiClient } from "../index";

export const OfferService = {
  submitOffer: async (needId: string, payload: SubmitOfferData) => {
    const { data } = await apiClient.post<Offer>(`/needs/${needId}/offers`, payload);
    return data;
  },

  getOffersForNeed: async (needId: string) => {
    const { data } = await apiClient.get<Offer[]>(`/needs/${needId}/offers`);
    return data;
  },

  getMyOffers: async () => {
    const { data } = await apiClient.get<Offer[]>("/needs/me/offers");
    return data;
  },

  acceptOffer: async (offerId: string) => {
    const { data } = await apiClient.post<Offer>(`/offers/${offerId}/accept`);
    return data;
  },

  rejectOffer: async (offerId: string) => {
    const { data } = await apiClient.post<Offer>(`/offers/${offerId}/reject`);
    return data;
  }
};
