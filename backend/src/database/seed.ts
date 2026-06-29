import { AppDataSource } from "./data-source.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import logger from "../common/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // 📥 Get the target name passed from the CLI (e.g., "user" or "agent_assignment")
  const target = process.argv[2];

  if (!target) {
    logger.error(
      "❌ Please specify a seed target. Example: npm run db:seed user",
    );
    process.exit(1);
  }

  // Construct the expected file path dynamically
  const seedFilePath = join(__dirname, "seeds", `${target}.seed.ts`);

  try {
    logger.info(`🌱 Importing seed processor from: ${target}.seed.ts`);

    // 🔑 Dynamically import the matching file on the fly
    const seedModule = await import(`file://${seedFilePath}`);

    if (typeof seedModule.run !== "function") {
      throw new Error(
        `The seed file '${target}.seed.ts' must export a 'run' function.`,
      );
    }

    logger.info("🔌 Connecting to the database...");
    await AppDataSource.initialize();

    // Run the isolated seed logic passing the shared datasource
    await seedModule.run(AppDataSource);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error(
      `❌ Seeding failed for target [${target}]:` + error.message || error,
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("🔌 Database connection closed cleanly.");
    }
  }
}

main();
