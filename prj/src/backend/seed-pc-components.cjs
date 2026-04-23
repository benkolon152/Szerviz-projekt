const path = require("path");
const { pathToFileURL } = require("url");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const FLAT_SPEC_COLUMNS = [
  "brand",
  "model",
  "socket",
  "cores",
  "threads",
  "boost_clock_ghz",
  "integrated_graphics",
  "tdp_w",
  "form_factor",
  "memory_type",
  "wifi",
  "pcie",
  "m2_slots",
  "case_type",
  "motherboard_support",
  "side_panel",
  "max_gpu_length_mm",
  "preinstalled_fans",
  "memory_gb",
  "gpu_memory_type",
  "outputs",
  "recommended_psu_w",
  "ray_tracing",
  "capacity_gb",
  "ram_type",
  "speed_mts",
  "kit",
  "rgb",
  "wattage",
  "psu_form_factor",
  "modular",
  "efficiency",
  "pcie5_ready",
  "interface",
  "rpm",
  "cache_mb",
  "drive_type",
  "writing_support",
  "external",
  "cooler_type",
  "heatpipes",
  "fans",
  "height_mm",
  "socket_support",
  "radiator_mm",
  "pump_speed_rpm",
  "size_inch",
  "resolution",
  "panel",
  "refresh_hz",
  "adaptive_sync",
  "layout",
  "connection",
  "switch_type",
  "backlight",
  "hot_swappable",
  "sensor_dpi",
  "weight_g",
  "buttons",
  "usage_category",
  "family",
  "architecture",
  "license_type",
  "edition",
  "supports_uefi",
];

const FEATURED_COUNT = 10;
const FEATURED_CATEGORY_ALLOWLIST = new Set([
  "cpus",
  "motherboards",
  "pcCases",
  "gpus",
  "rams",
  "psus",
  "hdds",
  "ssds",
  "opticalDrives",
  "cpuAirCoolers",
  "cpuLiquidCoolers",
]);

async function loadCatalog() {
  const catalogPath = path.resolve(__dirname, "../lib/pc-components.js");
  const catalogModule = await import(pathToFileURL(catalogPath).href);

  return {
    rawCatalog: catalogModule.pcComponentCatalog,
    detailedCatalog: catalogModule.pcComponentCatalogDetailed,
  };
}

function chunk(array, size) {
  const chunks = [];

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }

  return chunks;
}

