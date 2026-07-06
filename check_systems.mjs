import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/prism' });
pool.query("SELECT id, name, slug, vendor_id, status FROM systems;").then(r => {
  console.log('systems:', r.rows);
  pool.end();
});