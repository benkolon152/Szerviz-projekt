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

let ordersSchemaPromise = null;
let commentsSchemaPromise = null;
let buildsSchemaPromise = null;

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

async function ensureUserProfileColumns() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pfp TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS postal_code INTEGER,
    ADD COLUMN IF NOT EXISTS house_number TEXT,
    ADD COLUMN IF NOT EXISTS phone_number TEXT
  `);
}

async function ensureOrdersTable() {
  if (!ordersSchemaPromise) {
    ordersSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id BIGSERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          order_type TEXT NOT NULL DEFAULT 'purchase',
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          shipping_address TEXT NOT NULL,
          phone_number TEXT,
          repair_device TEXT,
          repair_issue TEXT,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          total_huf INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'processing',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx
        ON orders (user_id, created_at DESC)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS orders_created_at_idx
        ON orders (created_at DESC)
      `);

      await pool.query(
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'purchase'`,
      );
      await pool.query(
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS repair_device TEXT`,
      );
      await pool.query(
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS repair_issue TEXT`,
      );
      await pool.query(
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`,
      );
      await pool.query(
        `ALTER TABLE orders ALTER COLUMN shipping_address DROP NOT NULL`,
      );
    })();
  }

  return ordersSchemaPromise;
}

async function ensureCommentsTable() {
  if (!commentsSchemaPromise) {
    commentsSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          pfp TEXT,
          content TEXT NOT NULL,
          "user" TEXT NOT NULL
        )
      `);

      await pool.query(
        `ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id INTEGER`,
      );
      await pool.query(
        `ALTER TABLE comments ADD COLUMN IF NOT EXISTS pfp TEXT`,
      );
      await pool.query(
        `ALTER TABLE comments ADD COLUMN IF NOT EXISTS content TEXT`,
      );
      await pool.query(
        `ALTER TABLE comments ADD COLUMN IF NOT EXISTS "user" TEXT`,
      );
    })();
  }

  return commentsSchemaPromise;
}

async function ensureBuildsTable() {
  if (!buildsSchemaPromise) {
    buildsSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS builds (
          id BIGSERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          name TEXT,
          components JSONB NOT NULL DEFAULT '{}'::jsonb,
          services JSONB NOT NULL DEFAULT '[]'::jsonb,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          total_huf INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS builds_user_id_created_at_idx
        ON builds (user_id, created_at DESC)
      `);
    })();
  }

  return buildsSchemaPromise;
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const quantity = Number(item?.quantity ?? 0);
      const priceHuf = Number(item?.price_huf ?? 0);

      return {
        id: item?.id ?? null,
        name:
          String(item?.name || item?.model || "Névtelen termék").trim() ||
          "Névtelen termék",
        quantity:
          Number.isFinite(quantity) && quantity > 0
            ? Math.min(99, Math.floor(quantity))
            : 1,
        price_huf:
          Number.isFinite(priceHuf) && priceHuf >= 0 ? Math.round(priceHuf) : 0,
        image_url: String(item?.image_url || "").trim(),
        category: String(item?.category || "").trim(),
        brand: String(item?.brand || "").trim(),
        model: String(item?.model || "").trim(),
      };
    })
    .filter((item) => item.name && item.quantity > 0);
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
        phone_number: user.phone_number,
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

app.post("/api/builds", async (req, res) => {
  const { user_id, name, components, services, total_huf, metadata } = req.body;

  try {
    // ensure table exists
    await ensureBuildsTable();

    const normalizedName = name ? String(name).trim() : null;
    const componentsJson = components && typeof components === 'object' ? components : {};
    const servicesJson = services && typeof services === 'object' ? services : {};
    const metadataJson = metadata && typeof metadata === 'object' ? metadata : {};
    const total = Number(total_huf) || 0;

    const result = await pool.query(
      `INSERT INTO builds (user_id, name, components, services, metadata, total_huf) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6) RETURNING *`,
      [user_id || null, normalizedName, componentsJson, servicesJson, metadataJson, total]
    );

    res.status(201).json({ message: 'Build saved', build: result.rows[0] });
  } catch (error) {
    console.error('Error saving build:', error);
    res.status(500).json({ message: 'Error saving build' });
  }
});

