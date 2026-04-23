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

const INVENTORY_TABLE = "pc_components";
const INVENTORY_EXCLUDED_COLUMNS = new Set([
  "created_at",
  "updated_at",
  "specifications",
]);

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));

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

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, useremail, isemployee, isadmin FROM users ORDER BY id ASC",
    );
    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.post("/api/users", async (req, res) => {
  const { username, email, password, isemployee, isadmin } = req.body;

  try {
    const normalizedUsername = (username || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
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
    const createdUser = await pool.query(
      "INSERT INTO users (username, useremail, pw, isemployee, isadmin) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, useremail, isemployee, isadmin",
      [
        normalizedUsername,
        normalizedEmail,
        hashedPassword,
        Boolean(isemployee),
        Boolean(isadmin),
      ],
    );

    res
      .status(201)
      .json({
        message: "User created successfully",
        user: createdUser.rows[0],
      });
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

app.delete("/api/users/:id", async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const deletedUser = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [userId],
    );

    if (deletedUser.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

app.get("/api/inventory", async (req, res) => {
  try {
    const columnsResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position ASC",
      [INVENTORY_TABLE],
    );
    const columnNames = columnsResult.rows.map((row) => row.column_name);

    if (columnNames.length === 0) {
      return res.status(404).json({
        message: `Inventory table '${INVENTORY_TABLE}' was not found in schema public.`,
      });
    }

    const selectedColumns = columnNames.filter(
      (columnName) => !INVENTORY_EXCLUDED_COLUMNS.has(columnName),
    );

    if (selectedColumns.length === 0) {
      return res.status(500).json({
        message: "No inventory columns available after exclusions.",
      });
    }

    const hasSortOrder = selectedColumns.includes("sort_order");
    const hasId = selectedColumns.includes("id");

    let orderByClause = "";
    if (hasSortOrder && hasId) {
      orderByClause = " ORDER BY sort_order ASC NULLS LAST, id ASC";
    } else if (hasSortOrder) {
      orderByClause = " ORDER BY sort_order ASC NULLS LAST";
    } else if (hasId) {
      orderByClause = " ORDER BY id ASC";
    }

    const query = `SELECT ${selectedColumns.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(INVENTORY_TABLE)}${orderByClause}`;

    const result = await pool.query(query);
    res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Error fetching inventory" });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  const itemId = Number(req.params.id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ message: "Invalid inventory item id" });
  }

  try {
    const deletedItem = await pool.query(
      `DELETE FROM ${quoteIdentifier(INVENTORY_TABLE)} WHERE id = $1 RETURNING id`,
      [itemId],
    );

    if (deletedItem.rowCount === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ message: "Error deleting inventory item" });
  }
});

app.post("/api/inventory", async (req, res) => {
  const { name, category, brand, model, price_huf, image_url } = req.body;

  // Validation
  if (!name || !category || !brand || !model || price_huf === undefined) {
    return res.status(400).json({
      message: "Required fields: name, category, brand, model, price_huf",
    });
  }

  const price = Number(price_huf);
  if (!Number.isInteger(price) || price < 0) {
    return res
      .status(400)
      .json({ message: "Price must be a valid positive number" });
  }

  try {
    // Limit image_url to 1MB to prevent database issues
    const finalImageUrl =
      image_url && image_url.length < 1048576 ? image_url : null;

    // Get the highest sort_order and add 1
    const maxSortOrderResult = await pool.query(
      `SELECT MAX(sort_order) as max_sort FROM ${quoteIdentifier(INVENTORY_TABLE)}`,
    );
    const newSortOrder = (maxSortOrderResult.rows[0]?.max_sort || 0) + 1;

    const result = await pool.query(
      `INSERT INTO ${quoteIdentifier(INVENTORY_TABLE)} (name, category, brand, model, price_huf, image_url, sort_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, category, brand, model, price_huf, image_url`,
      [name, category, brand, model, price, finalImageUrl, newSortOrder],
    );

    res.status(201).json({
      message: "Inventory item created successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating inventory item:", error.message);
    res
      .status(500)
      .json({ message: "Error creating inventory item: " + error.message });
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
  console.log("  💾 PostgresSQL Neon adatbázis csatlakozva");
  console.log("═══════════════════════════════════════════════════════════\n");
});

module.exports = app;
