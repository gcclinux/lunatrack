import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { z } from 'zod';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
// Data directory under project root
const DATA_DIR = path.resolve(__dirname, '../../data');
await fs.ensureDir(DATA_DIR);
// Schemas
const SettingsSchema = z.object({
    username: z.string().min(1).default(''),
    dataFile: z.string().min(1).default('cycles.json'),
    defaultCycleLength: z.number().int().positive().max(120).default(28)
});
const EntrySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
// Helpers
function sortDatesAsc(dates) {
    return [...dates].sort((a, b) => a.localeCompare(b));
}
async function readSettings() {
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    if (!(await fs.pathExists(settingsPath))) {
        const defaults = SettingsSchema.parse({});
        await fs.writeJson(settingsPath, defaults, { spaces: 2 });
        return defaults;
    }
    const raw = await fs.readJson(settingsPath);
    // tolerate partial/older schemas
    return SettingsSchema.parse(raw);
}
async function writeSettings(s) {
    const parsed = SettingsSchema.parse(s);
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    await fs.writeJson(settingsPath, parsed, { spaces: 2 });
    return parsed;
}
async function readEntries(dataFile) {
    const filePath = path.join(DATA_DIR, dataFile);
    if (!(await fs.pathExists(filePath))) {
        await fs.writeJson(filePath, { entries: [] }, { spaces: 2 });
        return [];
    }
    const raw = await fs.readJson(filePath);
    const entries = Array.isArray(raw?.entries) ? raw.entries : [];
    return entries.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
}
async function writeEntries(dataFile, dates) {
    const filePath = path.join(DATA_DIR, dataFile);
    await fs.writeJson(filePath, { entries: sortDatesAsc(dates) }, { spaces: 2 });
}
function diffDays(a, b) {
    const da = new Date(a + 'T00:00:00Z');
    const db = new Date(b + 'T00:00:00Z');
    const ms = db.getTime() - da.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}
function averageCycleLength(dates, fallback) {
    const sorted = sortDatesAsc(dates);
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
        const gap = diffDays(sorted[i - 1], sorted[i]);
        if (gap > 5 && gap < 120)
            gaps.push(gap); // filter obvious noise
    }
    if (gaps.length === 0)
        return fallback;
    const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    return Math.max(20, Math.min(120, avg));
}
function predictNextDates(dates, avgLen, count = 6) {
    if (dates.length === 0)
        return [];
    const last = sortDatesAsc(dates).at(-1);
    const out = [];
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.put('/api/settings', async (req, res) => {
    try {
        const updated = await writeSettings(req.body);
        res.json(updated);
    }
    catch (e) {
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
    }
    catch (e) {
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
    }
    catch (e) {
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
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`moontrack server running on http://localhost:${PORT}`);
});
