import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Mobile operators in Bangladesh put many people behind one shared IP (CGNAT), so
// per-IP limits are only a loose backstop. Abuse-prone endpoints are limited per
// signed-in person instead (userLimit, used after requireAuth).

const base = (windowMin: number, max: number) => ({
  windowMs: windowMin * 60 * 1000,
  limit: max,
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  // Integration tests send every request from one address.
  skip: () => process.env.NODE_ENV === "test",
  message: {
    success: false,
    code: "rate_limited",
    message: "Too many requests, please slow down.",
  },
});

export const ipLimit = (windowMin: number, max: number) => rateLimit(base(windowMin, max));

export const userLimit = (windowMin: number, max: number) =>
  rateLimit({
    ...base(windowMin, max),
    keyGenerator: (req) => req.user?.uid ?? ipKeyGenerator(req.ip ?? ""),
  });
