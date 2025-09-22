import { useState, useRef } from 'react'
import type { Settings as SettingsType } from '../utils/types'

interface NotificationDialogProps {
  isOpen: boolean
  title: string
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

function NotificationDialog({ isOpen, title, message, type, onClose }: NotificationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full mx-4 overflow-hidden relative">
        {/* Flower decoration */}
        <div className="absolute top-4 right-4 text-rose-300 opacity-60">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
          </svg>
        </div>
        {/* Flower decoration - bottom left */}
        <div className="absolute bottom-4 left-4 text-rose-300 opacity-60">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM7 9C7 10.1 6.1 11 5 11C3.9 11 3 10.1 3 9C3 7.9 3.9 7 5 7C6.1 7 7 7.9 7 9ZM14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12ZM18.5 16.5C18.5 17.6 17.6 18.5 16.5 18.5C15.4 18.5 14.5 17.6 14.5 16.5C14.5 15.4 15.4 14.5 16.5 14.5C17.6 14.5 18.5 15.4 18.5 16.5ZM9.5 16.5C9.5 17.6 8.6 18.5 7.5 18.5C6.4 18.5 5.5 17.6 5.5 16.5C5.5 15.4 6.4 14.5 7.5 14.5C8.6 14.5 9.5 15.4 9.5 16.5ZM12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22Z"/>
          </svg>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-rose-900 mb-3 text-center">{title}</h3>
          <p className="text-rose-800 mb-6 whitespace-pre-line leading-relaxed text-center">{message}</p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Settings({ settings, onSave }: {
  settings: SettingsType
  onSave: (s: SettingsType) => Promise<void>
}) {
  const [form, setForm] = useState<SettingsType>(settings)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error'
    shouldRefresh?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    shouldRefresh: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showNotification(title: string, message: string, type: 'success' | 'error', shouldRefresh = false) {
    setNotification({ isOpen: true, title, message, type, shouldRefresh })
  }

  function closeNotification() {
    setNotification(prev => ({ ...prev, isOpen: false }))
    if (notification.shouldRefresh) {
      window.location.reload()
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate PIN if enabled
    if (form.pinEnabled && (form.pin.length < 4 || form.pin.length > 6)) {
      showNotification('Invalid PIN', 'PIN must be between 4 and 6 digits.', 'error')
      return
    }
    
    setSaving(true)
    try {
      await onSave(form)
      showNotification('Settings Saved', 'Your settings have been saved successfully!', 'success')
    } catch (error) {
      showNotification('Save Failed', 'Failed to save settings. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function exportData() {
    try {
      // Get current data from API
      const response = await fetch('/api/entries')
      const data = await response.json()
      
      // Create downloadable file
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
  link.download = `lunatrack-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showNotification('Export Successful', 'Your cycle data has been downloaded successfully!', 'success')
    } catch (error) {
      showNotification('Export Failed', 'Failed to export data. Please try again.', 'error')
    }
  }

  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validate the data structure
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid backup file format')
      }

      // Import each entry
      for (const entry of data.entries) {
        await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: entry })
        })
      }

      showNotification('Import Successful', `Successfully imported ${data.entries.length} entries!`, 'success', true)
      // Note: Page will refresh when user clicks OK in the notification dialog
    } catch (error) {
      showNotification('Import Failed', 'Failed to import data. Please check the file format and try again.', 'error')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="min-h-[32rem] grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column: Settings and Backup & Restore stacked */}
      <div className="md:col-span-2 flex flex-col gap-6">
        <form className="card max-w-lg" onSubmit={submit}>
          <h2 className="text-lg font-medium mb-2">Settings</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="label">PIN / Pass</label>
              <input 
                type="password" 
                className="input h-8" 
                value={form.pin} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
                  setForm({ ...form, pin: value })
                }}
                placeholder="4-6 digits"
                maxLength={6}
                pattern="[0-9]{4,6}"
              />
            </div>
            <div className="flex flex-col">
              <label className="label">Enabled</label>
              <div className="flex items-center h-10">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-primary-500 bg-white border-2 border-rose-300 rounded focus:ring-primary-300 focus:ring-2" 
                  checked={form.pinEnabled}
                  onChange={e => setForm({ ...form, pinEnabled: e.target.checked })}
                />
                <span className="ml-2 text-sm text-rose-700">
                  {form.pinEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          <label className="label">Default cycle length (days)</label>
          <input type="number" min={15} max={120} className="input mb-4 h-8" value={form.defaultCycleLength} onChange={e => setForm({ ...form, defaultCycleLength: Number(e.target.value) || 28 })} />
          <div className="flex gap-2">
            <button className="btn btn-primary w-[97%] h-[1.94rem]" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>

        <div className="card max-w-lg pt-[0.8rem]">
          <h2 className="text-lg font-medium mb-[0.1rem] mt-[0.1rem]">Backup & Restore</h2>
          <p className="text-sm text-rose-700 mb-4">
            Export your cycle data to save a backup, or import a previous backup to restore your data.
          </p>
          <div className="space-y-3">
            <div>
              <button 
                className="btn btn-primary w-[97%] h-[1.94rem] mb-2" 
                onClick={exportData}
              >
                💾 Export Data
              </button>
              <p className="text-xs text-rose-600">
                Download your cycle data as a backup file
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
                id="import-file"
              />
              <button 
                className="btn btn-ghost w-[97%] h-[1.94rem] mb-2 border border-rose-300" 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? '📥 Importing...' : '📥 Import Data'}
              </button>
              <p className="text-xs text-rose-600">
                Restore cycle data from a backup file
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Right column: About panel */}
      <div className="card h-full flex flex-col max-w-lg">
        <h2 className="text-lg font-medium mb-2">About</h2>
        <p className="text-rose-700 text-sm mb-2">
          <span className="font-semibold">LunaTrack</span> helps you track your cycles, moods, and more with privacy and ease.
        </p>
        <ul className="text-rose-700 text-sm list-disc pl-5 mb-2">
          <li>All data is stored locally by default</li>
          <li>Backup & restore for peace of mind</li>
          <li>PIN protection for privacy</li>
        </ul>
        <div className="mt-auto pt-4 text-xs text-rose-400">
          <div>Version 1.0.0</div>
          <div>© {new Date().getFullYear()} LunaTrack</div>
        </div>
      </div>
      <NotificationDialog
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
    </div>
  )
}
