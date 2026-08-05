import { z } from "zod";

export const verificationDocumentTypeSchema = z.enum(["national_id", "passport", "driving_license"]);
export const verificationStatusSchema = z.enum(["pending", "approved", "rejected", "expired"]);

export const reportEntityTypeSchema = z.enum(["product", "need", "user", "review", "message"]);
export const reportReasonSchema = z.enum(["spam", "fraud", "abuse", "fake_item", "inappropriate", "other"]);
export const reportStatusSchema = z.enum(["open", "investigating", "resolved", "dismissed"]);

export const appealTargetTypeSchema = z.enum(["verification", "report"]);
export const appealStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const createReviewSchema = z.object({
  exchangeId: z.string().uuid("Invalid exchange ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  positiveTags: z.array(z.string()).optional(),
  negativeTags: z.array(z.string()).optional(),
});

export type CreateReviewData = z.infer<typeof createReviewSchema>;

export const createVerificationSchema = z.object({
  documentType: verificationDocumentTypeSchema,
  documentFrontUrl: z.string().url("Must be a valid URL"),
  documentBackUrl: z.string().url("Must be a valid URL").optional(),
});

export type CreateVerificationData = z.infer<typeof createVerificationSchema>;

export const createReportSchema = z.object({
  entityType: reportEntityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
  reason: reportReasonSchema,
  description: z.string().optional(),
});

export type CreateReportData = z.infer<typeof createReportSchema>;

export const createAppealSchema = z.object({
  targetType: appealTargetTypeSchema,
  targetId: z.string().uuid("Invalid target ID"),
  description: z.string().min(10, "Appeal description must be at least 10 characters long"),
});

export type CreateAppealData = z.infer<typeof createAppealSchema>;

export interface Review {
  id: string;
  exchange_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  positive_tags: string[];
  negative_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: string;
  user_id: string;
  document_type: z.infer<typeof verificationDocumentTypeSchema>;
  document_front_url: string;
  document_back_url: string | null;
  status: z.infer<typeof verificationStatusSchema>;
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  entity_type: z.infer<typeof reportEntityTypeSchema>;
  entity_id: string;
  reason: z.infer<typeof reportReasonSchema>;
  description: string | null;
  status: z.infer<typeof reportStatusSchema>;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appeal {
  id: string;
  user_id: string;
  target_type: z.infer<typeof appealTargetTypeSchema>;
  target_id: string;
  description: string;
  status: z.infer<typeof appealStatusSchema>;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

