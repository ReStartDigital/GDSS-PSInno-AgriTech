import { DataSource } from "typeorm";
import { User } from "../database/entities/User.js";
import { AgentAssignment } from "../database/entities/AgentAssignment.js";
import { RefreshTokenEntity } from "../database/entities/RefreshToken.js";
import { PackagingOptionEntity } from "../database/entities/PackagingOptions.js";
import { ProduceListingEntity } from "../database/entities/ProduceListing.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url:
    process.env.DB_URL ??
    "postgres://vegelink:secret@localhost:5432/vegelink_dev",
  synchronize: false, // always false — migrations are the only source of schema truth
  logging: process.env.NODE_ENV !== "production",
  entities: [
    User,
    AgentAssignment,
    RefreshTokenEntity,
    PackagingOptionEntity,
    ProduceListingEntity,
  ],
  migrations: ["src/database/migrations/*.ts"],
});

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await AppDataSource.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
