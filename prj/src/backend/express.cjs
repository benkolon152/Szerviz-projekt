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

async function ensureUserProfileColumns() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pfp TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS postal_code INTEGER,
    ADD COLUMN IF NOT EXISTS house_number TEXT
  `);
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
        pfp: user.pfp,
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
      "SELECT id, username, useremail, pfp, isemployee, isadmin FROM users ORDER BY id ASC",
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

    res.status(201).json({
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

app.get("/api/users/:id/profile", async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    await ensureUserProfileColumns();

    const result = await pool.query(
      "SELECT id, username, useremail, pfp, city, postal_code, house_number FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

app.put("/api/users/:id/profile", async (req, res) => {
  const userId = Number(req.params.id);
  const { email, pfp, city, postal_code, house_number } = req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await ensureUserProfileColumns();

    const updatedUser = await pool.query(
      `
        UPDATE users
        SET useremail = $1,
            pfp = $2,
            city = $3,
            postal_code = $4,
            house_number = $5
        WHERE id = $6
        RETURNING id, username, useremail, pfp, city, postal_code, house_number
      `,
      [
        normalizedEmail,
        String(pfp || "").trim(),
        String(city || "").trim(),
        postal_code === null || postal_code === undefined || postal_code === "" ? null : Number(postal_code),
        String(house_number || "").trim(),
        userId,
      ],
    );

    if (updatedUser.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser.rows[0] });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Error updating user profile" });
  }
});

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, category, brand, model, price_huf, image_url
        FROM ${INVENTORY_TABLE}
        ORDER BY id ASC
      `,
    );

    res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Error fetching inventory" });
  }
});

app.post("/api/inventory", async (req, res) => {
  const { name, category, brand, model, price_huf, image_url } = req.body;

  if (!name || !category || !brand || !model || price_huf === undefined || price_huf === null) {
    return res.status(400).json({ message: "Name, category, brand, model and price are required" });
  }

  try {
    const nextSortOrderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order FROM ${INVENTORY_TABLE}`,
    );
    const nextSortOrder = Number(nextSortOrderResult.rows[0]?.next_sort_order || 1);

    const createdItem = await pool.query(
      `
        INSERT INTO ${INVENTORY_TABLE} (category, name, sort_order, brand, model, price_huf, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (category, name) DO UPDATE
        SET brand = EXCLUDED.brand,
            model = EXCLUDED.model,
            price_huf = EXCLUDED.price_huf,
            image_url = EXCLUDED.image_url,
            updated_at = NOW()
        RETURNING id, category, name, brand, model, price_huf, image_url
      `,
      [
        String(category).trim(),
        String(name).trim(),
        nextSortOrder,
        String(brand).trim(),
        String(model).trim(),
        Number(price_huf),
        image_url ? String(image_url).trim() : null,
      ],
    );

    res.status(201).json({ message: "Inventory item created successfully", item: createdItem.rows[0] });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ message: "Error creating inventory item" });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  const itemId = Number(req.params.id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ message: "Invalid inventory item id" });
  }

  try {
    const deletedItem = await pool.query(
      `DELETE FROM ${INVENTORY_TABLE} WHERE id = $1 RETURNING id`,
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

app.get("/api/shop/featured", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT category, name, price_huf, image_url, featured_shop_order, specifications
        FROM pc_components
        WHERE featured_shop = true
        ORDER BY featured_shop_order ASC NULLS LAST, sort_order ASC
      `,
    );

    res.status(200).json({ components: result.rows });
  } catch (error) {
    console.error("Error fetching featured components:", error);
    res.status(500).json({ message: "Error fetching featured components" });
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
