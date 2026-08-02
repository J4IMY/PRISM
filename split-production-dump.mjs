import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.join(root, 'Production.sql');
const outputBase = 'Production-part';
const maxBytes = 700_000;

const content = fs.readFileSync(inputPath, 'utf8');
const statements = [];
let buffer = '';
let inSingleQuote = false;
let inDoubleQuote = false;

for (let i = 0; i < content.length; i += 1) {
  const ch = content[i];
  const next = content[i + 1];

  if (inSingleQuote) {
    buffer += ch;
    if (ch === "'" && next === "'") {
      buffer += next;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = false;
    }
    continue;
  }

  if (inDoubleQuote) {
    buffer += ch;
    if (ch === '"') {
      inDoubleQuote = false;
    }
    continue;
  }

  if (ch === "'") {
    inSingleQuote = true;
    buffer += ch;
    continue;
  }

  if (ch === '"') {
    inDoubleQuote = true;
    buffer += ch;
    continue;
  }

  if (ch === ';') {
    const stmt = (buffer + ch).trim();
    if (stmt) {
      statements.push(stmt);
    }
    buffer = '';
    continue;
  }

  buffer += ch;
}

if (buffer.trim()) {
  statements.push(buffer.trim());
}

const files = [];
let current = [];
let currentBytes = 0;

for (const statement of statements) {
  const stmtText = `${statement}\n`;
  const bytes = Buffer.byteLength(stmtText, 'utf8');
  if (current.length > 0 && currentBytes + bytes > maxBytes) {
    files.push(current);
    current = [];
    currentBytes = 0;
  }
  current.push(stmtText);
  currentBytes += bytes;
}

if (current.length > 0) {
  files.push(current);
}

for (let index = 0; index < files.length; index += 1) {
  const partNumber = String(index + 1).padStart(2, '0');
  const outputPath = path.join(root, `${outputBase}-${partNumber}.sql`);
  const body = files[index].join('');
  const out = `-- Split export part ${index + 1} of ${files.length}\n-- Generated from Production.sql\nBEGIN;\n${body}COMMIT;\n`;
  fs.writeFileSync(outputPath, out, 'utf8');
}

console.log(`Created ${files.length} files.`);
for (let index = 0; index < files.length; index += 1) {
  const partNumber = String(index + 1).padStart(2, '0');
  const outputPath = path.join(root, `${outputBase}-${partNumber}.sql`);
  const stats = fs.statSync(outputPath);
  console.log(`${outputPath} (${stats.size} bytes)`);
}
