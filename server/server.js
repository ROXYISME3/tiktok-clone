const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

/* =========================================================
   MYSQL CONNECTION
========================================================= */

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tiktok_clone",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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
   TEST MYSQL CONNECTION
========================================================= */

app.get("/api/test", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT 1 AS connected"
    );

    res.json({
      success: true,
      message: "MySQL connection is working!",
      result: rows,
    });
  } catch (error) {
    console.error(
      "Database connection error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "MySQL connection failed.",
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

    /* =====================================================
       CHECK USERNAME
    ===================================================== */

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    /* =====================================================
       CHECK PASSWORD
    ===================================================== */

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    /* =====================================================
       EMAIL OR PHONE REQUIRED
    ===================================================== */

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide an email or phone number.",
      });
    }

    /* =====================================================
       CHECK EXISTING USER
    ===================================================== */

    let existingUsers;

    if (email && phone) {
      [existingUsers] = await db.execute(
        `
        SELECT id
        FROM users
        WHERE username = ?
           OR email = ?
           OR phone = ?
        LIMIT 1
        `,
        [username, email, phone]
      );
    } else if (email) {
      [existingUsers] = await db.execute(
        `
        SELECT id
        FROM users
        WHERE username = ?
           OR email = ?
        LIMIT 1
        `,
        [username, email]
      );
    } else {
      [existingUsers] = await db.execute(
        `
        SELECT id
        FROM users
        WHERE username = ?
           OR phone = ?
        LIMIT 1
        `,
        [username, phone]
      );
    }

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Username, email, or phone number is already registered.",
      });
    }

    /* =====================================================
       HASH PASSWORD
    ===================================================== */

    const hashedPassword =
      await bcrypt.hash(password, 10);

    /* =====================================================
       INSERT USER
    ===================================================== */

    const [result] = await db.execute(
      `
      INSERT INTO users
      (
        username,
        email,
        phone,
        password_hash
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        username,
        email || null,
        phone || null,
        hashedPassword,
      ]
    );

    /* =====================================================
       SUCCESS RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully.",

      user: {
        id: result.insertId,
        username: username,
        email: email || null,
        phone: phone || null,
      },
    });

  } catch (error) {

    console.error(
      "Signup error:",
      error
    );

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

    /* =====================================================
       CHECK INPUT
    ===================================================== */

    if (!username || !password) {
      return res.status(400).json({
        success: false,

        message:
          "Username/email and password are required.",
      });
    }

    /* =====================================================
       FIND USER
    ===================================================== */

    const [users] = await db.execute(
      `
      SELECT
        id,
        username,
        email,
        phone,
        password_hash
      FROM users
      WHERE username = ?
         OR email = ?
      LIMIT 1
      `,
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,

        message:
          "Invalid username/email or password.",
      });
    }

    const user = users[0];

    /* =====================================================
       CHECK PASSWORD
    ===================================================== */

    const passwordMatch =
      await bcrypt.compare(
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

    /* =====================================================
       SAVE LOGIN EVENT
    ===================================================== */

    try {

      await db.execute(
        `
        INSERT INTO login_events
        (
          user_id,
          login_method
        )
        VALUES (?, ?)
        `,
        [
          user.id,
          "password",
        ]
      );

    } catch (loginEventError) {

      console.error(
        "Login event error:",
        loginEventError
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.json({

      success: true,

      message:
        "Login successful.",

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },

    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

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
   NO 6-DIGIT CODE
========================================================= */

app.post("/api/login-phone", async (req, res) => {

  try {

    const {
      phone,
      password,
    } = req.body;

    /* =====================================================
       CHECK INPUT
    ===================================================== */

    if (!phone || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Phone number and password are required.",

      });
    }

    /* =====================================================
       FIND USER BY PHONE
    ===================================================== */

    const [users] = await db.execute(
      `
      SELECT
        id,
        username,
        email,
        phone,
        password_hash
      FROM users
      WHERE phone = ?
      LIMIT 1
      `,
      [phone]
    );

    if (users.length === 0) {

      return res.status(401).json({

        success: false,

        message:
          "Phone number or password is incorrect.",

      });
    }

    const user = users[0];

    /* =====================================================
       CHECK PASSWORD
    ===================================================== */

    const passwordMatch =
      await bcrypt.compare(
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

    /* =====================================================
       SAVE LOGIN EVENT
    ===================================================== */

    try {

      await db.execute(
        `
        INSERT INTO login_events
        (
          user_id,
          login_method
        )
        VALUES (?, ?)
        `,
        [
          user.id,
          "phone",
        ]
      );

    } catch (loginEventError) {

      console.error(
        "Login event error:",
        loginEventError
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.json({

      success: true,

      message:
        "Phone login successful.",

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
   SERVER
   RENDER COMPATIBLE
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `Server running on port ${PORT}`
  );

});