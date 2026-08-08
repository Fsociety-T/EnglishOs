import { computeStreak } from '@/lib/streak'
import type { StreakInfo } from '@/lib/streak'
import { useRepo } from '@/services/db'
import { useAsync } from './useAsync'

export function useStreak(): StreakInfo & { loading: boolean } {
  const repo = useRepo()
  const { data, loading } = useAsync(() => repo.listDailyStats(), [])
  const info = computeStreak(data ?? [])
  return { ...info, loading }
}
