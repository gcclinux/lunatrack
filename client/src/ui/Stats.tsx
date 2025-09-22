import type { AppEntries } from '../utils/types'
import { formatDate } from '../utils/dateUtils'

export function Stats({ data }: { data: AppEntries }) {
  const { averageCycleLength, predictions, last, daysSinceLast, nextDate, daysUntilNext } = data

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Current cycle</h2>
        <ul className="space-y-1 text-rose-800">
          <li>Last period: <strong>{last ? formatDate(last) : '—'}</strong></li>
          <li>Days since last: <strong>{daysSinceLast ?? '—'}</strong></li>
          <li>Next predicted: <strong>{nextDate ? formatDate(nextDate) : '—'}</strong> {typeof daysUntilNext === 'number' && (
            <span className="text-rose-600">(in {daysUntilNext} days)</span>
          )}</li>
          <li>Average cycle length: <strong>{averageCycleLength} days</strong></li>
        </ul>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium mb-2">Upcoming predictions</h2>
        {predictions.length === 0 ? (
          <p className="text-rose-700">Add a couple of entries to see predictions.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {predictions.slice(0, 6).map((d: string) => (
              <li key={d}>{formatDate(d)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
