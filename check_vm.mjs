import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/prism' });
pool.query("SELECT * FROM vendor_members;").then(r => {
  console.log('vendor_members:', r.rows);
  pool.end();
});