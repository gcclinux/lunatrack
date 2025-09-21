import { useMemo } from 'react'

export function Calendar({ selectedDates, onToggleDate, today }: {
  selectedDates: string[]
  onToggleDate: (date: string) => void
  today: string
}) {
  const now = useMemo(() => new Date(today + 'T00:00:00'), [today])
  const [year, month] = [now.getFullYear(), now.getMonth()] // 0-based month

  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  const daysInMonth = lastDay.getUTCDate()
  const startWeekday = firstDay.getUTCDay() // 0=Sun

  const days: Array<{ date: string, inMonth: boolean }>[] = []
  const padStart = (startWeekday + 6) % 7 // show weeks starting Mon

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

  const isSelected = (d: string) => selectedDates.includes(d)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-md font-medium">{now.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 select-none">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <div key={d} className="text-xs text-rose-600 text-center py-1">{d}</div>
        ))}
        {days.flatMap((row, i) => row.map((cell, j) => {
          const selected = isSelected(cell.date)
          const isToday = cell.date === today
          return (
            <button
              key={`${i}-${j}`}
              className={`aspect-square rounded-lg border text-sm flex items-center justify-center transition-colors ${
                cell.inMonth ? 'border-rose-200' : 'border-transparent text-rose-400'
              } ${selected ? 'bg-primary-500 text-white' : 'hover:bg-rose-100'} ${isToday ? 'ring-2 ring-primary-300' : ''}`}
              onClick={() => onToggleDate(cell.date)}
              title={cell.date}
            >
              {parseInt(cell.date.slice(8,10), 10)}
            </button>
          )
        }))}
      </div>
    </div>
  )
}
