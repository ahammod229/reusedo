import { NotificationRepository } from "../database";
import { registerFCMTokenSchema } from "../shared/validation";
import { type NextFunction, type Request, type Response, Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const notificationRepo = new NotificationRepository();

// Get paginated notifications
router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.profile) return res.status(401).json({ error: "Unauthorized" });

    const limit = Number.parseInt(req.query.limit as string) || 20;
    const offset = Number.parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string | undefined;
    const is_read = req.query.is_read ? req.query.is_read === "true" : undefined;

    const result = await notificationRepo.getNotifications(user.profile.id, {
      limit,
      offset,
      type,
      is_read,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get("/count", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.profile) return res.status(401).json({ error: "Unauthorized" });

    const count = await notificationRepo.getUnreadCount(user.profile.id);
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post("/read-all", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.profile) return res.status(401).json({ error: "Unauthorized" });

    await notificationRepo.markAllAsRead(user.profile.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Mark specific notification as read
router.patch("/:id/read", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.profile) return res.status(401).json({ error: "Unauthorized" });

    const notification = await notificationRepo.markAsRead(user.profile.id, req.params.id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.profile) return res.status(401).json({ error: "Unauthorized" });

    await notificationRepo.deleteNotification(user.profile.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Register FCM Token
router.post("/fcm-token", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.profile) return res.status(401).json({ error: "Unauthorized" });

    const parseResult = registerFCMTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation error", details: parseResult.error.format() });
      return;
    }

    await notificationRepo.registerFCMToken(
      user.profile.id,
      parseResult.data.token,
      parseResult.data.device_info,
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
