const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function inferSpecsByPrice(price) {
  if (!Number.isFinite(price)) price = 0;
  if (price < 400000) {
    return {
      cpu: 'Intel Core i3-12100 / Ryzen 3 4100',
      gpu: 'NVIDIA GTX 1650 / Integrált',
      ram: '8GB DDR4',
      storage: '256GB NVMe SSD',
      motherboard: 'H610 / B450',
      psu: '450W 80+ Bronze',
      case: 'Kompakt mid-tower',
      os: 'Windows 11 Home (opcionális)'
    };
  }

  if (price < 700000) {
    return {
      cpu: 'Intel Core i5-12400 / Ryzen 5 5600',
      gpu: 'NVIDIA RTX 3060 8GB',
      ram: '16GB DDR4 (2x8GB)',
      storage: '512GB NVMe SSD',
      motherboard: 'B660 / B550',
      psu: '650W 80+ Bronze',
      cooling: 'Közepes léghűtés',
      case: 'Közepes tower',
      os: 'Windows 11 Pro (opcionális)'
    };
  }

  return {
    cpu: 'Intel Core i7-12700K / Ryzen 7 5800X',
    gpu: 'NVIDIA RTX 4070 vagy hasonló',
    ram: '32GB DDR4/DDR5 (2x16GB)',
    storage: '1TB NVMe SSD + 2TB HDD',
    motherboard: 'Z690 / X570',
    psu: '750W 80+ Gold',
    cooling: '240mm AIO vízhűtés',
    case: 'Full tower / nagy légáramlású ház',
    os: 'Windows 11 Pro (opcionális)'
  };
}

async function main() {
  try {
    console.log('Connecting to database...');
    const res = await pool.query('SELECT id, name, price_huf, specifications FROM prebuilt_pc_bundles ORDER BY id ASC');
    if (res.rowCount === 0) {
      console.log('No prebuilts found in prebuilt_pc_bundles.');
      return;
    }

    for (const row of res.rows) {
      const hasSpecs = row.specifications && (typeof row.specifications === 'object' ? Object.keys(row.specifications).length > 0 : String(row.specifications).trim() !== '');
      if (hasSpecs) {
        console.log(`Skipping id=${row.id} (${row.name}) — already has specifications`);
        continue;
      }

      const inferred = inferSpecsByPrice(Number(row.price_huf));
      // include a few extra fields derived from name/price
      const specs = Object.assign({ price_hint_huf: row.price_huf }, inferred);

      const upd = await pool.query(
        `UPDATE prebuilt_pc_bundles SET specifications = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING id`,
        [JSON.stringify(specs), row.id]
      );

      console.log(`Updated id=${upd.rows[0].id} (${row.name}) with inferred specifications`);
    }

    console.log('Update complete.');
  } catch (err) {
    console.error('Error updating prebuilts:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) main();
