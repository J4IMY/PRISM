import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/prism' });
pool.query("SELECT * FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%pricing%';").then(r => {
  console.log('pricing tables:', r.rows);
  pool.end();
});