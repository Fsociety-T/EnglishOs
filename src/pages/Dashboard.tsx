import { Link } from 'react-router-dom'
import { BookMarked, Flame, GraduationCap, Mic, PenLine, Timer, Type } from 'lucide-react'
import { Button, Card, ProgressRing, SectionHeading, StatTile } from '@/components/ui'
import { useSessions, useVocabulary } from '@/hooks/useContent'
import { useAsync } from '@/hooks/useAsync'
import { computeStreak } from '@/lib/streak'
import { formatRelative, localDay } from '@/lib/utils'
import { useRepo } from '@/services/db'

const QUICK_ACTIONS = [
  {
    to: '/write',
    label: 'Write about a topic',
    body: 'Pick a prompt and get every mistake explained.',
    icon: PenLine,
  },
  {
    to: '/speak',
    label: 'Speak for two minutes',
    body: 'Record yourself and get a fluency score.',
    icon: Mic,
  },
  {
    to: '/vocabulary',
    label: 'Review your words',
    body: 'Flashcards for the words that are due today.',
    icon: BookMarked,
  },
  {
    to: '/lessons',
    label: 'Study a weak area',
    body: 'Lessons built from the mistakes you actually make.',
    icon: GraduationCap,
  },
]

export default function Dashboard() {
  const repo = useRepo()
  const { data: stats } = useAsync(() => repo.listDailyStats(), [])
  const { data: profile } = useAsync(() => repo.getProfile(), [])
  const { data: sessions } = useSessions()
  const { data: vocabulary } = useVocabulary()

  const streak = computeStreak(stats ?? [])
  const today = (stats ?? []).find((s) => s.day === localDay())
  const goal = profile?.dailyGoalMinutes ?? 20
  const minutesToday = today?.minutesPracticed ?? 0
  const goalPercent = goal > 0 ? Math.min(100, (minutesToday / goal) * 100) : 0

  const dueCount = (vocabulary ?? []).filter(
    (w) => new Date(w.nextReviewAt).getTime() <= Date.now(),
  ).length
  const lastSession = (sessions ?? [])[0]

  const totalWords = (stats ?? []).reduce((sum, s) => sum + s.wordsWritten, 0)
  const totalSpeakingMinutes = Math.round(
    (stats ?? []).reduce((sum, s) => sum + s.speakingSeconds, 0) / 60,
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting}, {profile?.displayName ?? 'Learner'}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {streak.todayPending
            ? 'You have not practised yet today. Ten minutes is enough to keep the streak alive.'
            : 'You have already practised today. Anything more is a bonus.'}
        </p>
      </header>

      {/* Today's goal */}
      <Card className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <ProgressRing
          value={goalPercent}
          label={`${minutesToday}`}
          sublabel={`of ${goal} min`}
          size={132}
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Flame className={streak.current > 0 ? 'size-5 text-warn' : 'size-5 text-fg-faint'} />
            <span className="text-lg font-semibold">
              {streak.current === 0
                ? 'No streak yet'
                : `${streak.current}-day streak`}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {goalPercent >= 100
              ? 'Daily goal complete. Well done.'
              : `${Math.max(0, goal - minutesToday)} more minutes to hit today's goal.`}
            {streak.best > streak.current && ` Your best streak is ${streak.best} days.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link to="/write">
              <Button>
                <PenLine className="size-4" />
                Start writing
              </Button>
            </Link>
            <Link to="/speak">
              <Button variant="outline">
                <Mic className="size-4" />
                Start speaking
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Words written"
          value={totalWords.toLocaleString()}
          icon={<Type className="size-4" />}
        />
        <StatTile
          label="Speaking"
          value={totalSpeakingMinutes}
          unit="min"
          tone="cyan"
          icon={<Mic className="size-4" />}
        />
        <StatTile
          label="Words saved"
          value={(vocabulary ?? []).length}
          tone="good"
          icon={<BookMarked className="size-4" />}
        />
        <StatTile
          label="Due to review"
          value={dueCount}
          tone="warn"
          icon={<Timer className="size-4" />}
        />
      </div>

      {/* Continue */}
      {lastSession && (
        <section>
          <SectionHeading title="Pick up where you left off" />
          <Link to={`/session/${lastSession.id}`} className="block">
            <Card className="transition hover:bg-white/10">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{lastSession.topicTitle}</p>
                  <p className="mt-1 text-sm text-fg-faint">
                    {lastSession.kind === 'writing' ? 'Writing' : 'Speaking'} &middot;{' '}
                    {lastSession.wordCount} words &middot; {formatRelative(lastSession.createdAt)}
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

      {/* Quick actions */}
      <section>
        <SectionHeading title="What do you want to do?" />
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map(({ to, label, body, icon: Icon }) => (
            <Link key={to} to={to} className="block">
              <Card className="h-full transition hover:bg-white/10">
                <span className="grid size-10 place-items-center rounded-xl bg-violet/10 text-violet-soft">
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 font-medium text-fg">{label}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg-faint">{body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
