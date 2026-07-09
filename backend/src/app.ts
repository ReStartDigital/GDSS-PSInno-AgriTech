import express from "express";
import { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import morganMiddleware from "./common/middleware/morgan.middleware.js";

import { requestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { generalRateLimiter } from "./common/middleware/rate-limit.middleware.js";
import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from "./common/middleware/error-handler.middleware.js";
import { checkDatabaseHealth } from "./config/database.config.js";
import { redisService } from "./infrastructure/redis/redis.client.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { usersRouter } from "./features/user/users.router.js";
import { listingsRouter } from "./features/listings/listings.router.js";
import { ordersRouter } from "./features/orders/orders.router.js";
import { ratingsRouter } from "./features/ratings/ratings.routes.js";
import { transportRouter } from "./features/transport/transport.routes.js";

const API_PREFIX = process.env.API_PREFIX || "/api/v1";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(cookieParser()); // Register cookie-parser

  app.use(morganMiddleware);

  // 1. Professional CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [];

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // ALLOW REQUEST WITH NO ORIGIN (e.g. mobile apps, postman, curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin);
        const isVercel = origin.endsWith(".vercel.app");

        if (isAllowed || isVercel) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    }),
  );

  app.use(generalRateLimiter);

  // 2. Swagger Documentation Route
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ── Health check (public, used by Docker/Render) ────────────────────────
  app.get(`${API_PREFIX}/health`, async (_req, res) => {
    const [dbOk, redisOk] = await Promise.all([
      checkDatabaseHealth(),
      redisService.checkRedisHealth(),
    ]);
    const healthy = dbOk && redisOk;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      db: dbOk ? "connected" : "error",
      redis: redisOk ? "connected" : "error",
      timestamp: new Date().toISOString(),
    });
  });

  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/users`, usersRouter);
  app.use(`${API_PREFIX}/listings`, listingsRouter);
  app.use(`${API_PREFIX}/orders`, ordersRouter);
  app.use(`${API_PREFIX}/ratings`, ratingsRouter);
  app.use(`${API_PREFIX}/transport`, transportRouter);

  // ── 404 + global error handler (must be registered last, in this order) ──
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
