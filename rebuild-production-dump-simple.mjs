import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const root = process.cwd();
const outputPath = path.join(root, 'Production-fixed.sql');
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

const fkRes = await client.query(`
  SELECT tc.table_name AS child_table, ccu.table_name AS parent_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND ccu.table_schema = 'public'
`);

const parentsByTable = new Map(tables.map((table) => [table, []]));
for (const row of fkRes.rows) {
  if (parentsByTable.has(row.child_table) && parentsByTable.has(row.parent_table)) {
    parentsByTable.get(row.child_table).push(row.parent_table);
  }
}

const order = [];
const visited = new Set();
const visiting = new Set();
function visit(table) {
  if (visited.has(table)) return;
  if (visiting.has(table)) throw new Error(`Cycle at ${table}`);
  visiting.add(table);
  for (const parent of parentsByTable.get(table) || []) {
    if (parentsByTable.has(parent)) visit(parent);
  }
  visiting.delete(table);
  visited.add(table);
  order.push(table);
}
for (const table of tables) visit(table);

const lines = [];
lines.push('-- Production database export (dependency-ordered)');
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('BEGIN;');

for (const table of order) {
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

lines.push('COMMIT;');
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
