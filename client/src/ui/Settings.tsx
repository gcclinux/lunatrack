import { useState } from 'react'
import type { Settings as SettingsType } from '../utils/types'

export function Settings({ settings, onSave }: {
  settings: SettingsType
  onSave: (s: SettingsType) => Promise<void>
}) {
  const [form, setForm] = useState<SettingsType>(settings)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card max-w-lg" onSubmit={submit}>
      <h2 className="text-lg font-medium mb-3">Settings</h2>
      <label className="label">Username</label>
      <input className="input mb-3" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />

      <label className="label">Data file name</label>
      <input className="input mb-3" value={form.dataFile} onChange={e => setForm({ ...form, dataFile: e.target.value })} />

      <label className="label">Default cycle length (days)</label>
      <input type="number" min={15} max={120} className="input mb-4" value={form.defaultCycleLength} onChange={e => setForm({ ...form, defaultCycleLength: Number(e.target.value) || 28 })} />

      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}
