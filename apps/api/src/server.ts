import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { errorHandler } from "./lib/http";
import { ipLimit } from "./lib/limits";
import { adminRouter } from "./routes/admin.routes";
import { adsRouter } from "./routes/ads.routes";
import { aiRouter } from "./routes/ai.routes";
import authRoutes from "./routes/auth.routes";
import { chatRouter } from "./routes/chat.routes";
import { courierRouter } from "./routes/courier.routes";
import { exchangeRouter } from "./routes/exchange.routes";
import { homeRouter } from "./routes/home.routes";
import { notificationRouter } from "./routes/notification.routes";
import { postRouter } from "./routes/post.routes";
import { reportRouter } from "./routes/report.routes";
import { userRouter } from "./routes/user.routes";
import { webhookRouter } from "./routes/webhook.routes";

const app = express();

// Behind Render/Firebase proxies: needed so rate limits see the real client IP.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  ...(process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://localhost:5174"]),
].filter(Boolean);

class CorsError extends Error {}

// On Vercel the web app and API share one domain, so the site's own origin is always allowed.
const isSameOrigin = (origin: string, host: string | undefined) =>
  !!host && (origin === `https://${host}` || origin === `http://${host}`);

app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    const ok = !origin || allowedOrigins.includes(origin) || isSameOrigin(origin, req.headers.host);
    if (ok)
      callback(null, {
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      });
    else callback(new CorsError("Origin not allowed"));
  }),
);

// Small JSON bodies only; uploads go through multer with its own limits.
app.use(express.json({ limit: "100kb" }));

// Per-IP backstops only (shared mobile IPs); per-person limits sit on the routes.
app.use("/api", ipLimit(15, 3000));
app.use("/api/auth", ipLimit(15, 300));
app.use("/api/ai", ipLimit(15, 100));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", postRouter); // /feed, /posts/*
app.use("/api", homeRouter); // /categories, /stats/donation-map, /me/dashboard
app.use("/api/users", userRouter);
app.use("/api/exchanges", exchangeRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/reports", reportRouter);
app.use("/api/courier", courierRouter);
app.use("/api", adsRouter); // /ads, /payments/config
app.use("/api/ai", aiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/webhooks", webhookRouter);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ready", (req: Request, res: Response) => {
  res.status(200).json({ status: "ready" });
});

app.get("/live", (req: Request, res: Response) => {
  res.status(200).json({ status: "live" });
});

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ success: false, code: "not_found", message: "No such endpoint" });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CorsError) {
    return res.status(403).json({ success: false, code: "cors", message: "Origin not allowed" });
  }
  errorHandler(err, req, res, next);
});

export { app };
