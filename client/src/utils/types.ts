export type Settings = {
  username: string
  dataFile: string
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
