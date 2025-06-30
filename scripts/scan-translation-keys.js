import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../client/src');
const OUTPUT_FILE = path.join(__dirname, '../shared/locales/used-keys.json');
const FILE_EXTENSIONS = ['.tsx', '.ts'];

const TRANSLATION_REGEX = /(?:t|i18n\.t)\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (FILE_EXTENSIONS.includes(path.extname(file))) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function extractKeysFromFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const keys = new Set();
  let match;
  while ((match = TRANSLATION_REGEX.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

function main() {
  const files = walk(SRC_DIR);
  const allKeys = new Set();
  files.forEach(file => {
    extractKeysFromFile(file).forEach(key => allKeys.add(key));
  });
  const sortedKeys = Array.from(allKeys).sort();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedKeys, null, 2), 'utf8');
  console.log(`Found ${sortedKeys.length} unique translation keys. Output written to ${OUTPUT_FILE}`);
}

main(); 