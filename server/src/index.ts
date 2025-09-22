import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Data directory under project root
const DATA_DIR = path.resolve(__dirname, '../../data');
await fs.mkdir(DATA_DIR, { recursive: true });

// Minimal helpers replacing fs-extra
async function pathExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readJson<T = any>(p: string): Promise<T> {
  const txt = await fs.readFile(p, 'utf8');
  return JSON.parse(txt) as T;
}

async function writeJson(p: string, data: unknown, opts?: { spaces?: number }) {
  const spaces = opts?.spaces ?? 0;
  const txt = JSON.stringify(data, null, spaces);
  await fs.writeFile(p, txt, 'utf8');
}

// Schemas
const SettingsSchema = z.object({
  pin: z.string().default(''),
  pinEnabled: z.boolean().default(false),
  dataFile: z.string().min(1).default('cycles.json'),
  defaultCycleLength: z.number().int().positive().max(120).default(28)
});

const EntrySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

// Helpers
function sortDatesAsc(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}

async function readSettings(): Promise<z.infer<typeof SettingsSchema>> {
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  if (!(await pathExists(settingsPath))) {
    const defaults = SettingsSchema.parse({});
    await writeJson(settingsPath, defaults, { spaces: 2 });
    return defaults;
  }
  const raw = await readJson(settingsPath);
  // tolerate partial/older schemas
  return SettingsSchema.parse(raw);
}

async function writeSettings(s: unknown) {
  const parsed = SettingsSchema.parse(s);
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  await writeJson(settingsPath, parsed, { spaces: 2 });
  return parsed;
}

async function readEntries(dataFile: string): Promise<string[]> {
  const filePath = path.join(DATA_DIR, dataFile);
  if (!(await pathExists(filePath))) {
    await writeJson(filePath, { entries: [] as string[] }, { spaces: 2 });
    return [];
  }
  const raw = await readJson(filePath);
  const entries = Array.isArray(raw?.entries) ? raw.entries as string[] : [];
  return entries.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
}

async function writeEntries(dataFile: string, dates: string[]) {
  const filePath = path.join(DATA_DIR, dataFile);
  await writeJson(filePath, { entries: sortDatesAsc(dates) }, { spaces: 2 });
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function averageCycleLength(dates: string[], fallback: number): number {
  const sorted = sortDatesAsc(dates);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = diffDays(sorted[i - 1], sorted[i]);
    if (gap > 5 && gap < 120) gaps.push(gap); // filter obvious noise
  }
  if (gaps.length === 0) return fallback;
  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  return Math.max(20, Math.min(120, avg));
}

function predictNextDates(dates: string[], avgLen: number, count = 6): string[] {
  if (dates.length === 0) return [];
  const last = sortDatesAsc(dates).at(-1)!;
  const out: string[] = [];
  const lastDate = new Date(last + 'T00:00:00Z');
  for (let i = 1; i <= count; i++) {
    const d = new Date(lastDate);
    d.setUTCDate(d.getUTCDate() + avgLen * i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/settings', async (_req, res) => {
  try {
    const s = await readSettings();
    res.json(s);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updated = await writeSettings(req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/entries', async (_req, res) => {
  try {
    const s = await readSettings();
    const entries = sortDatesAsc(await readEntries(s.dataFile));
    const avg = averageCycleLength(entries, s.defaultCycleLength);
    const next = predictNextDates(entries, avg, 6);
    const last = entries.at(-1) ?? null;
    const today = new Date().toISOString().slice(0, 10);
    const daysSinceLast = last ? diffDays(last, today) : null;
    const nextDate = next[0] ?? null;
    const daysUntilNext = nextDate ? diffDays(today, nextDate) : null;

    res.json({ entries, averageCycleLength: avg, predictions: next, last, daysSinceLast, nextDate, daysUntilNext });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const s = await readSettings();
    const dataFile = s.dataFile;
    const body = EntrySchema.parse(req.body);
    const list = new Set(await readEntries(dataFile));
    list.add(body.date);
    const dates = sortDatesAsc(Array.from(list));
    await writeEntries(dataFile, dates);
    res.status(201).json({ entries: dates });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/entries/:date', async (req, res) => {
  try {
    const s = await readSettings();
    const dataFile = s.dataFile;
    const date = EntrySchema.shape.date.parse(req.params.date);
    const list = new Set(await readEntries(dataFile));
    list.delete(date);
    const dates = sortDatesAsc(Array.from(list));
    await writeEntries(dataFile, dates);
    res.json({ entries: dates });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Serve a single inspiration message by id
app.get('/api/inspiration/:id', async (req, res) => {
  try {
    const inspirationPath = path.join(DATA_DIR, 'inspiration.json');
    const data = await fs.readFile(inspirationPath, 'utf8');
    const messages = JSON.parse(data);
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const found = Array.isArray(messages) ? messages.find((m) => m.id === id) : null;
    if (found) {
      res.json({ message: found.text, id: found.id });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Could not load inspiration messages' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LunaTrack server running on http://localhost:${PORT}`);
});
