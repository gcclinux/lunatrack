import { useEffect, useMemo, useState } from 'react'
import { Calendar } from './Calendar'
import { Stats } from './Stats'
import { Settings } from './Settings'
import { History } from './History'
import { api } from '../utils/api'
import type { AppEntries, Settings as SettingsType } from '../utils/types'

export default function App() {
  const [tab, setTab] = useState<'track' | 'stats' | 'history' | 'settings'>('track')
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [entries, setEntries] = useState<AppEntries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getSettings()
        setSettings(s)
        const e = await api.getEntries()
        setEntries(e)
      } catch (e: any) {
        setError(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const today = useMemo(() => new Date().toISOString().slice(0,10), [])

  async function toggleDate(date: string) {
    if (!entries) return
    try {
      setError(null)
      const exists = entries.entries.includes(date)
      const updated = exists ? await api.deleteEntry(date) : await api.addEntry(date)
      setEntries((prev: AppEntries | null) => prev ? { ...prev, entries: updated.entries } : prev)
      // refresh stats after mutation
      const e = await api.getEntries()
      setEntries(e)
    } catch (e: any) {
      setError(e.message || 'Error updating entry')
    }
  }

  async function saveSettings(next: SettingsType) {
    try {
      setError(null)
      const saved = await api.updateSettings(next)
      setSettings(saved)
      const e = await api.getEntries()
      setEntries(e)
    } catch (e: any) {
      setError(e.message || 'Could not save settings')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-rose-900">Loading…</div>
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-700">{error}</div>
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-rose-900">{settings?.username || 'Joanna Tracker'}</h1>
        <nav className="flex gap-2">
          <button className={`btn btn-ghost ${tab==='track'?'bg-rose-200':''}`} onClick={() => setTab('track')}>Track</button>
          <button className={`btn btn-ghost ${tab==='stats'?'bg-rose-200':''}`} onClick={() => setTab('stats')}>Stats</button>
          <button className={`btn btn-ghost ${tab==='history'?'bg-rose-200':''}`} onClick={() => setTab('history')}>History</button>
          <button className={`btn btn-ghost ${tab==='settings'?'bg-rose-200':''}`} onClick={() => setTab('settings')}>Settings</button>
        </nav>
      </header>

      {/* Consistent content sizing for all tabs */}
      <div className="min-h-[32rem] flex flex-col">
        {tab === 'track' && (
          <div className="grid md:grid-cols-2 gap-4 flex-1">
            <div className="card">
              <h2 className="text-lg font-medium mb-2">Calendar</h2>
              <Calendar
                selectedDates={entries?.entries ?? []}
                onToggleDate={toggleDate}
                today={today}
              />
            </div>
            <div className="card">
              <h2 className="text-lg font-medium mb-2">Recent entries</h2>
              <ul className="space-y-1">
                {entries?.entries.slice().reverse().slice(0, 9).map((d: string) => (
                  <li key={d} className="flex items-center justify-between">
                    <span>{d}</span>
                    <button className="btn btn-ghost text-rose-700" onClick={() => toggleDate(d)}>remove</button>
                  </li>
                ))}
                {entries?.entries.length === 0 && <li className="text-rose-600">No entries yet. Click a date on the calendar to add your last period start.</li>}
              </ul>
            </div>
          </div>
        )}

        {tab === 'stats' && entries && (
          <div className="flex-1"><Stats data={entries} /></div>
        )}

        {tab === 'history' && entries && (
          <div className="flex-1"><History entries={entries.entries} onToggleDate={toggleDate} today={today} /></div>
        )}

        {tab === 'settings' && settings && (
          <div className="flex-1"><Settings settings={settings} onSave={saveSettings} /></div>
        )}
      </div>

      <footer className="mt-8 text-center text-sm text-rose-600">
        Your data is stored locally in JSON files. No cloud, no ads.
      </footer>
    </div>
  )
}
