const { Pool } = require("pg");
require("dotenv").config();

/* =========================================================
   NEON POSTGRESQL CONNECTION
========================================================= */

const db = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 10,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000,
});

/* =========================================================
   TEST DATABASE CONNECTION
========================================================= */

async function testDatabaseConnection() {
  let connection;

  try {
    connection = await db.connect();

    const result = await connection.query(
      "SELECT NOW() AS current_time"
    );

    console.log("=================================");
    console.log("Neon PostgreSQL connected!");
    console.log("Database time:", result.rows[0].current_time);
    console.log("=================================");

  } catch (error) {

    console.error("=================================");
    console.error("Neon database connection failed!");
    console.error(error.message);
    console.error("=================================");

  } finally {

    if (connection) {
      connection.release();
    }
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  db,
  testDatabaseConnection,
};