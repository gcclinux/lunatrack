import { useMemo } from 'react'

interface PredictionCalendarProps {
  year: number
  month: number // 0-based month
  predictions: string[]
  title?: string
}

export function PredictionCalendar({ year, month, predictions, title }: PredictionCalendarProps) {
  const calendarData = useMemo(() => {
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))
    const startWeekday = firstDay.getUTCDay() // 0=Sun
    const padStart = (startWeekday + 6) % 7 // show weeks starting Mon

    const days: Array<{ date: string, inMonth: boolean }>[] = []
    let current = new Date(Date.UTC(year, month, 1 - padStart))
    
    for (let week = 0; week < 6; week++) {
      const row: Array<{ date: string, inMonth: boolean }> = []
      for (let d = 0; d < 7; d++) {
        const iso = current.toISOString().slice(0,10)
        row.push({
          date: iso,
          inMonth: current.getUTCMonth() === month
        })
        current.setUTCDate(current.getUTCDate() + 1)
      }
      days.push(row)
    }
    
    return days
  }, [year, month])

  const monthName = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const isPredicted = (date: string) => predictions.includes(date)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <h3 className="text-xs font-medium">{title || monthName}</h3>
      </div>
      <div className="grid grid-cols-7 gap-0.5 select-none text-xs">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <div key={d} className="text-xs text-rose-600 text-center h-3 w-5 flex items-center justify-center">{d}</div>
        ))}
        {calendarData.flatMap((row, i) => row.map((cell, j) => {
          const predicted = isPredicted(cell.date)
          return (
            <div
              key={`${i}-${j}`}
              className={`h-5 w-5 rounded text-xs flex items-center justify-center ${
                cell.inMonth ? '' : 'text-rose-400'
              } ${predicted ? 'bg-primary-500 text-white font-bold' : 'text-rose-700'}`}
            >
              {parseInt(cell.date.slice(8,10), 10)}
            </div>
          )
        }))}
      </div>
    </div>
  )
}