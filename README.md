# LunaTrack (Period & Cycle Tracker)

A simple, pretty, privacy-first period tracker. Choose dates on a calendar, see past entries, current cycle status, an estimate for the next period, and future predictions based on your average cycle length. Settings like username and data filename are stored locally.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Storage: JSON files on disk (no database)

## Dev Quickstart
- Install deps
- Start backend and frontend in dev mode
- The app will be available on http://localhost:5173 and backend on http://localhost:3001

See detailed commands at the bottom.

## Features
- Calendar to add/remove period start dates
- Past entries list
- Current cycle stats: days since last period, average cycle length
- Next period estimate and a few future projections
- Settings: username, data filename, default cycle length (override)
- Local JSON persistence (no cloud)

## Project Structure
```
client/   # Vite React TS frontend
server/   # Express backend, json-file storage
```

## Privacy
Your data lives on your machine in simple JSON files. No remote servers or telemetry.

## License
MIT

---

## Try it
Optional commands if you want to run manually later:

Backend:
- Install: `cd server && npm install`
- Dev: `npm run dev`

Frontend:
- Install: `cd client && npm install`
- Dev: `npm run dev`

Root helper (optional):
- `npm run dev` to start both concurrently (after initial setup)

## API Endpoints

### Health
- `GET /api/health` — Returns `{ ok: true }` if the server is running.

### Settings
- `GET /api/settings` — Get current app settings.
- `PUT /api/settings` — Update app settings. Expects JSON body matching settings schema.
- `GET /api/file-protected` — returns { fileProtected: true|false }
- `PUT /api/file-protected` — set fileProtected by sending { fileProtected: true|false }
- `GET /api/enable-ovulation` — returns { enableOvulation: true|false }.
- `PUT /api/enable-ovulation` — accepts { enableOvulation: true|false }

### Network
- `GET /api/ports` — returns the current HTTP and HTTPS ports.
- `PUT /api/ports` — updates both ports (expects { httpPort, httpsPort } as numbers)
- `GET /api/ssl` — returns the SSL config from settings.
- `PUT /api/ssl` — updates the SSL config in settings (validates certFile and keyFile as strings)

### Entries
- `GET /api/entries` — Get all period entries and stats (cycle length, predictions, etc).
- `POST /api/entries` — Add a new entry. Expects `{ date: 'YYYY-MM-DD' }` in JSON body.
- `DELETE /api/entries/:date` — Remove an entry by date (format: `YYYY-MM-DD`).

### Inspiration
- `GET /api/inspiration/:id` — Get a single inspiration message by id (1–60). Returns `{ id, message }`.

---
All endpoints return JSON. For more details, see `server/src/index.ts`.
