import { Redis } from "ioredis";
import { redisConfig } from "../../config/redis.config.js";
import { logger } from "../../common/utils/logger.js";

class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(redisConfig.url, redisConfig);

    this.client.on("connect", () =>
      logger.info("Redis connection established successfully."),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client.on("error", (err: any) =>
      logger.error("Redis connection error:", err),
    );
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }
  // Add these inside your RedisService class in redis.client.ts

  public async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  public async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async call(command: string, ...args: string[]): Promise<any> {
    logger.info("Redis call: " + command);
    return this.client.call(command, ...args);
  }
  public async checkRedisHealth(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }
}

export const redisService = new RedisService();
