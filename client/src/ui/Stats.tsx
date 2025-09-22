import type { AppEntries } from '../utils/types'
import { formatDate } from '../utils/dateUtils'
import { PredictionCalendar } from './PredictionCalendar'

export function Stats({ data }: { data: AppEntries }) {
  const { averageCycleLength, predictions, last, daysSinceLast, nextDate, daysUntilNext } = data

  // Get current date and calculate next 3 months
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const months = [
    { year: currentYear, month: (currentMonth + 1) % 12, yearOffset: Math.floor((currentMonth + 1) / 12) },
    { year: currentYear, month: (currentMonth + 2) % 12, yearOffset: Math.floor((currentMonth + 2) / 12) },
    { year: currentYear, month: (currentMonth + 3) % 12, yearOffset: Math.floor((currentMonth + 3) / 12) }
  ].map(m => ({ 
    year: m.year + m.yearOffset, 
    month: m.month 
  }))

  // Filter predictions by month
  const getMonthPredictions = (year: number, month: number) => {
    return predictions.filter(date => {
      const predDate = new Date(date)
      return predDate.getFullYear() === year && predDate.getMonth() === month
    })
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Current cycle - top left */}
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Current cycle (Prediction)</h2>
        <ul className="space-y-1 text-rose-800">
          <li>Last period: <strong>{last ? formatDate(last) : '—'}</strong></li>
          <li>Days since last: <strong>{daysSinceLast ?? '—'}</strong></li>
          <li>Next predicted date: <strong>{nextDate ? formatDate(nextDate) : '—'}</strong></li>
          {typeof daysUntilNext === 'number' && (
            <li>Number of days: <strong className="text-rose-600">{daysUntilNext} days</strong></li>
          )}
          <li>Average cycle length: <strong>{averageCycleLength} days</strong></li>
          {/* Next ovulation prediction: show date in dark blue bold */}
          <li>Next Ovulation prediction: <strong className="text-blue-800 font-bold">{
            (() => {
              // Choose a prediction to base ovulation on: prefer nextDate if available, else last prediction
              const base = nextDate || (predictions.length ? predictions[predictions.length - 1] : null)
              if (!base) return '—'
              const [y, m, d] = base.split('-').map(Number)
              const start = new Date(Date.UTC(y, m - 1, d))
              const ov = new Date(start)
              ov.setUTCDate(start.getUTCDate() + averageCycleLength - 14)
              // Format without year, e.g. "Mon 20 Oct" (strip commas introduced by some locales)
              const short = new Date(ov.toISOString().slice(0,10)).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
              return short.replace(/,/g, '')
            })()
          }</strong></li>
        </ul>
      </div>

      {/* Next month calendar - top right */}
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Next month</h2>
        {predictions.length === 0 ? (
          <p className="text-rose-700">Add a couple of entries to see predictions.</p>
        ) : (
          <PredictionCalendar
            year={months[0].year}
            month={months[0].month}
            predictions={getMonthPredictions(months[0].year, months[0].month)}
            averageCycleLength={averageCycleLength}
          />
        )}
      </div>

      {/* Month after next - bottom left */}
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Following month</h2>
        {predictions.length === 0 ? (
          <p className="text-rose-700">Add a couple of entries to see predictions.</p>
        ) : (
          <PredictionCalendar
            year={months[1].year}
            month={months[1].month}
            predictions={getMonthPredictions(months[1].year, months[1].month)}
            averageCycleLength={averageCycleLength}
          />
        )}
      </div>

      {/* Third month - bottom right */}
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Third month</h2>
        {predictions.length === 0 ? (
          <p className="text-rose-700">Add a couple of entries to see predictions.</p>
        ) : (
          <PredictionCalendar
            year={months[2].year}
            month={months[2].month}
            predictions={getMonthPredictions(months[2].year, months[2].month)}
            averageCycleLength={averageCycleLength}
          />
        )}
      </div>
    </div>
  )
}