function hashText(text) {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickFeaturedRows(rows, count) {
  const eligibleRows = rows.filter(([category]) => FEATURED_CATEGORY_ALLOWLIST.has(category));

  const shuffled = eligibleRows
    .map((row) => ({ sortKey: hashText(`${row[0]}:${row[1]}`), row }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((entry) => entry.row);

  return shuffled.slice(0, count).map((row, index) => [...row, true, index + 1]);
}

function normalizeSpecifications(specifications) {
  const spec = specifications ?? {};

  return {
    brand: spec.brand ?? null,
    model: spec.model ?? null,
    socket: spec.socket ?? null,
    cores: spec.cores ?? null,
    threads: spec.threads ?? null,
    boost_clock_ghz: spec.boostClockGHz ?? null,
    integrated_graphics: spec.integratedGraphics ?? null,
    tdp_w: spec.tdpW ?? null,
    form_factor: spec.formFactor ?? null,
    memory_type: spec.memoryType ?? null,
    wifi: spec.wifi ?? null,
    pcie: spec.pcie ?? null,
    m2_slots: spec.m2Slots ?? null,
    case_type: spec.caseType ?? null,
    motherboard_support: spec.motherboardSupport ?? null,
    side_panel: spec.sidePanel ?? null,
    max_gpu_length_mm: spec.maxGpuLengthMm ?? null,
    preinstalled_fans: spec.preinstalledFans ?? null,
    memory_gb: spec.memoryGB ?? null,
    gpu_memory_type: spec.memoryType ?? null,
    outputs: spec.outputs ?? null,
    recommended_psu_w: spec.recommendedPsuW ?? null,
    ray_tracing: spec.rayTracing ?? null,
    capacity_gb: spec.capacityGB ?? null,
    ram_type: spec.type ?? null,
    speed_mts: spec.speedMTs ?? null,
    kit: spec.kit ?? null,
    rgb: spec.rgb ?? null,
    wattage: spec.wattage ?? null,
    psu_form_factor: spec.formFactor ?? null,
    modular: spec.modular ?? null,
    efficiency: spec.efficiency ?? null,
    pcie5_ready: spec.pcie5Ready ?? null,
    interface: spec.interface ?? null,
    rpm: spec.rpm ?? null,
    cache_mb: spec.cacheMB ?? null,
    drive_type: spec.driveType ?? null,
    writing_support: spec.writingSupport ?? null,
    external: spec.external ?? null,
    cooler_type: spec.coolerType ?? null,
    heatpipes: spec.heatpipes ?? null,
    fans: spec.fans ?? null,
    height_mm: spec.heightMm ?? null,
    socket_support: spec.socketSupport ?? null,
    radiator_mm: spec.radiatorMm ?? null,
    pump_speed_rpm: spec.pumpSpeedRpm ?? null,
    size_inch: spec.sizeInch ?? null,
    resolution: spec.resolution ?? null,
    panel: spec.panel ?? null,
    refresh_hz: spec.refreshHz ?? null,
    adaptive_sync: spec.adaptiveSync ?? null,
    layout: spec.layout ?? null,
    connection: spec.connection ?? null,
    switch_type: spec.switchType ?? null,
    backlight: spec.backlight ?? null,
    hot_swappable: spec.hotSwappable ?? null,
    sensor_dpi: spec.sensorDpi ?? null,
    weight_g: spec.weightG ?? null,
    buttons: spec.buttons ?? null,
    usage_category: spec.category ?? null,
    family: spec.family ?? null,
    architecture: spec.architecture ?? null,
    license_type: spec.licenseType ?? null,
    edition: spec.edition ?? null,
    supports_uefi: spec.supportsUefi ?? null,
  };
}

function buildInsertQuery(rows) {
  const staticColumns = ["category", "name", "sort_order", "price_huf", "image_url", "specifications", "featured_shop", "featured_shop_order"];
  const allColumns = [...staticColumns, ...FLAT_SPEC_COLUMNS];
  const values = [];
  const placeholders = rows
    .map(([category, name, sortOrder, priceHuf, imageUrl, specifications, featuredShop = false, featuredShopOrder = null], index) => {
      const normalized = normalizeSpecifications(specifications);
      const rowValues = [category, name, sortOrder, priceHuf, imageUrl, JSON.stringify(specifications), featuredShop, featuredShopOrder];

      for (const column of FLAT_SPEC_COLUMNS) {
        rowValues.push(normalized[column]);
      }

      const start = index * allColumns.length;
      const rowPlaceholders = rowValues
        .map((_, valueIndex) => {
          const position = start + valueIndex + 1;
          if (valueIndex === 5) {
            return `$${position}::jsonb`;
          }

          return `$${position}`;
        })
        .join(", ");

      values.push(...rowValues);
      return `(${rowPlaceholders})`;
    })
    .join(", ");

  const conflictUpdates = [
    "sort_order = EXCLUDED.sort_order",
    "price_huf = EXCLUDED.price_huf",
    "image_url = EXCLUDED.image_url",
    "specifications = EXCLUDED.specifications",
    "featured_shop = EXCLUDED.featured_shop",
    "featured_shop_order = EXCLUDED.featured_shop_order",
    ...FLAT_SPEC_COLUMNS.map((column) => `${column} = EXCLUDED.${column}`),
    "updated_at = NOW()",
  ];

  return {
    text: `
      INSERT INTO pc_components (${allColumns.join(", ")})
      VALUES ${placeholders}
      ON CONFLICT (category, name) DO UPDATE
      SET ${conflictUpdates.join(",\n          ")}
    `,
    values,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Set it to your Neon connection string first.");
  }

  const client = await pool.connect();

  try {
    const { rawCatalog, detailedCatalog } = await loadCatalog();

    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS pc_components (
        id BIGSERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        price_huf INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
        featured_shop BOOLEAN NOT NULL DEFAULT false,
        featured_shop_order INTEGER,
        brand TEXT,
        model TEXT,
        socket TEXT,
        cores INTEGER,
        threads INTEGER,
        boost_clock_ghz NUMERIC(4,2),
        integrated_graphics BOOLEAN,
        tdp_w INTEGER,
        form_factor TEXT,
        memory_type TEXT,
        wifi BOOLEAN,
        pcie TEXT,
        m2_slots INTEGER,
        case_type TEXT,
        motherboard_support TEXT[],
        side_panel TEXT,
        max_gpu_length_mm INTEGER,
        preinstalled_fans INTEGER,
        memory_gb INTEGER,
        gpu_memory_type TEXT,
        outputs TEXT[],
        recommended_psu_w INTEGER,
        ray_tracing BOOLEAN,
        capacity_gb INTEGER,
        ram_type TEXT,
        speed_mts INTEGER,
        kit TEXT,
        rgb BOOLEAN,
        wattage INTEGER,
        psu_form_factor TEXT,
        modular BOOLEAN,
        efficiency TEXT,
        pcie5_ready BOOLEAN,
        interface TEXT,
        rpm INTEGER,
        cache_mb INTEGER,
        drive_type TEXT,
        writing_support TEXT[],
        external BOOLEAN,
        cooler_type TEXT,
        heatpipes INTEGER,
        fans INTEGER,
        height_mm INTEGER,
        socket_support TEXT[],
        radiator_mm INTEGER,
        pump_speed_rpm INTEGER,
        size_inch INTEGER,
        resolution TEXT,
        panel TEXT,
        refresh_hz INTEGER,
        adaptive_sync BOOLEAN,
        layout TEXT,
        connection TEXT[],
        switch_type TEXT,
        backlight BOOLEAN,
        hot_swappable BOOLEAN,
        sensor_dpi INTEGER,
        weight_g INTEGER,
        buttons INTEGER,
        usage_category TEXT,
        family TEXT,
        architecture TEXT,
        license_type TEXT,
        edition TEXT,
        supports_uefi BOOLEAN,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (category, name)
      )
    `);

    await client.query("ALTER TABLE pc_components ADD COLUMN IF NOT EXISTS price_huf INTEGER NOT NULL DEFAULT 0");
    await client.query("ALTER TABLE pc_components ADD COLUMN IF NOT EXISTS image_url TEXT");
    await client.query("ALTER TABLE pc_components ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb");
    await client.query("ALTER TABLE pc_components ADD COLUMN IF NOT EXISTS featured_shop BOOLEAN NOT NULL DEFAULT false");
    await client.query("ALTER TABLE pc_components ADD COLUMN IF NOT EXISTS featured_shop_order INTEGER");
    await client.query(`
      ALTER TABLE pc_components
      ADD COLUMN IF NOT EXISTS brand TEXT,
      ADD COLUMN IF NOT EXISTS model TEXT,
      ADD COLUMN IF NOT EXISTS socket TEXT,
      ADD COLUMN IF NOT EXISTS cores INTEGER,
      ADD COLUMN IF NOT EXISTS threads INTEGER,
      ADD COLUMN IF NOT EXISTS boost_clock_ghz NUMERIC(4,2),
      ADD COLUMN IF NOT EXISTS integrated_graphics BOOLEAN,
      ADD COLUMN IF NOT EXISTS tdp_w INTEGER,
      ADD COLUMN IF NOT EXISTS form_factor TEXT,
      ADD COLUMN IF NOT EXISTS memory_type TEXT,
      ADD COLUMN IF NOT EXISTS wifi BOOLEAN,
      ADD COLUMN IF NOT EXISTS pcie TEXT,
      ADD COLUMN IF NOT EXISTS m2_slots INTEGER,
      ADD COLUMN IF NOT EXISTS case_type TEXT,
      ADD COLUMN IF NOT EXISTS motherboard_support TEXT[],
      ADD COLUMN IF NOT EXISTS side_panel TEXT,
      ADD COLUMN IF NOT EXISTS max_gpu_length_mm INTEGER,
      ADD COLUMN IF NOT EXISTS preinstalled_fans INTEGER,
      ADD COLUMN IF NOT EXISTS memory_gb INTEGER,
      ADD COLUMN IF NOT EXISTS gpu_memory_type TEXT,
      ADD COLUMN IF NOT EXISTS outputs TEXT[],
      ADD COLUMN IF NOT EXISTS recommended_psu_w INTEGER,
      ADD COLUMN IF NOT EXISTS ray_tracing BOOLEAN,
      ADD COLUMN IF NOT EXISTS capacity_gb INTEGER,
      ADD COLUMN IF NOT EXISTS ram_type TEXT,
      ADD COLUMN IF NOT EXISTS speed_mts INTEGER,
      ADD COLUMN IF NOT EXISTS kit TEXT,
      ADD COLUMN IF NOT EXISTS rgb BOOLEAN,
      ADD COLUMN IF NOT EXISTS wattage INTEGER,
      ADD COLUMN IF NOT EXISTS psu_form_factor TEXT,
      ADD COLUMN IF NOT EXISTS modular BOOLEAN,
      ADD COLUMN IF NOT EXISTS efficiency TEXT,
      ADD COLUMN IF NOT EXISTS pcie5_ready BOOLEAN,
      ADD COLUMN IF NOT EXISTS interface TEXT,
      ADD COLUMN IF NOT EXISTS rpm INTEGER,
      ADD COLUMN IF NOT EXISTS cache_mb INTEGER,
      ADD COLUMN IF NOT EXISTS drive_type TEXT,
      ADD COLUMN IF NOT EXISTS writing_support TEXT[],
      ADD COLUMN IF NOT EXISTS external BOOLEAN,
      ADD COLUMN IF NOT EXISTS cooler_type TEXT,
      ADD COLUMN IF NOT EXISTS heatpipes INTEGER,
      ADD COLUMN IF NOT EXISTS fans INTEGER,
      ADD COLUMN IF NOT EXISTS height_mm INTEGER,
      ADD COLUMN IF NOT EXISTS socket_support TEXT[],
      ADD COLUMN IF NOT EXISTS radiator_mm INTEGER,
      ADD COLUMN IF NOT EXISTS pump_speed_rpm INTEGER,
      ADD COLUMN IF NOT EXISTS size_inch INTEGER,
      ADD COLUMN IF NOT EXISTS resolution TEXT,
      ADD COLUMN IF NOT EXISTS panel TEXT,
      ADD COLUMN IF NOT EXISTS refresh_hz INTEGER,
      ADD COLUMN IF NOT EXISTS adaptive_sync BOOLEAN,
      ADD COLUMN IF NOT EXISTS layout TEXT,
      ADD COLUMN IF NOT EXISTS connection TEXT[],
      ADD COLUMN IF NOT EXISTS switch_type TEXT,
      ADD COLUMN IF NOT EXISTS backlight BOOLEAN,
      ADD COLUMN IF NOT EXISTS hot_swappable BOOLEAN,
      ADD COLUMN IF NOT EXISTS sensor_dpi INTEGER,
      ADD COLUMN IF NOT EXISTS weight_g INTEGER,
      ADD COLUMN IF NOT EXISTS buttons INTEGER,
      ADD COLUMN IF NOT EXISTS usage_category TEXT,
      ADD COLUMN IF NOT EXISTS family TEXT,
      ADD COLUMN IF NOT EXISTS architecture TEXT,
      ADD COLUMN IF NOT EXISTS license_type TEXT,
      ADD COLUMN IF NOT EXISTS edition TEXT,
      ADD COLUMN IF NOT EXISTS supports_uefi BOOLEAN
    `);

    await client.query(`TRUNCATE TABLE pc_components`);

    const rows = Object.entries(rawCatalog).flatMap(([category, names]) =>
      names.map((name, index) => {
        const detail = detailedCatalog?.[category]?.find((item) => item.name === name);

        return [
          category,
          name,
          index + 1,
          detail?.priceHuf ?? 0,
          null,
          detail?.specifications ?? {},
        ];
      }),
    );

    const featuredRows = pickFeaturedRows(rows, FEATURED_COUNT);
    const featuredKeys = new Map(featuredRows.map(([category, name]) => [`${category}:${name}`, true]));

    const rowsWithFeaturedFlags = rows.map((row) => {
      const [category, name] = row;
      const featuredRow = featuredRows.find(([featuredCategory, featuredName]) => featuredCategory === category && featuredName === name);

      if (!featuredKeys.has(`${category}:${name}`)) {
        return [...row, false, null];
      }

      return [...row, true, featuredRow[7]];
    });

    for (const rowsChunk of chunk(rowsWithFeaturedFlags, 100)) {
      const { text, values } = buildInsertQuery(rowsChunk);
      await client.query(text, values);
    }

    await client.query("COMMIT");

    console.log(`Seeded ${rows.length} PC components into Neon.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed pc_components:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });