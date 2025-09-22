import { Calendar } from './Calendar'
import { formatDate } from '../utils/dateUtils'

type HistoryProps = {
  entries: string[]
  onToggleDate: (date: string) => void | Promise<void>
  today: string
}

export function History({ entries, onToggleDate, today }: HistoryProps) {
  const sorted = entries.slice().sort((a, b) => b.localeCompare(a))
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Calendar</h2>
        <Calendar selectedDates={entries} onToggleDate={onToggleDate} today={today} />
      </div>
      <div className="card">
        <h2 className="text-lg font-medium mb-2">All entries</h2>
        {entries.length === 0 ? (
          <div className="text-rose-600">No entries found.</div>
        ) : (
          <div className="max-h-[24rem] overflow-y-auto pr-1">
            <ul className="space-y-1">
              {sorted.map((date: string) => (
                <li key={date} className="flex items-center justify-between py-2">
                  <span className="text-rose-900">{formatDate(date)}</span>
                  <button className="btn btn-ghost text-rose-700" onClick={() => onToggleDate(date)}>remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
