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
      // try absolute first, then resolve relative to project root, then DATA_DIR
      let certPath = ssl.certFile
      let keyPath = ssl.keyFile
      const projectRoot = path.resolve(__dirname, '..')
      const dataDir = path.resolve(projectRoot, 'data')
      if (!path.isAbsolute(certPath)) {
        const cleaned = certPath.replace(/^data[\\/]/, '')
        const candidate1 = path.resolve(projectRoot, cleaned)
        const candidate2 = path.resolve(dataDir, cleaned)
        if (fs.existsSync(candidate1)) certPath = candidate1
        else certPath = candidate2
      }
      if (!path.isAbsolute(keyPath)) {
        const cleaned = keyPath.replace(/^data[\\/]/, '')
        const candidate1 = path.resolve(projectRoot, cleaned)
        const candidate2 = path.resolve(dataDir, cleaned)
        if (fs.existsSync(candidate1)) keyPath = candidate1
        else keyPath = candidate2
      }
      console.log('Vite SSL paths resolved to', certPath, keyPath)
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
