import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Clock, Flame, PenLine, Table2, Target, TrendingUp } from 'lucide-react'
import {
  ActivityHeatmap,
  ChartFrame,
  MagnitudeBars,
  Sparkline,
  TrendArea,
} from '@/components/charts'
import { Button, Card, EmptyState, StatTile, Spinner } from '@/components/ui'
import { useLanguage, useT } from '@/i18n'
import { useSessions, useVocabulary } from '@/hooks/useContent'
import { useAsync } from '@/hooks/useAsync'
import { computeStreak } from '@/lib/streak'
import { useRepo } from '@/services/db'
import { ERROR_TYPE_LABEL } from '@/types'
import type { ErrorType } from '@/types'

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Progress() {
  const repo = useRepo()
  const { language } = useLanguage()
  const t = useT()
  const [showTable, setShowTable] = useState(false)

  const { data: stats, loading } = useAsync(() => repo.listDailyStats(), [])
  const { data: sessions } = useSessions()
  const { data: vocabulary } = useVocabulary()

  const allStats = useMemo(() => stats ?? [], [stats])
  const allSessions = useMemo(
    () => [...(sessions ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [sessions],
  )

  const streak = computeStreak(allStats)

  const minutesSeries = useMemo(
    () =>
      allStats.slice(-30).map((s) => ({
        label: shortDate(s.day),
        minutes: s.minutesPracticed,
      })),
    [allStats],
  )

  const scoreSeries = useMemo(
    () =>
      allSessions.map((s) => ({
        label: shortDate(s.createdAt),
        overall: s.scores.overall,
        grammar: s.scores.grammar,
        vocabulary: s.scores.vocabulary,
        fluency: s.scores.fluency,
      })),
    [allSessions],
  )

  /** Mistakes per 100 words, so a long session does not look worse than a short one. */
  const errorRateSeries = useMemo(
    () =>
      allSessions.map((s) => ({
        label: shortDate(s.createdAt),
        rate:
          s.wordCount > 0 ? Math.round((s.corrections.length / s.wordCount) * 1000) / 10 : 0,
      })),
    [allSessions],
  )

  const errorBreakdown = useMemo(() => {
    const counts = new Map<ErrorType, number>()
    for (const session of allSessions) {
      for (const correction of session.corrections) {
        counts.set(correction.errorType, (counts.get(correction.errorType) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ label: ERROR_TYPE_LABEL[language][type], value: count }))
  }, [allSessions])

  const heatmapDays = useMemo(
    () => new Map(allStats.map((s) => [s.day, s.minutesPracticed])),
    [allStats],
  )

  const totalMinutes = allStats.reduce((sum, s) => sum + s.minutesPracticed, 0)
  const totalWords = allStats.reduce((sum, s) => sum + s.wordsWritten, 0)
  const latest = scoreSeries[scoreSeries.length - 1]

  if (loading) return <Spinner label={t('prog.loading')} />

  if (allSessions.length === 0 && totalMinutes === 0) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('prog.title')}</h1>
        </header>
        <EmptyState
          icon={<TrendingUp className="size-6" />}
          title={t('prog.emptyTitle')}
          body={t('prog.emptyBody')}
          action={
            <Link to="/write">
              <Button>
                <PenLine className="size-4" />
                {t('prog.firstSession')}
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('prog.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('prog.subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('prog.currentStreak')}
          value={streak.current}
          unit={streak.current === 1 ? 'day' : 'days'}
          tone="warn"
          icon={<Flame className="size-4" />}
        />
        <StatTile
          label={t('prog.bestStreak')}
          value={streak.best}
          unit="days"
          icon={<Target className="size-4" />}
        />
        <StatTile
          label={t('prog.totalPractice')}
          value={totalMinutes >= 60 ? Math.round(totalMinutes / 60) : totalMinutes}
          unit={totalMinutes >= 60 ? 'hours' : 'min'}
          tone="cyan"
          icon={<Clock className="size-4" />}
        />
        <StatTile
          label={t('prog.wordsSaved')}
          value={(vocabulary ?? []).length}
          tone="good"
          icon={<BookMarked className="size-4" />}
        />
      </div>

      <ChartFrame
        title={t('prog.whenTitle')}
        subtitle={t('prog.whenSub')}
      >
        <ActivityHeatmap days={heatmapDays} />
      </ChartFrame>

      {errorRateSeries.length >= 2 && (
        <ChartFrame
          title={t('prog.mistakesTitle')}
          subtitle={t('prog.mistakesSub')}
        >
          <TrendArea data={errorRateSeries} dataKey="rate" color="var(--color-cyan)" />
        </ChartFrame>
      )}

      {scoreSeries.length >= 2 && (
        <ChartFrame
          title={t('prog.scoreTitle')}
          subtitle={t('prog.scoreSub')}
          action={
            <Button variant="ghost" onClick={() => setShowTable((v) => !v)} className="px-2 py-1">
              <Table2 className="size-4" />
              {showTable ? t('prog.chart') : t('prog.table')}
            </Button>
          }
        >
          {showTable ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-fg-faint">
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-4 font-medium">{t('prog.colDate')}</th>
                    <th className="py-2 pr-4 font-medium">{t('prog.colOverall')}</th>
                    <th className="py-2 pr-4 font-medium">{t('prog.colGrammar')}</th>
                    <th className="py-2 pr-4 font-medium">{t('prog.colVocabulary')}</th>
                    <th className="py-2 font-medium">{t('prog.colFluency')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreSeries.map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-fg-muted">{row.label}</td>
                      <td className="py-2 pr-4 font-medium text-fg">{row.overall}</td>
                      <td className="py-2 pr-4 text-fg-muted">{row.grammar}</td>
                      <td className="py-2 pr-4 text-fg-muted">{row.vocabulary}</td>
                      <td className="py-2 text-fg-muted">{row.fluency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <TrendArea data={scoreSeries} dataKey="overall" />
          )}
        </ChartFrame>
      )}

      {/* Small multiples instead of three lines sharing one axis. */}
      {scoreSeries.length >= 2 && latest && (
        <section>
          <div className="mb-3">
            <h3 className="font-semibold text-fg">{t('prog.eachSkill')}</h3>
            <p className="mt-0.5 text-sm text-fg-faint">{t('prog.eachSkillSub')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Sparkline data={scoreSeries} dataKey="grammar" title={t('prog.colGrammar')} latest={latest.grammar} />
            <Sparkline
              data={scoreSeries}
              dataKey="vocabulary"
              title={t('prog.colVocabulary')}
              latest={latest.vocabulary}
            />
            <Sparkline data={scoreSeries} dataKey="fluency" title={t('prog.colFluency')} latest={latest.fluency} />
          </div>
        </section>
      )}

      {errorBreakdown.length > 0 && (
        <ChartFrame
          title={t('prog.breakdownTitle')}
          subtitle={t('prog.breakdownSub')}
        >
          <MagnitudeBars data={errorBreakdown} height={Math.max(180, errorBreakdown.length * 34)} />
        </ChartFrame>
      )}

      {minutesSeries.length >= 2 && (
        <ChartFrame title={t('prog.minutesTitle')} subtitle={t('prog.minutesSub')}>
          <TrendArea data={minutesSeries} dataKey="minutes" unit="min" color="var(--color-cyan)" />
        </ChartFrame>
      )}

      <Card>
        <p className="text-sm leading-relaxed text-fg-muted">
          {allSessions.length === 1
            ? t('prog.summaryOne', { words: totalWords.toLocaleString() })
            : t('prog.summaryMany', {
                words: totalWords.toLocaleString(),
                count: allSessions.length,
              })}
        </p>
      </Card>
    </div>
  )
}
