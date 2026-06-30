import "reflect-metadata";
import "dotenv/config";

import { DataSource, type DataSourceOptions } from "typeorm";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
// 🛠️ Essential fix for ES Modules: __dirname does not exist natively in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseConfig = {
  type: "postgres" as const,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [join(__dirname, "entities", "**", "*.{ts,js}")],
  migrations: [join(__dirname, "migrations", "**", "*.{ts,js}")],
  subscribers: [],
};

const isLocal =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1");

const config = process.env.DB_URL
  ? {
      ...baseConfig,
      url: process.env.DB_URL,
      ...(!isLocal && {
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    }
  : {
      ...baseConfig,
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "agritech_db",
    };

// 🔑 Cast the configuration right here to keep TypeORM happy
export const AppDataSource = new DataSource(config as DataSourceOptions);
