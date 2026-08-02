import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const root = process.cwd();
const outputPath = path.join(root, 'Production-safe.sql');
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prism';
const client = new Client({ connectionString });
await client.connect();

const tablesRes = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`);
const tables = tablesRes.rows.map((row) => row.table_name).filter((name) => name !== 'schema_migrations');

const lines = [];
lines.push('-- Production database export (safe import)');
lines.push('-- Disables foreign key checks during load, then re-enables them.');
lines.push('');
lines.push('SET CONSTRAINTS ALL DEFERRED;');
lines.push('');

for (const table of tables) {
  const columnsRes = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [table]);
  const columns = columnsRes.rows.map((row) => row.column_name);
  if (!columns.length) continue;

  const rowsRes = await client.query(`SELECT * FROM "${table}"`);
  if (!rowsRes.rows.length) continue;

  lines.push(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
  for (const row of rowsRes.rows) {
    const columnList = columns.map((col) => `"${col.replace(/"/g, '""')}"`).join(', ');
    const valueList = columns.map((col) => quoteSql(row[col]));
    lines.push(`INSERT INTO "${table}" (${columnList}) VALUES (${valueList.join(', ')});`);
  }
}

lines.push('');
lines.push('SET CONSTRAINTS ALL IMMEDIATE;');
fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${outputPath}`);
await client.end();

function quoteSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (Buffer.isBuffer(value)) return `E'\\x${value.toString('hex')}'`;
  if (Array.isArray(value) || typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
