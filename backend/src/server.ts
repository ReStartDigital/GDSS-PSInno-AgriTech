import app from "./app.js";
import logger from "./common/utils/logger.js"
import pool from "./config/db.js";
import * as dotenv from "dotenv";

dotenv.config();


// app.set("io", io);
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`🚀 Community Hub running on port ${PORT}`);

  // 2026 PostGIS Check
  try {
    await pool.query("SELECT NOW()");
    logger.info("✅ PostgreSQL Engine Active");
  } catch (e) {
    logger.error(e);
    logger.error("❌ PostgreSQL missing! Run: CREATE PostgreSQL database;");
  }
});

// Graceful Shutdown: Close DB pool when server stops
process.on("SIGTERM", () => {
  pool.end();
  process.exit(0);
});