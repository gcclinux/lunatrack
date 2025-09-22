import { useMemo } from 'react'

interface PredictionCalendarProps {
  year: number
  month: number // 0-based month
  predictions: string[]
  averageCycleLength?: number
  title?: string
}

export function PredictionCalendar({ year, month, predictions, averageCycleLength = 28, title }: PredictionCalendarProps) {
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

  // Use averageCycleLength to calculate fertile window and ovulation for each prediction
  // Fertile window: days (cycleLen-18) to (cycleLen-13) after period start
  // Ovulation: day (cycleLen-14) after period start
  const fertileWindows: Record<string, {start: string, end: string, ovulation: string}> = {}
  predictions.forEach(pred => {
    const start = new Date(pred)
    // Fertile window: days (cycleLen-18) to (cycleLen-13) after period start
    const fertileStart = new Date(start)
    fertileStart.setUTCDate(start.getUTCDate() + averageCycleLength - 18)
    const fertileEnd = new Date(start)
    fertileEnd.setUTCDate(start.getUTCDate() + averageCycleLength - 13)
    const ovulation = new Date(start)
    ovulation.setUTCDate(start.getUTCDate() + averageCycleLength - 14)
    fertileWindows[pred] = {
      start: fertileStart.toISOString().slice(0,10),
      end: fertileEnd.toISOString().slice(0,10),
      ovulation: ovulation.toISOString().slice(0,10)
    }
  })

  function getFertilityStatus(date: string): 'ovulation' | 'fertile' | null {
    for (const fw of Object.values(fertileWindows)) {
      if (date === fw.ovulation) return 'ovulation'
      if (date >= fw.start && date <= fw.end) return 'fertile'
    }
    return null
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <h3 className="text-xs font-medium">{title || monthName}</h3>
      </div>
      <div className="grid grid-cols-7 gap-0.5 select-none text-xs">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <div key={d} className="text-xs text-rose-600 text-center h-3 w-5 flex items-center justify-center">{d}</div>
        ))}
        {calendarData.flatMap((row, i) => {
          // Find fertile window spans in this row
          const fertileSpans: Array<{start: number, end: number}> = []
          let spanStart = null
          for (let j = 0; j < row.length; j++) {
            const fertility = getFertilityStatus(row[j].date)
            if (fertility === 'fertile' && spanStart === null) {
              spanStart = j
            } else if ((fertility !== 'fertile' || j === row.length - 1) && spanStart !== null) {
              const end = (fertility === 'fertile' && j === row.length - 1) ? j : j - 1
              fertileSpans.push({ start: spanStart, end })
              spanStart = null
            }
          }
          return row.map((cell, j) => {
            const predicted = predictions.includes(cell.date)
            const fertility = getFertilityStatus(cell.date)
            let cellClass = ''
            let style: React.CSSProperties = {}
            // Join light blue background for fertile window
            const inFertileSpan = fertileSpans.some(span => j >= span.start && j <= span.end)
            if (predicted) {
              cellClass = 'bg-primary-500 text-white font-bold'
            } else if (fertility === 'ovulation') {
              cellClass = 'bg-blue-600 text-white font-bold'
            } else if (inFertileSpan) {
              cellClass = 'text-blue-900 font-semibold'
              style = { background: 'linear-gradient(to right, #bfdbfe 0%, #bfdbfe 100%)' } // tailwind blue-200
            } else {
              cellClass = cell.inMonth ? 'text-rose-700' : 'text-rose-400'
            }
            // Ovulation cell overrides fertile window color
            if (fertility === 'ovulation') {
              style = {}
            }
            return (
              <div
                key={`${i}-${j}`}
                className={`h-5 w-5 rounded text-xs flex items-center justify-center ${cellClass}`}
                style={style}
              >
                {parseInt(cell.date.slice(8,10), 10)}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}