import "dotenv/config";
import cron from "node-cron";
import { createApp } from "./app.js";
import { AppDataSource } from "./config/database.config.js";
import { logger } from "./common/utils/logger.js";

import { cleanupStaleUnverifiedRegistrations } from "./jobs/cleanup-unverified-registrations.job.js";

import * as dotenv from "dotenv";

dotenv.config();

// app.set("io", io);
const PORT = Number(process.env.PORT) || 3000;

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  logger.info("Database connection established");

  const app = createApp();

  app.listen(PORT, () => {
    logger.info(`VegeLink API listening on port ${PORT}`);
  });

  // Hourly cleanup of abandoned (unverified) registration attempts.
  cron.schedule("0 * * * *", () => {
    cleanupStaleUnverifiedRegistrations().catch((err) => {
      logger.error("cleanupStaleUnverifiedRegistrations job failed", {
        error: (err as Error).message,
      });
    });
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    await AppDataSource.destroy();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error("Fatal error during bootstrap", {
    error: (err as Error).message,
    stack: (err as Error).stack,
  });
  process.exit(1);
});
