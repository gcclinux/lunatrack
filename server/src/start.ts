import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import app from './index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../data')

function readSettings() {
  const p = path.join(DATA_DIR, 'settings.json')
  if (!fs.existsSync(p)) throw new Error('settings.json not found')
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

async function start() {
  const mode = process.env.START_MODE || process.argv[2] || 'http' // 'http' or 'https'
  const settings = readSettings()
  // Use apiPort from settings.json as the primary API bind port. Allow
  // an environment override via PORT if desired. If neither is present,
  // fall back to 3001 for safety.
  const apiPort = (typeof settings.apiPort === 'number' ? settings.apiPort : undefined) ?? (process.env.PORT ? Number(process.env.PORT) : 3001)

  if (mode === 'https') {
    const ssl = settings.SSL
    if (!ssl || !ssl.certFile || !ssl.keyFile) {
      console.error('SSL config not found in settings.json; cannot start HTTPS')
      process.exit(1)
    }
    const certPath = path.isAbsolute(ssl.certFile) ? ssl.certFile : path.join(DATA_DIR, ssl.certFile)
    const keyPath = path.isAbsolute(ssl.keyFile) ? ssl.keyFile : path.join(DATA_DIR, ssl.keyFile)
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.error('SSL files not found:', certPath, keyPath)
      process.exit(1)
    }
    const options = {
      cert: fs.readFileSync(certPath, 'utf8'),
      key: fs.readFileSync(keyPath, 'utf8')
    }
    https.createServer(options, app).listen(apiPort, () => {
      console.log(`LunaTrack HTTPS server running on https://localhost:${apiPort}`)
    })
  } else {
    http.createServer(app).listen(apiPort, () => {
      console.log(`LunaTrack HTTP server running on http://localhost:${apiPort}`)
    })
  }
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
