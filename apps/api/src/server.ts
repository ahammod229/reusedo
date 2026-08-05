import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import needRoutes from './routes/need.routes';
import exchangeRoutes from './routes/exchange.routes';
import chatRoutes from './routes/chat.routes';
import notificationRouter from "./routes/notification.routes";
import { searchRouter } from "./routes/search.routes";
import { reviewRoutes } from "./routes/review.routes";
import { verificationRoutes } from "./routes/verification.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { reportRoutes } from "./routes/report.routes";
import { appealRoutes } from "./routes/appeal.routes";
import { adminRouter } from "./routes/admin.routes";
import { shippingRouter } from "./routes/shipping.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/shipping', shippingRouter);


app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ready", (req: Request, res: Response) => {
  res.status(200).json({ status: "ready" });
});

app.get("/live", (req: Request, res: Response) => {
  res.status(200).json({ status: "live" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

export { app };
