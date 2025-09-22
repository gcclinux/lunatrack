import { useEffect, useMemo, useState } from 'react'
// Export logic reused from Settings
async function exportData() {
  try {
    const response = await fetch('/api/entries')
    const data = await response.json()
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lunatrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    // Set fileProtected to true after export
    try {
      await fetch('/api/file-protected', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileProtected: true })
      })
    } catch {}
  } catch {}
}
import { Calendar } from './Calendar'
import { Stats } from './Stats'
import { Settings } from './Settings'
import { History } from './History'
import { ConfirmDialog } from './ConfirmDialog'
import { PinEntryDialog } from './PinEntryDialog'
import { api } from '../utils/api'
import { formatDate } from '../utils/dateUtils'
import type { AppEntries, Settings as SettingsType } from '../utils/types'

export default function App() {
  // Inspiration message state
  const [inspiration, setInspiration] = useState<string | null>(null);
  useEffect(() => {
    const randomId = Math.floor(Math.random() * 60) + 1;
    fetch(`/api/inspiration/${randomId}`)
      .then(res => res.json())
      .then(data => setInspiration(data.message))
      .catch(() => setInspiration(null));
  }, []);
  const [tab, setTab] = useState<'track' | 'prediction' | 'history' | 'settings'>('track')
  const [fileProtected, setFileProtected] = useState<boolean | null>(null)
  // Check fileProtected status on load/refresh
  useEffect(() => {
    async function checkFileProtected() {
      try {
        const res = await fetch('/api/file-protected')
        const data = await res.json()
        setFileProtected(typeof data.fileProtected === 'boolean' ? data.fileProtected : true)
      } catch {
        setFileProtected(true)
      }
    }
    checkFileProtected()
  }, [])
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [entries, setEntries] = useState<AppEntries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    date?: string
    action?: 'add' | 'remove'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getSettings()
        setSettings(s)
        
        // Check if PIN is enabled and user needs to authenticate
        if (s.pinEnabled && s.pin && s.pin.length >= 4) {
          setShowPinDialog(true)
          setLoading(false)
          return // Don't load entries until authenticated
        } else {
          setIsAuthenticated(true)
        }
        
        const e = await api.getEntries()
        setEntries(e)
      } catch (e: any) {
        setError(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Load entries after successful authentication
  useEffect(() => {
    if (isAuthenticated && settings && !entries) {
      (async () => {
        try {
          const e = await api.getEntries()
          setEntries(e)
        } catch (e: any) {
          setError(e.message || 'Failed to load entries')
        }
      })()
    }
  }, [isAuthenticated, settings, entries])

  const handlePinSuccess = () => {
    setIsAuthenticated(true)
    setShowPinDialog(false)
  }

  const handlePinCancel = () => {
    // For now, just close the dialog - could implement app exit logic here
    setShowPinDialog(false)
    setError('Authentication required to access the app')
  }

  const today = useMemo(() => new Date().toISOString().slice(0,10), [])

  async function toggleDate(date: string) {
    if (!entries) return
    
    const exists = entries.entries.includes(date)
    
    if (!exists) {
      // Adding a new entry - show confirmation
      const lastEntry = entries.last
      let message = `Add this date as a period start?`
      
      if (lastEntry) {
        const daysSince = Math.abs(
          Math.round((new Date(date).getTime() - new Date(lastEntry).getTime()) / (1000 * 60 * 60 * 24))
        )
        message = `Last entry ${formatDate(lastEntry)}\nThis would be ${daysSince} days since your last entry`
      }
      
      setConfirmDialog({
        isOpen: true,
        title: formatDate(date),
        message,
        onConfirm: () => performToggle(date, exists),
        date,
        action: 'add'
      })
    } else {
      // Removing an entry - show confirmation
      setConfirmDialog({
        isOpen: true,
        title: formatDate(date),
        message: `Remove this date from your period tracking?`,
        onConfirm: () => performToggle(date, exists),
        date,
        action: 'remove'
      })
    }
  }

  async function performToggle(date: string, exists: boolean) {
    try {
      setError(null)
      let updated;
      if (!exists) {
        // Add entry, then set fileProtected to false
        updated = await api.addEntry(date)
        // Set fileProtected to false after successful add
        try {
          await fetch('/api/file-protected', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileProtected: false })
          })
        } catch {}
      } else {
        // Remove entry
        updated = await api.deleteEntry(date)
      }
      setEntries((prev: AppEntries | null) => prev ? { ...prev, entries: updated.entries } : prev)
      // refresh stats after mutation
      const e = await api.getEntries()
      setEntries(e)
      setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    } catch (e: any) {
      setError(e.message || 'Error updating entry')
      setConfirmDialog(prev => ({ ...prev, isOpen: false }))
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

  // Show PIN dialog if authentication is required
  if (showPinDialog && settings?.pinEnabled && settings?.pin) {
    return (
      <>
        <div className="min-h-[85vh] flex items-center justify-center text-rose-900">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-rose-400 drop-shadow-sm">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
              </svg>
              <h1 className="text-3xl font-semibold">LunaTrack</h1>
            </div>
            <p className="text-rose-700">Please enter your PIN to continue</p>
          </div>
        </div>
        <PinEntryDialog
          isOpen={showPinDialog}
          expectedPin={settings.pin}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />
      </>
    )
  }

  // Don't render main app until authenticated
  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-rose-900">Authentication required…</div>
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        {/* Mobile layout: stacked */}
        <div className="flex flex-col sm:hidden">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-rose-400 drop-shadow-sm">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
            </svg>
            <h1 className="text-2xl font-semibold text-rose-900 text-center">LunaTrack</h1>
          </div>
          <nav className="flex justify-between w-full">
            <button className={`btn btn-ghost flex-1 mx-0.5 ${tab==='track'?'bg-rose-200':''}`} onClick={() => setTab('track')}>Track</button>
            <button className={`btn btn-ghost flex-1 mx-0.5 ${tab==='prediction'?'bg-rose-200':''}`} onClick={() => setTab('prediction')}>Prediction</button>
            <button className={`btn btn-ghost flex-1 mx-0.5 ${tab==='history'?'bg-rose-200':''}`} onClick={() => setTab('history')}>History</button>
            <button className={`btn btn-ghost flex-1 mx-0.5 ${tab==='settings'?'bg-rose-200':''}`} onClick={() => setTab('settings')}>Settings</button>
          </nav>
        </div>
        
        {/* Desktop layout: side by side */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-rose-400 drop-shadow-sm">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
            </svg>
            <h1 className="text-2xl font-semibold text-rose-900">LunaTrack</h1>
          </div>
          <nav className="flex gap-2">
            <button className={`btn btn-ghost ${tab==='track'?'bg-rose-200':''}`} onClick={() => setTab('track')}>Track</button>
            <button className={`btn btn-ghost ${tab==='prediction'?'bg-rose-200':''}`} onClick={() => setTab('prediction')}>Prediction</button>
            <button className={`btn btn-ghost ${tab==='history'?'bg-rose-200':''}`} onClick={() => setTab('history')}>History</button>
            <button className={`btn btn-ghost ${tab==='settings'?'bg-rose-200':''}`} onClick={() => setTab('settings')}>Settings</button>
          </nav>
        </div>
      </header>

      {/* Consistent content sizing for all tabs */}
      <div className="min-h-[32rem] flex flex-col">
        {tab === 'track' && (
          <div className="grid md:grid-cols-2 gap-4 flex-1">
            <div className="flex flex-col h-full gap-4">
              {/* Inspiring Message of the Day */}
              <div className="card flex-shrink-0">
                <h2 className="text-lg font-medium mb-2">Inspiration</h2>
                <p className="text-rose-700 italic text-base text-center min-h-[3.5rem] flex items-center justify-center">
                  {inspiration ? `"${inspiration}"` : 'Loading inspiration…'}
                </p>
              </div>
              {/* Recent Entries (half height) */}
              <div className="card flex-1 min-h-0 overflow-y-auto">
                <h2 className="text-lg font-medium mb-2">Recent entries</h2>
                <ul className="space-y-2.5">
                  <li className="flex items-center font-semibold text-rose-700">
                    <span className="w-48">Date</span>
                    <span className="flex-1" />
                    <span className="w-32 text-right">Cycle length</span>
                  </li>
                  {(() => {
                    // Get up to 12 most recent entries from the API (already sorted desc)
                    const allRecent = entries?.entries.slice().reverse().slice(0, 12) || [];
                    // Show only the last 8 for display
                    const displayRecent = allRecent.slice(0, 8);
                    // If API provides cycle lengths, use them. Assume entries.cycleLengths is an array aligned with entries.entries (oldest to newest)
                    // If not, fallback to local calculation
                    const apiCycles = (entries as any)?.cycleLengths;
                    return displayRecent.map((d: string, i: number) => {
                      let cycle = '';
                      // Find the index in allRecent (up to 12 entries)
                      const idxInAll = allRecent.indexOf(d);
                      const nextInAll = allRecent[idxInAll + 1];
                      if (apiCycles && Array.isArray(apiCycles) && entries) {
                        // Find the index in the full (reversed) list
                        const idx = entries.entries.length - 1 - entries.entries.indexOf(d);
                        if (idx + 1 < entries.entries.length && idx < apiCycles.length && idx >= 0) {
                          // Use API cycle length if available
                          const days = apiCycles[idx];
                          cycle = days > 0 ? days + ' days' : '';
                        } else {
                          cycle = '—';
                        }
                      } else if (nextInAll) {
                        // fallback: local calculation using next entry in allRecent (even if not displayed)
                        const days = Math.abs(
                          Math.round((new Date(d).getTime() - new Date(nextInAll).getTime()) / (1000 * 60 * 60 * 24))
                        );
                        cycle = days > 0 ? days + ' days' : '';
                      } else {
                        cycle = '—';
                      }
                      return (
                        <li key={d} className={`flex items-center ${i % 2 === 0 ? 'bg-rose-50' : 'bg-rose-100'}`}>
                          <span className="w-48">{formatDate(d)}</span>
                          <span className="flex-1" />
                          <span className="w-32 text-right">{cycle}</span>
                        </li>
                      );
                    });
                  })()}
                  {entries?.entries.length === 0 && <li className="text-rose-600">No entries yet. Click a date on the calendar to add your last period start.</li>}
                </ul>
              </div>
            </div>
            <div className="card">
              <h2 className="text-lg font-medium mb-2">Calendar</h2>
              <Calendar
                selectedDates={entries?.entries ?? []}
                onToggleDate={toggleDate}
                today={today}
              />
            </div>
          </div>
        )}

        {tab === 'prediction' && entries && (
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
        {fileProtected === null ? null : fileProtected ? (
          <span>Your data is stored locally in JSON files. No cloud, no ads.</span>
        ) : (
          <span>
            Changes have been made to your local JSON file, protect your data and run a Backup.{' '}
            <button
              className="btn btn-primary btn-xs h-5 ml-2 inline-flex items-center"
              onClick={async () => {
                await exportData();
                // Re-check fileProtected after export
                try {
                  const res = await fetch('/api/file-protected')
                  const data = await res.json()
                  setFileProtected(typeof data.fileProtected === 'boolean' ? data.fileProtected : true)
                } catch {
                  setFileProtected(true)
                }
              }}
            >
              Export Data
            </button>
          </span>
        )}
      </footer>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'add' ? 'Add Entry' : 'Remove Entry'}
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
