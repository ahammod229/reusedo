import { isAxiosError } from "axios";
import { apiClient } from "../index";
import type { 
  CreateReviewData, 
  CreateVerificationData, 
  CreateReportData, 
  CreateAppealData,
  Review,
  Verification,
  Report,
  Appeal
} from "@reusedo/validation";

export const TrustService = {
  // Reviews
  createReview: async (revieweeId: string, data: CreateReviewData): Promise<Review> => {
    const response = await apiClient.post(`/reviews/${revieweeId}`, data);
    return response.data;
  },

  getReviews: async (userId: string): Promise<Review[]> => {
    const response = await apiClient.get(`/reviews/${userId}`);
    return response.data;
  },

  // Verifications
  submitVerification: async (data: CreateVerificationData): Promise<Verification> => {
    const response = await apiClient.post("/verifications", data);
    return response.data;
  },

  getVerificationStatus: async (): Promise<Verification | null> => {
    try {
      const response = await apiClient.get("/verifications/me");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  updateVerificationStatus: async (verificationId: string, status: "approved" | "rejected", adminNotes?: string): Promise<Verification> => {
    const response = await apiClient.patch(`/verifications/${verificationId}/status`, { status, adminNotes });
    return response.data;
  },

  // Reports
  submitReport: async (data: CreateReportData): Promise<Report> => {
    const response = await apiClient.post("/reports", data);
    return response.data;
  },

  getReports: async (): Promise<Report[]> => {
    const response = await apiClient.get("/reports");
    return response.data;
  },

  // Appeals
  submitAppeal: async (data: CreateAppealData): Promise<Appeal> => {
    const response = await apiClient.post("/appeals", data);
    return response.data;
  }
};
