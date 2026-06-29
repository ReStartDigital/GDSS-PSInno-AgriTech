import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT || "5432"),
// });

const pool = new Pool({
  connectionString: process.env.DB_URL, // e.g., postgres://user:pass@host:5432/db
});

// Log pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
