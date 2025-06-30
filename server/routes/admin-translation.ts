import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';

const router = Router();

const EN_PATH = path.join(__dirname, '../../shared/locales/en.json');
const AR_PATH = path.join(__dirname, '../../shared/locales/ar.json');
const USED_KEYS_PATH = path.join(__dirname, '../../shared/locales/used-keys.json');

// Helper to flatten nested JSON
function flatten(obj: any, prefix = ''): Record<string, string> {
  let res: Record<string, string> = {};
  for (const k in obj) {
    const value = obj[k];
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof value === 'object' && value !== null) {
      Object.assign(res, flatten(value, newKey));
    } else {
      res[newKey] = value;
    }
  }
  return res;
}

// Helper to unflatten flat keys into nested JSON
function unflatten(flat: Record<string, string>) {
  const result: any = {};
  for (const key in flat) {
    const keys = key.split('.');
    let cur = result;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        cur[k] = flat[key];
      } else {
        if (!cur[k]) cur[k] = {};
        cur = cur[k];
      }
    });
  }
  return result;
}

router.get('/api/admin/translations', async (req, res) => {
  const [enRaw, arRaw, usedKeysRaw] = await Promise.all([
    fs.readFile(EN_PATH, 'utf8'),
    fs.readFile(AR_PATH, 'utf8'),
    fs.readFile(USED_KEYS_PATH, 'utf8'),
  ]);
  const en = flatten(JSON.parse(enRaw));
  const ar = flatten(JSON.parse(arRaw));
  const usedKeys: string[] = JSON.parse(usedKeysRaw);
  const allKeys = Array.from(new Set([...Object.keys(en), ...Object.keys(ar), ...usedKeys]));
  const rows = allKeys.map(key => ({
    key,
    en: en[key] ?? '',
    ar: ar[key] ?? '',
    used: usedKeys.includes(key),
    missingEn: !en[key],
    missingAr: !ar[key],
    unused: !usedKeys.includes(key),
  }));
  const summary = {
    total: rows.length,
    missingEn: rows.filter(r => r.missingEn).length,
    missingAr: rows.filter(r => r.missingAr).length,
    unused: rows.filter(r => r.unused).length,
    used: rows.filter(r => r.used).length,
  };
  res.json({ rows, summary });
});

router.patch('/api/admin/translations', async (req, res) => {
  const { key, lang, value } = req.body;
  if (!['en', 'ar'].includes(lang)) return res.status(400).json({ error: 'Invalid language' });
  const filePath = lang === 'en' ? EN_PATH : AR_PATH;
  const raw = await fs.readFile(filePath, 'utf8');
  const json = JSON.parse(raw);
  // flatten, update, unflatten
  const flat = flatten(json);
  flat[key] = value;
  const updated = unflatten(flat);
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
  res.json({ success: true });
});

// POST /api/admin/translations/scan - Run the translation key scan script
router.post('/scan', async (req, res) => {
  // Optionally: add authentication/authorization here
  try {
    exec('node scripts/scan-translation-keys.js', { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: stderr || error.message });
      }
      res.json({ success: true, output: stdout });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to run scan script' });
  }
});

export default router; 