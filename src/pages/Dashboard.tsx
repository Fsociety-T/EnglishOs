import { Link } from 'react-router-dom'
import { BookMarked, Flame, Gauge, GraduationCap, Mic, PenLine, Timer, Type } from 'lucide-react'
import { Button, Card, ProgressRing, SectionHeading, StatTile } from '@/components/ui'
import { useLessons, useSessions, useVocabulary } from '@/hooks/useContent'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import type { StringKey } from '@/i18n/strings'
import { dueLessons } from '@/lib/srs'
import { computeStreak } from '@/lib/streak'
import { formatRelative, localDay } from '@/lib/utils'
import { useRepo } from '@/services/db'

const QUICK_ACTIONS: { to: string; labelKey: StringKey; icon: typeof PenLine }[] = [
  { to: '/write', labelKey: 'dash.actionWrite', icon: PenLine },
  { to: '/speak', labelKey: 'dash.actionSpeak', icon: Mic },
  { to: '/vocabulary', labelKey: 'dash.actionWords', icon: BookMarked },
  { to: '/lessons', labelKey: 'dash.actionLessons', icon: GraduationCap },
]

export default function Dashboard() {
  const repo = useRepo()
  const t = useT()
  const { data: stats } = useAsync(() => repo.listDailyStats(), [])
  const { data: profile } = useAsync(() => repo.getProfile(), [])
  const { data: sessions } = useSessions()
  const { data: vocabulary } = useVocabulary()
  const { data: lessons } = useLessons()

  const streak = computeStreak(stats ?? [])
  const today = (stats ?? []).find((s) => s.day === localDay())
  const goal = profile?.dailyGoalMinutes ?? 20
  const minutesToday = today?.minutesPracticed ?? 0
  const goalPercent = goal > 0 ? Math.min(100, (minutesToday / goal) * 100) : 0

  const dueCount = (vocabulary ?? []).filter(
    (w) => new Date(w.nextReviewAt).getTime() <= Date.now(),
  ).length
  const lastSession = (sessions ?? [])[0]
  const dueLessonCount = dueLessons(lessons ?? []).length

  const totalWords = (stats ?? []).reduce((sum, s) => sum + s.wordsWritten, 0)
  const totalSpeakingMinutes = Math.round(
    (stats ?? []).reduce((sum, s) => sum + s.speakingSeconds, 0) / 60,
  )

  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'dash.morning' : hour < 18 ? 'dash.afternoon' : 'dash.evening')

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting}, {profile?.displayName ?? t('settings.namePlaceholder')}
        </h1>
      </header>

      {/* Today's goal */}
      <Card className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <ProgressRing
          value={goalPercent}
          label={`${minutesToday}`}
          sublabel={t('dash.ofGoal', { goal })}
          size={132}
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Flame className={streak.current > 0 ? 'size-5 text-warn' : 'size-5 text-fg-faint'} />
            <span className="text-lg font-semibold">
              {streak.current === 0
                ? t('dash.noStreak')
                : t('dash.streak', { count: streak.current })}
            </span>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {goalPercent >= 100
              ? t('dash.goalDone')
              : t('dash.goalLeft', { count: Math.max(0, goal - minutesToday) })}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link to="/write">
              <Button>
                <PenLine className="size-4" />
                {t('dash.startWriting')}
              </Button>
            </Link>
            <Link to="/speak">
              <Button variant="outline">
                <Mic className="size-4" />
                {t('dash.startSpeaking')}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Placement. Shown until the writing test has been taken once: until
          then every prompt, lesson and review is pitched at a level nobody
          measured. It disappears on its own rather than needing dismissing. */}
      {profile && profile.writingLevel === null && (
        <Card className="border-violet/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet-soft">
                <Gauge className="size-5" />
              </span>
              <p className="min-w-0 font-medium text-fg">{t('dash.placementTitle')}</p>
            </div>
            <Link to="/level">
              <Button>{t('dash.placementAction')}</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('dash.wordsWritten')}
          value={totalWords.toLocaleString()}
          icon={<Type className="size-4" />}
        />
        <StatTile
          label={t('dash.speaking')}
          value={totalSpeakingMinutes}
          unit="min"
          tone="cyan"
          icon={<Mic className="size-4" />}
        />
        <StatTile
          label={t('dash.wordsSaved')}
          value={(vocabulary ?? []).length}
          tone="good"
          icon={<BookMarked className="size-4" />}
        />
        <StatTile
          label={t('dash.dueToReview')}
          value={dueCount}
          tone="warn"
          icon={<Timer className="size-4" />}
        />
      </div>

      {/* Continue */}
      {lastSession && (
        <section>
          <SectionHeading
            title={t('dash.continue')}
            action={
              <Link to="/history" className="text-sm text-fg-muted transition hover:text-fg">
                {t('history.seeAll')}
              </Link>
            }
          />
          <Link to={`/session/${lastSession.id}`} className="block">
            <Card className="transition hover:bg-white/10">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{lastSession.topicTitle}</p>
                  <p className="mt-1 text-sm text-fg-faint">
                    {t(lastSession.kind === 'writing' ? 'dash.writing' : 'dash.speakingKind')}{' '}
                    &middot; {lastSession.wordCount} {t('dash.words')} &middot;{' '}
                    {formatRelative(lastSession.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-2xl font-bold text-gradient">
                  {lastSession.scores.overall}
                </span>
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* Quick actions. Icon and label only: four cards each explaining
          themselves in a sentence was more reading than the whole screen
          deserved, and the labels already say where they go. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ACTIONS.map(({ to, labelKey, icon: Icon }) => (
          <Link key={to} to={to} className="block">
            <Card className="relative flex h-full flex-col items-center gap-3 p-5 text-center transition hover:bg-white/10">
              <span className="grid size-11 place-items-center rounded-xl bg-violet/10 text-violet-soft">
                <Icon className="size-5" />
              </span>
              <p className="text-sm font-medium text-fg">{t(labelKey)}</p>
              {to === '/lessons' && dueLessonCount > 0 && (
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-warn/20 text-xs font-semibold text-warn">
                  {dueLessonCount}
                </span>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
