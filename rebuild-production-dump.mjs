import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const root = process.cwd();
const inputPath = path.join(root, 'Production.sql');
const outputPath = path.join(root, 'Production-fixed.sql');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prism';
const client = new Client({ connectionString });
await client.connect();

const sqlText = fs.readFileSync(inputPath, 'utf8');
const dataMarker = '\n-- Data export\n';
const dataIndex = sqlText.indexOf(dataMarker);
if (dataIndex === -1) {
  throw new Error('Could not find data export section in Production.sql');
}

const prefix = sqlText.slice(0, dataIndex + dataMarker.length);
const suffix = sqlText.slice(dataIndex + dataMarker.length);

const tablesRes = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`);

const tables = tablesRes.rows.map((row) => row.table_name).filter((name) => name !== 'schema_migrations');
const tableSet = new Set(tables);

const parentsByTable = new Map();
for (const table of tables) {
  parentsByTable.set(table, []);
}

const fkRes = await client.query(`
  SELECT
    tc.table_name AS child_table,
    ccu.table_name AS parent_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_schema = 'public'
`);

for (const row of fkRes.rows) {
  if (tableSet.has(row.child_table) && tableSet.has(row.parent_table)) {
    parentsByTable.get(row.child_table).push(row.parent_table);
  }
}

const visiting = new Set();
const visited = new Set();
const orderedTables = [];

function visit(table) {
  if (visited.has(table)) return;
  if (visiting.has(table)) return;
  visiting.add(table);
  const parents = parentsByTable.get(table) || [];
  for (const parent of parents) {
    if (tableSet.has(parent)) {
      visit(parent);
    }
  }
  visiting.delete(table);
  visited.add(table);
  orderedTables.push(table);
}

for (const table of tables) {
  visit(table);
}

const dependencyOrderedTables = orderedTables.filter((name) => tableSet.has(name));

const lines = [];
lines.push('-- Data export');
lines.push('BEGIN;');

for (const table of dependencyOrderedTables) {
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

const output = `${sqlText.slice(0, dataIndex + dataMarker.length)}${lines.join('\n')}\n`;
fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Tables ordered: ${dependencyOrderedTables.join(', ')}`);
await client.end();

function quoteSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (Buffer.isBuffer(value)) return `E'\\x${value.toString('hex')}'`;
  if (Array.isArray(value) || typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
