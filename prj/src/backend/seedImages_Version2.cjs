const fs = require("node:fs");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");
require("dotenv").config();

const {
  INPUT_CSV,
  DATABASE_URL,
  SUPABASE_URL = "https://uavftnxveesjyonfmhak.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET = "partpictures",
  SERPAPI_KEY,
  LIMIT,
  OVERWRITE, // set to "1" to overwrite existing image_url
} = process.env;

if (!INPUT_CSV) throw new Error("Missing INPUT_CSV");
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!SERPAPI_KEY) throw new Error("Missing SERPAPI_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function queryForRow(r) {
  // model already contains brand in many rows; keep it simple, add category to reduce mismatches
  const base = (r.model || r.name || "").trim();
  const cat = (r.category || "").trim();
  return cat ? `${base} ${cat}` : base;
}

async function serpGoogleImages(query) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");
  url.searchParams.set("ijn", "0");
  url.searchParams.set("api_key", SERPAPI_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  return res.json();
}

function pickImageUrl(j) {
  const arr = j.images_results || [];
  if (!arr.length) return null;
  // prefer "original"
  for (const it of arr) if (it?.original?.startsWith("http")) return it.original;
  for (const it of arr) if (it?.thumbnail?.startsWith("http")) return it.thumbnail;
  return null;
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`Image too small (${buf.length} bytes)`);
  return { buf, contentType };
}

function extFromContentType(ct) {
  const t = ct.toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  return "jpg";
}

async function uploadToSupabase(id, buf, contentType) {
  const ext = extFromContentType(contentType);
  const objectPath = `pc-components/${id}.${ext}`;

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(objectPath, buf, { upsert: true, contentType, cacheControl: "86400" });

  if (error) throw new Error(`Supabase upload: ${error.message}`);

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error("No publicUrl returned");
  return data.publicUrl;
}

async function main() {
  const csv = fs.readFileSync(INPUT_CSV, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true });

  const pg = new Client({ connectionString: DATABASE_URL });
  await pg.connect();

  const max = LIMIT ? Math.min(rows.length, Number(LIMIT)) : rows.length;

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < max; i++) {
    const r = rows[i];
    const id = Number(r.id);
    const q = queryForRow(r);

    try {
      if (!id || !q) throw new Error("Missing id/query");

      if (!OVERWRITE) {
        const cur = await pg.query("select image_url from pc_components where id=$1", [id]);
        const existing = cur.rows?.[0]?.image_url;
        if (existing && String(existing).trim() !== "") continue;
      }

      const serp = await serpGoogleImages(q);
      const imgUrl = pickImageUrl(serp);
      if (!imgUrl) throw new Error("No SerpAPI image result");

      const { buf, contentType } = await download(imgUrl);
      const publicUrl = await uploadToSupabase(id, buf, contentType);

      await pg.query(
        "update pc_components set image_url=$1, updated_at=now() where id=$2",
        [publicUrl, id]
      );

      updated++;
      await sleep(500); // rate-limit friendly
    } catch (e) {
      failed++;
      console.error(`Fail id=${r.id} q="${q}":`, e.message || e);
      await sleep(500);
    }
  }

  await pg.end();
  console.log(`Done. updated=${updated} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});