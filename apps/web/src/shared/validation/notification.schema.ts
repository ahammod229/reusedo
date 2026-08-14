import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "info",
  "success",
  "warning",
  "error",
  "announcement",
]);

export const notificationPrioritySchema = z.enum(["low", "normal", "high", "critical"]);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: notificationTypeSchema,
  priority: notificationPrioritySchema,
  related_entity_type: z.string().nullable().optional(),
  related_entity_id: z.string().uuid().nullable().optional(),
  is_read: z.boolean(),
  is_archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const registerFCMTokenSchema = z.object({
  token: z.string().min(1),
  device_info: z.string().optional(),
});

export type RegisterFCMTokenData = z.infer<typeof registerFCMTokenSchema>;
