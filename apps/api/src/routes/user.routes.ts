import { AddressRepository, SettingsRepository, UserRepository } from "../database";
import {
  addressSchema,
  updateAddressSchema,
  updateNotificationPreferencesSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
} from "../shared/validation";
import { type NextFunction, type Request, type Response, Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const userRepo = UserRepository;
const addressRepo = new AddressRepository();
const settingsRepo = new SettingsRepository();

// Get current user profile
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const profile = await userRepo.getProfileByUid(user.uid);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Update current user profile
router.patch("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const profile = await userRepo.getProfileByUid(user.uid);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Validation error", details: parseResult.error.format() });
      return;
    }

    const updated = await userRepo.updateProfile(profile.id, parseResult.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get user addresses
router.get(
  "/me/addresses",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const addresses = await addressRepo.getUserAddresses(profile.id);
      res.json(addresses);
    } catch (error) {
      next(error);
    }
  },
);

// Add user address
router.post(
  "/me/addresses",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const parseResult = addressSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Validation error", details: parseResult.error.format() });
        return;
      }

      const address = await addressRepo.createAddress({
        ...parseResult.data,
        user_id: profile.id,
        landmark: parseResult.data.landmark ?? null,
      });
      res.status(201).json(address);
    } catch (error) {
      next(error);
    }
  },
);

// Update user address
router.put(
  "/me/addresses/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const parseResult = updateAddressSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Validation error", details: parseResult.error.format() });
        return;
      }

      const address = await addressRepo.updateAddress(req.params.id, profile.id, parseResult.data);
      res.json(address);
    } catch (error) {
      next(error);
    }
  },
);

// Delete user address
router.delete(
  "/me/addresses/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      await addressRepo.deleteAddress(req.params.id, profile.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

// Get user settings
router.get("/me/settings", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const profile = await userRepo.getProfileByUid(user.uid);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const settings = await settingsRepo.getUserSettings(profile.id);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update user settings
router.patch(
  "/me/settings",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const parseResult = updateUserSettingsSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Validation error", details: parseResult.error.format() });
        return;
      }

      const settings = await settingsRepo.updateUserSettings(profile.id, parseResult.data);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  },
);

// Get user notifications preferences
router.get(
  "/me/notifications",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const prefs = await settingsRepo.getNotificationPreferences(profile.id);
      res.json(prefs);
    } catch (error) {
      next(error);
    }
  },
);

// Update user notifications preferences
router.patch(
  "/me/notifications",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await userRepo.getProfileByUid(user.uid);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const parseResult = updateNotificationPreferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Validation error", details: parseResult.error.format() });
        return;
      }

      const prefs = await settingsRepo.updateNotificationPreferences(profile.id, parseResult.data);
      res.json(prefs);
    } catch (error) {
      next(error);
    }
  },
);

// Get public profile by username
router.get("/:username", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userRepo.getProfileByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Filter private fields based on settings (Mock logic, real implementation should join settings)
    const settings = await settingsRepo.getUserSettings(profile.id);

    if (!settings.public_profile_visibility) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const publicProfile = {
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      cover_url: profile.cover_url,
      bio: profile.bio,
      join_date: profile.join_date,
      is_verified: profile.is_verified,
      // Conditionally reveal fields
      email: settings.show_email ? profile.email : undefined,
      phone_number: settings.show_phone ? profile.phone_number : undefined,
      location: settings.show_location
        ? { district: profile.district, upazila: profile.upazila }
        : undefined,
    };

    res.json(publicProfile);
  } catch (error) {
    next(error);
  }
});

export default router;
