import { logger } from "../common/utils/logger.js";
export const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  maxRetriesPerRequest: null, // Critical for BullMQ compatibility
  enableReadyCheck: true,
  reconnectOnError: (err: Error) => {
    // Evaluate if connection loss warrants an immediate retry
    logger.error(err);
    return true;
  },
};
