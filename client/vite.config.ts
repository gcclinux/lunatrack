import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Read settings.json to configure dev server port and optional SSL
function readSettings() {
  try {
    const settingsPath = path.resolve(__dirname, '../data/settings.json')
    if (!fs.existsSync(settingsPath)) return {}
    const raw = fs.readFileSync(settingsPath, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Could not read settings.json for Vite config', e)
    return {}
  }
}

const settings = readSettings()
const mode = process.env.CLIENT_MODE || 'http'
const isHttps = mode === 'https'
let port = settings.httpPort ?? 5173
if (isHttps) port = settings.httpsPort ?? port

let httpsOption: boolean | { key: string; cert: string } = false
if (isHttps) {
  const ssl = settings.SSL
  if (ssl && ssl.certFile && ssl.keyFile) {
    const certPath = path.isAbsolute(ssl.certFile) ? ssl.certFile : path.resolve(__dirname, '../', ssl.certFile)
    const keyPath = path.isAbsolute(ssl.keyFile) ? ssl.keyFile : path.resolve(__dirname, '../', ssl.keyFile)
    try {
      httpsOption = {
        cert: fs.readFileSync(certPath, 'utf8'),
        key: fs.readFileSync(keyPath, 'utf8')
      } as any
    } catch (e) {
      console.warn('Failed to load SSL files for Vite, falling back to https:true (self-signed).', e)
      httpsOption = true
    }
  } else {
    // let Vite create a self-signed certificate if no files provided
    httpsOption = true
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(port),
    host: '0.0.0.0', // Explicitly bind to all interfaces
    strictPort: false, // Allow fallback if port is taken
    https: httpsOption as any,
    proxy: {
      '/api': {
        target: `${isHttps ? 'https' : 'http'}://localhost:${settings.apiPort ?? 3001}`,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
