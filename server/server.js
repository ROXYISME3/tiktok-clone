const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { db, testDatabaseConnection } = require("./db");

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   TEST SERVER
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TikTok clone server is running.",
  });
});

/* =========================================================
   TEST NEON POSTGRESQL CONNECTION
========================================================= */

app.get("/api/test", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT 1 AS connected"
    );

    res.json({
      success: true,
      message: "Neon PostgreSQL connection is working!",
      result: result.rows,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Neon PostgreSQL connection failed.",
      error: error.message,
    });
  }
});

/* =========================================================
   SIGN UP
========================================================= */

app.post("/api/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
    } = req.body;

    /* -----------------------------------------------------
       CHECK USERNAME
    ----------------------------------------------------- */

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    /* -----------------------------------------------------
       CHECK PASSWORD
    ----------------------------------------------------- */

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    /* -----------------------------------------------------
       EMAIL OR PHONE REQUIRED
    ----------------------------------------------------- */

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email or phone number.",
      });
    }

    /* -----------------------------------------------------
       CHECK EXISTING USER
    ----------------------------------------------------- */

    const existingResult = await db.query(
      `
      SELECT id
      FROM users
      WHERE username = $1
         OR ($2::text IS NOT NULL AND email = $2)
         OR ($3::text IS NOT NULL AND phone = $3)
      LIMIT 1
      `,
      [username, email || null, phone || null]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Username, email, or phone number is already registered.",
      });
    }

    /* -----------------------------------------------------
       HASH PASSWORD
    ----------------------------------------------------- */

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    /* -----------------------------------------------------
       INSERT USER
    ----------------------------------------------------- */

    const insertResult = await db.query(
      `
      INSERT INTO users
      (
        username,
        email,
        phone,
        password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, phone
      `,
      [
        username,
        email || null,
        phone || null,
        hashedPassword,
      ]
    );

    const newUser = insertResult.rows[0];

    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: newUser,
    });

  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating account.",
      error: error.message,
    });
  }
});

/* =========================================================
   LOGIN WITH USERNAME OR EMAIL
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    /* -----------------------------------------------------
       CHECK INPUT
    ----------------------------------------------------- */

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username/email and password are required.",
      });
    }

    /* -----------------------------------------------------
       FIND USER
    ----------------------------------------------------- */

    const result = await db.query(
      `
      SELECT
        id,
        username,
        email,
        phone,
        password_hash
      FROM users
      WHERE username = $1
         OR email = $1
      LIMIT 1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username/email or password.",
      });
    }

    const user = result.rows[0];

    /* -----------------------------------------------------
       CHECK PASSWORD
    ----------------------------------------------------- */

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username/email or password.",
      });
    }

    /* -----------------------------------------------------
       SAVE LOGIN EVENT
    ----------------------------------------------------- */

    try {
      await db.query(
        `
        INSERT INTO login_events
        (
          user_id,
          login_method
        )
        VALUES ($1, $2)
        `,
        [
          user.id,
          "password",
        ]
      );
    } catch (loginEventError) {
      console.error(
        "Login event error:",
        loginEventError.message
      );
    }

    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging in.",
      error: error.message,
    });
  }
});

/* =========================================================
   LOGIN WITH PHONE
========================================================= */

app.post("/api/login-phone", async (req, res) => {
  try {
    const {
      phone,
      password,
    } = req.body;

    /* -----------------------------------------------------
       CHECK INPUT
    ----------------------------------------------------- */

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number and password are required.",
      });
    }

    /* -----------------------------------------------------
       FIND USER BY PHONE
    ----------------------------------------------------- */

    const result = await db.query(
      `
      SELECT
        id,
        username,
        email,
        phone,
        password_hash
      FROM users
      WHERE phone = $1
      LIMIT 1
      `,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Phone number or password is incorrect.",
      });
    }

    const user = result.rows[0];

    /* -----------------------------------------------------
       CHECK PASSWORD
    ----------------------------------------------------- */

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Phone number or password is incorrect.",
      });
    }

    /* -----------------------------------------------------
       SAVE LOGIN EVENT
    ----------------------------------------------------- */

    try {
      await db.query(
        `
        INSERT INTO login_events
        (
          user_id,
          login_method
        )
        VALUES ($1, $2)
        `,
        [
          user.id,
          "phone",
        ]
      );
    } catch (loginEventError) {
      console.error(
        "Login event error:",
        loginEventError.message
      );
    }

    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    return res.json({
      success: true,
      message: "Phone login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error(
      "Phone login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging in with phone.",
      error: error.message,
    });
  }
});

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(
    `Server running on port ${PORT}`
  );

  await testDatabaseConnection();
});