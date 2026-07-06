import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/prism' });
pool.query("SELECT * FROM users WHERE id = 'b3b3c146-1421-4321-b167-7101d3a7a44e';").then(r => {
  console.log('users:', r.rows);
  pool.end();
});