app.get("/api/builds", async (req, res) => {
  const userId = req.query.user_id ? Number(req.query.user_id) : null;

  try {
    await ensureBuildsTable();

    let result;
    if (userId && Number.isInteger(userId) && userId > 0) {
      result = await pool.query(
        "SELECT * FROM builds WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM builds ORDER BY created_at DESC LIMIT 100"
      );
    }

    res.status(200).json({ builds: result.rows });
  } catch (error) {
    console.error("Error fetching builds:", error);
    res.status(500).json({ message: "Error fetching builds" });
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
      "SELECT id, username, useremail, pfp, city, postal_code, house_number, phone_number FROM users WHERE id = $1 LIMIT 1",
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
  const { email, pfp, city, postal_code, house_number, phone_number } =
    req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

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
            house_number = $5,
            phone_number = $6
        WHERE id = $7
        RETURNING id, username, useremail, pfp, city, postal_code, house_number, phone_number
      `,
      [
        normalizedEmail,
        String(pfp || "").trim(),
        String(city || "").trim(),
        postal_code === null || postal_code === undefined || postal_code === ""
          ? null
          : Number(postal_code),
        String(house_number || "").trim(),
        String(phone_number || "").trim(),
        userId,
      ],
    );

    if (updatedUser.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({
        message: "Profile updated successfully",
        user: updatedUser.rows[0],
      });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Error updating user profile" });
  }
});

app.get("/api/users/:id/orders", async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    await ensureOrdersTable();

    const result = await pool.query(
      `
        SELECT id, user_id, order_type, customer_name, customer_email, shipping_address, phone_number, repair_device, repair_issue, items, total_huf, status, created_at, updated_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
      `,
      [userId],
    );

    res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Error fetching user orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  const {
    user_id,
    order_type,
    customer_name,
    customer_email,
    shipping_address,
    phone_number,
    repair_device,
    repair_issue,
    items,
    status,
  } = req.body;
  const normalizedUserId =
    user_id === null || user_id === undefined || user_id === ""
      ? null
      : Number(user_id);
  const normalizedOrderType =
    String(order_type || "purchase")
      .trim()
      .toLowerCase() === "repair_request"
      ? "repair_request"
      : "purchase";
  const normalizedCustomerName = String(customer_name || "").trim();
  const normalizedCustomerEmail = String(customer_email || "")
    .trim()
    .toLowerCase();
  const normalizedShippingAddress = String(shipping_address || "").trim();
  const normalizedPhoneNumber = String(phone_number || "").trim();
  const normalizedRepairDevice = String(repair_device || "").trim();
  const normalizedRepairIssue = String(repair_issue || "").trim();
  const normalizedStatus = String(
    status ||
      (normalizedOrderType === "repair_request"
        ? "needs_repair"
        : "processing"),
  )
    .trim()
    .toLowerCase();
  const normalizedItems = normalizeOrderItems(items);

  if (
    normalizedUserId !== null &&
    (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0)
  ) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (!normalizedCustomerName || !normalizedCustomerEmail) {
    return res
      .status(400)
      .json({
        message: "Customer name, email and shipping address are required",
      });
  }

  if (normalizedOrderType === "repair_request") {
    if (!normalizedRepairDevice || !normalizedRepairIssue) {
      return res
        .status(400)
        .json({ message: "Repair device and repair issue are required" });
    }
  } else if (!normalizedShippingAddress) {
    return res.status(400).json({ message: "Shipping address is required" });
  }

  if (normalizedOrderType === "purchase" && normalizedItems.length === 0) {
    return res.status(400).json({ message: "Order items are required" });
  }

  const totalHuf =
    normalizedOrderType === "purchase"
      ? normalizedItems.reduce(
          (sum, item) =>
            sum + Number(item.price_huf || 0) * Number(item.quantity || 0),
          0,
        )
      : 0;

  const safeStatus =
    normalizedOrderType === "repair_request" &&
    normalizedStatus === "processing"
      ? "needs_repair"
      : normalizedStatus;

  try {
    await ensureOrdersTable();

    const createdOrder = await pool.query(
      `
        INSERT INTO orders (
          user_id,
          order_type,
          customer_name,
          customer_email,
          shipping_address,
          phone_number,
          repair_device,
          repair_issue,
          items,
          total_huf,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
        RETURNING id, user_id, order_type, customer_name, customer_email, shipping_address, phone_number, repair_device, repair_issue, items, total_huf, status, created_at, updated_at
      `,
      [
        normalizedUserId,
        normalizedOrderType,
        normalizedCustomerName,
        normalizedCustomerEmail,
        normalizedOrderType === "purchase"
          ? normalizedShippingAddress
          : normalizedShippingAddress || null,
        normalizedPhoneNumber || null,
        normalizedOrderType === "repair_request"
          ? normalizedRepairDevice
          : null,
        normalizedOrderType === "repair_request" ? normalizedRepairIssue : null,
        JSON.stringify(normalizedItems),
        totalHuf,
        safeStatus,
      ],
    );

    res.status(201).json({
      message: "Order created successfully",
      order: createdOrder.rows[0],
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order" });
  }
});

app.get("/api/comments", async (req, res) => {
  try {
    await ensureCommentsTable();

    const result = await pool.query(
      `
        SELECT id, user_id, pfp, content, "user"
        FROM comments
        ORDER BY id DESC
        LIMIT 50
      `,
    );

    res.status(200).json({ comments: result.rows });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
});

app.post("/api/comments", async (req, res) => {
  const { user_id, pfp, content, user } = req.body;
  const normalizedUserId =
    user_id === null || user_id === undefined || user_id === ""
      ? null
      : Number(user_id);
  const normalizedPfp = String(pfp || "").trim();
  const normalizedContent = String(content || "").trim();
  const normalizedUser = String(user || "").trim();

  if (
    normalizedUserId !== null &&
    (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0)
  ) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (!normalizedUser || !normalizedContent) {
    return res.status(400).json({ message: "User and content are required" });
  }

  try {
    await ensureCommentsTable();

    const createdComment = await pool.query(
      `
        INSERT INTO comments (user_id, pfp, content, "user")
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, pfp, content, "user"
      `,
      [
        normalizedUserId,
        normalizedPfp || null,
        normalizedContent,
        normalizedUser,
      ],
    );

    res.status(201).json({
      message: "Comment created successfully",
      comment: createdComment.rows[0],
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Error creating comment" });
  }
});

app.delete("/api/comments/:id", async (req, res) => {
  const commentId = Number(req.params.id);
  const userId = req.body?.user_id ? Number(req.body.user_id) : null;
  const isAdmin = Boolean(req.body?.isadmin);

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(400).json({ message: "Invalid comment id" });
  }

  try {
    await ensureCommentsTable();

    const comment = await pool.query(
      `SELECT user_id FROM comments WHERE id = $1 LIMIT 1`,
      [commentId],
    );

    if (comment.rowCount === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const commentUserId = comment.rows[0]?.user_id;
    const isOwner = userId && userId === commentUserId;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    const deletedComment = await pool.query(
      `DELETE FROM comments WHERE id = $1 RETURNING id`,
      [commentId],
    );

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Error deleting comment" });
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

  if (
    !name ||
    !category ||
    !brand ||
    !model ||
    price_huf === undefined ||
    price_huf === null
  ) {
    return res
      .status(400)
      .json({ message: "Name, category, brand, model and price are required" });
  }

  try {
    const nextSortOrderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order FROM ${INVENTORY_TABLE}`,
    );
    const nextSortOrder = Number(
      nextSortOrderResult.rows[0]?.next_sort_order || 1,
    );

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

    res
      .status(201)
      .json({
        message: "Inventory item created successfully",
        item: createdItem.rows[0],
      });
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
        SELECT id, category, name, brand, model, price_huf, image_url, featured_shop_order, specifications
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

app.get("/api/shop/components/:id", async (req, res) => {
  const componentId = Number(req.params.id);

  if (!Number.isInteger(componentId) || componentId <= 0) {
    return res.status(400).json({ message: "Invalid component id" });
  }

  try {
    const result = await pool.query(
      `
        SELECT *
        FROM pc_components
        WHERE id = $1
        LIMIT 1
      `,
      [componentId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Component not found" });
    }

    res.status(200).json({ component: result.rows[0] });
  } catch (error) {
    console.error("Error fetching shop component details:", error);
    res.status(500).json({ message: "Error fetching shop component details" });
  }
});

app.get("/api/shop/components", async (req, res) => {
  const category = String(req.query.category || "").trim();

  try {
    const values = [];
    const whereParts = [];

    if (category) {
      values.push(category);
      whereParts.push(`category = $${values.length}`);
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";
    const result = await pool.query(
      `
        SELECT id, category, name, brand, model, price_huf, image_url, sort_order, specifications
        FROM pc_components
        ${whereClause}
        ORDER BY sort_order ASC NULLS LAST, id ASC
      `,
      values,
    );

    res.status(200).json({ components: result.rows });
  } catch (error) {
    console.error("Error fetching shop components:", error);
    res.status(500).json({ message: "Error fetching shop components" });
  }
});

// Prebuilt bundles list
app.get("/api/shop/prebuilts", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, name, price_huf, image_url, description, specifications
        FROM prebuilt_pc_bundles
        ORDER BY id ASC
      `,
    );

    res.status(200).json({ prebuilts: result.rows });
  } catch (error) {
    console.error("Error fetching prebuilts:", error);
    res.status(500).json({ message: "Error fetching prebuilts" });
  }
});

// Prebuilt bundle details
app.get("/api/shop/prebuilts/:id", async (req, res) => {
  const prebuiltId = Number(req.params.id);

  if (!Number.isInteger(prebuiltId) || prebuiltId <= 0) {
    return res.status(400).json({ message: "Invalid prebuilt id" });
  }

  try {
    const result = await pool.query(
      `
        SELECT *
        FROM prebuilt_pc_bundles
        WHERE id = $1
        LIMIT 1
      `,
      [prebuiltId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Prebuilt not found" });
    }

    res.status(200).json({ prebuilt: result.rows[0] });
  } catch (error) {
    console.error("Error fetching prebuilt details:", error);
    res.status(500).json({ message: "Error fetching prebuilt details" });
  }
});

app.get("/api/parts/:category", async (req, res) => {
  const category = req.params.category;
  const searchQuery = req.query.search || "";

  try {
    const result = await pool.query(
      `
        SELECT id, name, brand, model, price_huf, image_url, socket
        FROM ${INVENTORY_TABLE}
        WHERE category = $1 
        AND (name ILIKE $2 OR brand ILIKE $2)
        ORDER BY id ASC
      `,
      [category, `%${searchQuery}%`]
    );

    res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching parts:", error);
    res.status(500).json({ message: "Error fetching parts" });
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
