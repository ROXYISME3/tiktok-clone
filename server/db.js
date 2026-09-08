const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("PostgreSQL database connected.");
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database test successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database test failed:", error.message);
    return false;
  }
}

module.exports = {
  pool,
  testDatabase,
};