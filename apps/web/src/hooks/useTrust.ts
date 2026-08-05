import { TrustService } from "@reusedo/api-client";
import type {
  CreateAppealData,
  CreateReportData,
  CreateReviewData,
  CreateVerificationData,
} from "@reusedo/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// --- Reviews ---
export const useReviews = (userId?: string) => {
  return useQuery({
    queryKey: ["reviews", userId],
    queryFn: () => TrustService.getReviews(userId as string),
    enabled: !!userId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ revieweeId, data }: { revieweeId: string; data: CreateReviewData }) =>
      TrustService.createReview(revieweeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.revieweeId] });
      queryClient.invalidateQueries({ queryKey: ["reputation", variables.revieweeId] });
      // Might also need to invalidate exchanges or profile depending on usage
    },
  });
};

// --- Verifications ---
export const useVerificationStatus = () => {
  return useQuery({
    queryKey: ["verification", "me"],
    queryFn: () => TrustService.getVerificationStatus(),
  });
};

export const useSubmitVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVerificationData) => TrustService.submitVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification", "me"] });
    },
  });
};

export const useUpdateVerificationStatus = () => {
  return useMutation({
    mutationFn: ({
      id,
      status,
      adminNotes,
    }: { id: string; status: "approved" | "rejected"; adminNotes?: string }) =>
      TrustService.updateVerificationStatus(id, status, adminNotes),
    onSuccess: () => {
      // Invalidate relevant queries (e.g. admin verification queue)
    },
  });
};

// --- Reports ---
export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => TrustService.getReports(),
  });
};

export const useSubmitReport = () => {
  return useMutation({
    mutationFn: (data: CreateReportData) => TrustService.submitReport(data),
  });
};

// --- Appeals ---
export const useSubmitAppeal = () => {
  return useMutation({
    mutationFn: (data: CreateAppealData) => TrustService.submitAppeal(data),
  });
};
