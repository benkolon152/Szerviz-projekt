const pg = require("pg");
require("dotenv").config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const PREBUILT_ROWS = [
  {
    name: "Starter Game Box",
    price_huf: 329900,
    image_url: "white.png",
    description: "Belépő szintű előre összeszerelt gép játékra és tanulásra.",
    specifications: {
      cpu: "Intel Core i3-12100 / AMD Ryzen 3 4100",
      gpu: "NVIDIA GTX 1650 4GB vagy gyengébb integrált megoldás",
      ram: "8GB DDR4 (1x8GB)",
      storage: "256GB NVMe SSD",
      motherboard: "H610 / B450 alaplap",
      psu: "450W, 80+ Bronze",
      case: "Kompakt mid-tower",
      os: "Windows 11 Home (opcionális)",
      target: "Belépő játék és általános használat"
    }
  },
  {
    name: "Balanced Creator PC",
    price_huf: 569900,
    image_url: "white.png",
    description: "Kiegyensúlyozott konfiguráció játékhoz, munkához és tartalomgyártáshoz.",
    specifications: {
      cpu: "Intel Core i5-12400 / AMD Ryzen 5 5600",
      gpu: "NVIDIA RTX 3060 8GB vagy hasonló",
      ram: "16GB DDR4 (2x8GB)",
      storage: "512GB NVMe SSD (+ opcionális 1TB HDD)",
      motherboard: "B660 / B550 alaplap",
      psu: "650W, 80+ Bronze",
      cooling: "Léghűtés közepes teljesítményű ventilátorral",
      case: "Közepes méretű tower",
      os: "Windows 11 Pro (opcionális)",
      target: "Tartalomgyártás és játék közepes/ magas beállításokkal"
    }
  },
  {
    name: "Pro Performance Tower",
    price_huf: 899900,
    image_url: "white.png",
    description: "Erős előre összeállított PC komolyabb teljesítményigényekhez.",
    specifications: {
      cpu: "Intel Core i7-12700K / AMD Ryzen 7 5800X",
      gpu: "NVIDIA RTX 4070 12GB vagy hasonló magasabb kategória",
      ram: "32GB DDR4/DDR5 (2x16GB)",
      storage: "1TB NVMe SSD + 2TB HDD",
      motherboard: "Z690 / X570 alaplap",
      psu: "750W, 80+ Gold",
      cooling: "240mm AIO vízhűtés",
      case: "Full tower vagy magasabb légáramlású középkategória",
      os: "Windows 11 Pro (opcionális)",
      target: "Professzionális munkaállomás, streamelés, modern játékok magas beállításokkal"
    }
  }
];

async function main() {
  try {
    console.log("Connecting to database...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prebuilt_pc_bundles (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price_huf INTEGER NOT NULL,
        image_url TEXT,
        description TEXT,
        specifications JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (name)
      )
    `);

    const insertSql = `
      INSERT INTO prebuilt_pc_bundles (name, price_huf, image_url, description, specifications)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO UPDATE SET
        price_huf = EXCLUDED.price_huf,
        image_url = EXCLUDED.image_url,
        description = EXCLUDED.description,
        specifications = EXCLUDED.specifications,
        updated_at = NOW()
      RETURNING id, name
    `;

    for (const row of PREBUILT_ROWS) {
      const res = await pool.query(insertSql, [
        row.name,
        row.price_huf,
        row.image_url,
        row.description,
        row.specifications,
      ]);
      console.log(`Upserted prebuilt: ${res.rows[0].name} (id=${res.rows[0].id})`);
    }

    console.log("Seeding prebuilts finished.");
  } catch (err) {
    console.error("Error seeding prebuilts:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
