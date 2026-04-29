const fs = require("node:fs");
const { parse } = require("csv-parse/sync");
const { Client } = require("pg");
require("dotenv").config();

const {
  DATABASE_URL,
  INPUT_CSV,
  SUPABASE_PROJECT_REF = "uavftnxveesjyonfmhak",
  SUPABASE_BUCKET = "partpictures",
  SUPABASE_PREFIX = "", // set to "pc-components/" if your files are inside a folder
  DRY_RUN, // set "1" to preview only
} = process.env;

if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!INPUT_CSV) throw new Error("Missing INPUT_CSV");

const supabaseBase =
  `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/` +
  (SUPABASE_PREFIX || "");

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildUrl(csvId, ext) {
  return `${supabaseBase}${csvId}.${ext}`;
}

async function main() {
  const csvText = fs.readFileSync(INPUT_CSV, "utf8");
  const csvRows = parse(csvText, { columns: true, skip_empty_lines: true, bom: true });

  // Build lookup by (category + name) -> csv_id
  // CSV you pasted earlier: id,category,brand,model,name
  const byCatName = new Map();
  for (const r of csvRows) {
    const csvId = String(r.id).trim();
    const key = `${norm(r.category)}|${norm(r.name)}`;
    // keep first occurrence
    if (!byCatName.has(key)) byCatName.set(key, csvId);
  }

  const pg = new Client({ connectionString: DATABASE_URL });
  await pg.connect();

  // Pull current Neon rows (id, category, name)
  const res = await pg.query(
    `select id, category, name
     from pc_components
     order by id`
  );

  // Detect extensions: your storage shows mostly .jpg with a few .png
  // We'll try .jpg first, and if you want we can add HEAD checks later.
  // For now: assume .jpg, but allow a tiny hardcoded override list if needed.
  const defaultExt = "jpg";

  let matched = 0;
  let missing = 0;

  for (const row of res.rows) {
    const key = `${norm(row.category)}|${norm(row.name)}`;
    const csvId = byCatName.get(key);

    if (!csvId) {
      missing++;
      continue;
    }

    const imageUrl = buildUrl(csvId, defaultExt);

    matched++;

    if (!DRY_RUN) {
      await pg.query(
        `update pc_components
         set image_url = $1, updated_at = now()
         where id = $2`,
        [imageUrl, row.id]
      );
    }
  }

  await pg.end();

  console.log(`Done. matched=${matched} missing=${missing}`);
  if (DRY_RUN) console.log("DRY_RUN was enabled; no updates were written.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});