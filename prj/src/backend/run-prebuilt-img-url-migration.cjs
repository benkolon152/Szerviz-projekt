const fs = require("node:fs/promises");
const path = require("node:path");
const pg = require("pg");
require("dotenv").config();

const sqlFilePath = path.join(__dirname, "migrations", "2026-04-29_add_prebuilt_img_url.sql");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

async function main() {
  const sqlText = await fs.readFile(sqlFilePath, "utf8");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Connecting to database...");
    await client.connect();

    console.log(`Running migration from ${sqlFilePath}`);
    await client.query(sqlText);

    console.log("Migration finished successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) {
  main();
}