import type { DailyStat } from '@/types'
import { localDay } from './utils'

export interface StreakInfo {
  current: number
  best: number
  /** True when nothing has been practised today yet. */
  todayPending: boolean
}

function isActive(stat: DailyStat): boolean {
  return (
    stat.minutesPracticed > 0 ||
    stat.wordsWritten > 0 ||
    stat.speakingSeconds > 0 ||
    stat.lessonsCompleted > 0 ||
    stat.wordsLearned > 0
  )
}

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return localDay(date)
}

/**
 * A streak keeps running as long as yesterday was active, so opening the app in
 * the morning before practising does not show the streak as already broken.
 */
export function computeStreak(stats: DailyStat[]): StreakInfo {
  const activeDays = new Set(stats.filter(isActive).map((s) => s.day))
  const today = localDay()
  const todayPending = !activeDays.has(today)

  let current = 0
  let cursor = activeDays.has(today) ? today : shiftDay(today, -1)
  while (activeDays.has(cursor)) {
    current++
    cursor = shiftDay(cursor, -1)
  }

  // Longest run anywhere in the history.
  let best = 0
  let run = 0
  const sorted = [...activeDays].sort()
  let previous: string | null = null
  for (const day of sorted) {
    run = previous !== null && shiftDay(previous, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }

  return { current, best: Math.max(best, current), todayPending }
}
