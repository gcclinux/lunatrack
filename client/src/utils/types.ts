export type Settings = {
  pin: string
  pinEnabled: boolean
  defaultCycleLength: number
}

export type AppEntries = {
  entries: string[]
  averageCycleLength: number
  predictions: string[]
  last: string | null
  daysSinceLast: number | null
  nextDate: string | null
  daysUntilNext: number | null
}
