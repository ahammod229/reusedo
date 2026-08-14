import { getSupabaseClient } from "../client";
import type { 
  CreateReviewData, 
  CreateVerificationData, 
  CreateReportData, 
  CreateAppealData 
} from "../../shared/validation";

const getClient = (useServiceRole = false) => getSupabaseClient(useServiceRole);

export const TrustRepository = {
  // Reviews
  async createReview(reviewerId: string, revieweeId: string, data: CreateReviewData) {
    const supabase = getClient(true);
    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        exchange_id: data.exchangeId,
        rating: data.rating,
        comment: data.comment,
        positive_tags: data.positiveTags || [],
        negative_tags: data.negativeTags || [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }
    return review;
  },

  async getReviewsForUser(userId: string) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*, reviewer:reviewer_id(*)")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
    return data;
  },

  // Verifications
  async createVerification(userId: string, data: CreateVerificationData) {
    const supabase = getClient();
    const { data: verification, error } = await supabase
      .from("verifications")
      .upsert({
        user_id: userId,
        document_type: data.documentType,
        document_front_url: data.documentFrontUrl,
        document_back_url: data.documentBackUrl,
        status: "pending",
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit verification: ${error.message}`);
    }
    return verification;
  },

  async getVerification(userId: string) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("verifications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch verification: ${error.message}`);
    }
    return data;
  },

  async updateVerificationStatus(verificationId: string, status: "approved" | "rejected", adminNotes?: string) {
    const supabase = getClient(true);
    const { data, error } = await supabase
      .from("verifications")
      .update({ status, admin_notes: adminNotes })
      .eq("id", verificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update verification status: ${error.message}`);
    }
    return data;
  },

  // Profile Trust Updates
  async updateProfileTrustScore(userId: string, newAverage: number, totalReviews: number, newScore: number) {
    const supabase = getClient(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        average_rating: newAverage,
        total_reviews: totalReviews,
        trust_score: newScore,
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update profile trust score: ${error.message}`);
    }
  },

  async setProfileVerified(userId: string, isVerified: boolean) {
    const supabase = getClient(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: isVerified })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update profile verified status: ${error.message}`);
    }
  },

  // Reports
  async createReport(reporterId: string, data: CreateReportData) {
    const supabase = getClient();
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: reporterId,
        entity_type: data.entityType,
        entity_id: data.entityId,
        reason: data.reason,
        description: data.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }
    return report;
  },

  async getReports() {
    const supabase = getClient(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*, reporter:reporter_id(*)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }
    return data;
  },

  // Appeals
  async createAppeal(userId: string, data: CreateAppealData) {
    const supabase = getClient();
    const { data: appeal, error } = await supabase
      .from("appeals")
      .insert({
        user_id: userId,
        target_type: data.targetType,
        target_id: data.targetId,
        description: data.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appeal: ${error.message}`);
    }
    return appeal;
  }
};

