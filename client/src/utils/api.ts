import type { AppEntries, Settings } from './types'

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || res.statusText)
  }
  return res.json()
}

export const api = {
  async getSettings(): Promise<Settings> {
    return getJSON('/api/settings')
  },
  async updateSettings(s: Settings): Promise<Settings> {
    return getJSON('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    })
  },
  async getEntries(): Promise<AppEntries> {
    return getJSON('/api/entries')
  },
  async addEntry(date: string): Promise<{ entries: string[] }> {
    return getJSON('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    })
  },
  async deleteEntry(date: string): Promise<{ entries: string[] }> {
    return getJSON(`/api/entries/${date}`, { method: 'DELETE' })
  }
}
