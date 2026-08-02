import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.join(root, 'Production-safe.sql');
const outputPath = path.join(root, 'Production-safe-no-images.sql');

let text = fs.readFileSync(inputPath, 'utf8');

text = text.replace(/'data:image\/[^']*'/gi, "''");
text = text.replace(/'https?:\/\/[^']*\.(png|jpg|jpeg|gif|webp|svg)([^']*)'/gi, "''");
text = text.replace(/'https?:\/\/[^']*'/gi, "''");
text = text.replace(/\bhttps?:\/\/[^\s)';,]+/gi, "''");

fs.writeFileSync(outputPath, text, 'utf8');
console.log(`Wrote ${outputPath}`);
