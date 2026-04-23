const express = require("express");
const cors = require("cors");
const pg = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!username || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE LOWER(useremail) = LOWER($1) LIMIT 1",
      [normalizedEmail],
    );

    if (existingUser.rowCount > 0) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, useremail, pw, isemployee, isadmin) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [username, normalizedEmail, hashedPassword, false, false],
    );
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const normalizedIdentifier = (identifier || "").trim().toLowerCase();

    if (!normalizedIdentifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(useremail) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1",
      [normalizedIdentifier],
    );

    if (result.rowCount === 0) {
      return res
        .status(401)
        .json({ message: "Invalid username/email or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.pw);

    if (!match) {
      return res
        .status(401)
        .json({ message: "Invalid username/email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.useremail,
        isadmin: user.isadmin,
        isemployee: user.isemployee,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

app.post("/api/users", async (req, res) => {
  pool.query("SELECT * FROM users", (err, result) => {
    if (err) {
      res.status(500).json({ error: err });
    } else {
      res.status(200).json({ result: result });
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Ismeretlen szerverhiba" });
});

app.listen(PORT, () => {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  🚀 Express szerver fut!");
  console.log(`  📍 http://localhost:${PORT}`);
  console.log("  💾 PostgresSQL Neon adatbázis csatlakozva");
  console.log("═══════════════════════════════════════════════════════════\n");
});

module.exports = app;
