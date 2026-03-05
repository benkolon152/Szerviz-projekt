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
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, useremail, pw) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword],
    );
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Ismeretlen szerverhiba" });
});

app.listen(PORT, () => {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  🚀 Express szerver fut!");
  console.log(`  📍 http://localhost:${PORT}`);
  console.log("  💾 PostgreSQL Neon adatbázis csatlakozva");
  console.log("═══════════════════════════════════════════════════════════\n");
});

module.exports = app;
