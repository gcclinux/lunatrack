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

  // Define fertile windows as days 1..5 after each prediction (inclusive)
  const fertileWindows: Record<string, {start: string, end: string}> = {}
  predictions.forEach(pred => {
    const start = new Date(pred)
    const fertileStart = new Date(start)
    fertileStart.setUTCDate(start.getUTCDate() + 1) // day 1 after prediction
    const fertileEnd = new Date(start)
    fertileEnd.setUTCDate(start.getUTCDate() + 5) // through day 5 after prediction
    fertileWindows[pred] = {
      start: fertileStart.toISOString().slice(0,10),
      end: fertileEnd.toISOString().slice(0,10)
    }
  })

  function getFertilityStatus(date: string): 'fertile' | null {
    for (const fw of Object.values(fertileWindows)) {
      if (date >= fw.start && date <= fw.end) return 'fertile'
    }
    return null
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <h3 className="text-xs font-medium">{title || monthName}</h3>
      </div>
      <div className="select-none text-xs space-y-1">
        <div className="grid grid-cols-7 gap-0.5">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="text-xs text-rose-600 text-center h-3 w-5 flex items-center justify-center">{d}</div>
          ))}
        </div>

        {calendarData.map((row, i) => {
          // Build fertile spans for this row
          const fertileSpans: Array<{start: number, end: number}> = []
          let spanStart: number | null = null
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

          return (
            <div key={i} className="relative h-5">
              {fertileSpans.map((s, idx) => {
                const leftPct = (s.start / 7) * 100
                const widthPct = ((s.end - s.start + 1) / 7) * 100
                return (
                  <div
                    key={idx}
                    className="absolute top-0 left-0 h-full bg-blue-200"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, zIndex: 0 }}
                  />
                )
              })}

              <div className="grid grid-cols-7 gap-0">
                {row.map((cell, j) => {
                  const predicted = predictions.includes(cell.date)
                  const fertility = getFertilityStatus(cell.date)
                  let cellClass = 'relative z-10'
                  if (predicted) {
                    cellClass += ' bg-primary-500 text-white font-bold'
                  } else if (fertility === 'fertile') {
                    // keep text color normal so the blue stripe shows through
                    cellClass += cell.inMonth ? ' text-rose-700' : ' text-rose-400'
                  } else {
                    cellClass += cell.inMonth ? ' text-rose-700' : ' text-rose-400'
                  }
                  return (
                    <div key={`${i}-${j}`} className={`h-5 w-5 flex items-center justify-center ${cellClass}`}>{parseInt(cell.date.slice(8,10), 10)}</div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}