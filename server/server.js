const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { pool, testDatabase } = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TikTok Clone API is running.",
    status: "online",
  });
});

/* =========================================================
   API TEST
========================================================= */

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "TikTok Clone API is running.",
    status: "online",
  });
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      server: "online",
      database: "connected"
    });
  } catch (error) {
    console.error("Health check error:", error);

    res.status(500).json({
      success: false,
      server: "online",
      database: "error",
      message: error.message
    });
  }
});

/* =========================================================
   CREATE USERS TABLE
========================================================= */

async function createUsersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Users table is ready.");
  } catch (error) {
    console.error("Could not create users table:", error.message);
    throw error;
  }
}

/* =========================================================
   REGISTER
   POST /api/register
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters.",
      });
    }

    if (!cleanEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = $1
         OR LOWER(username) = $2
      LIMIT 1
      `,
      [cleanEmail, cleanUsername.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
      `,
      [cleanUsername, cleanEmail, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating account.",
    });
  }
});

/* =========================================================
   SIGNUP ALIAS
   Allows /api/signup too
========================================================= */

app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim() : null;

    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    /*
      Current users table requires email.
      If signup is using phone only, create a placeholder email.
    */

    const finalEmail =
      cleanEmail || `${cleanPhone.replace(/\D/g, "")}@phone.local`;

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(username) = $1
         OR LOWER(email) = $2
      LIMIT 1
      `,
      [cleanUsername.toLowerCase(), finalEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
      `,
      [cleanUsername, finalEmail, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating account.",
    });
  }
});

/* =========================================================
   LOGIN
   POST /api/login
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    console.log("Login request received.");

    const {
      identifier,
      email,
      username,
      password,
    } = req.body;

    const loginIdentifier =
      identifier ||
      email ||
      username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required.",
      });
    }

    const cleanIdentifier = loginIdentifier.trim().toLowerCase();

    console.log("Login identifier:", cleanIdentifier);

    const result = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        password,
        created_at
      FROM users
      WHERE LOWER(email) = $1
         OR LOWER(username) = $1
      LIMIT 1
      `,
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in.",
    });
  }
});

/* =========================================================
   PHONE LOGIN
========================================================= */

app.post("/api/login-phone", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required.",
      });
    }

    const cleanPhone = phone.trim();

    /*
      Phone-only accounts currently use:
      PHONE@phone.local
    */

    const fakeEmail =
      `${cleanPhone.replace(/\D/g, "")}@phone.local`;

    const result = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        password,
        created_at
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [fakeEmail.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: cleanPhone,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("PHONE LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in.",
    });
  }
});

/* =========================================================
   GET USER
========================================================= */

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.originalUrl,
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    console.log("Starting TikTok Clone API...");

    const databaseOK = await testDatabase();

    if (!databaseOK) {
      console.error("Database connection failed.");
      process.exit(1);
    }

    await createUsersTable();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("----------------------------------------");
      console.log("TikTok Clone API started.");
      console.log(`Port: ${PORT}`);
      console.log("----------------------------------------");
    });
  } catch (error) {
    console.error("SERVER START ERROR:", error);
    process.exit(1);
  }
}

startServer();