import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, GraduationCap, PenLine, Target } from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { ERROR_TONE } from '@/lib/errorStyles'
import { cn } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { LessonStatus } from '@/types'
import { ERROR_TYPE_LABEL } from '@/types'

type Filter = 'all' | LessonStatus

export default function Lessons() {
  const repo = useRepo()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: lessons, loading } = useAsync(() => repo.listLessons(), [])
  const { data: sessions } = useAsync(() => repo.listSessions(), [])

  /** How often each mistake actually happens, across every session. */
  const weakAreas = useMemo(() => {
    const counts = new Map<string, number>()
    for (const session of sessions ?? []) {
      for (const correction of session.corrections) {
        counts.set(correction.errorType, (counts.get(correction.errorType) ?? 0) + 1)
      }
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count, percent: total > 0 ? (count / total) * 100 : 0 }))
  }, [sessions])

  const all = lessons ?? []
  const visible = filter === 'all' ? all : all.filter((l) => l.status === filter)

  if (loading) return <Spinner label="Loading your lessons..." />

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your grammar lessons</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Not a general course. Every lesson here exists because you made that mistake.
        </p>
      </header>

      {weakAreas.length > 0 && (
        <Card>
          <SectionHeading
            title="Where your mistakes come from"
            subtitle="Across every session you have done."
          />
          <div className="space-y-3">
            {weakAreas.map(({ type, count, percent }) => (
              <div key={type}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-fg-muted">
                    {ERROR_TYPE_LABEL[type as keyof typeof ERROR_TYPE_LABEL]}
                  </span>
                  <span className="text-fg-faint">
                    {count} {count === 1 ? 'time' : 'times'}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-neon transition-[width] duration-700"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {all.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-6" />}
          title="No lessons yet"
          body="Lessons appear automatically after you practise. Write or speak about a topic, and the mistakes you make become the lessons you need."
          action={
            <Link to="/write">
              <Button>
                <PenLine className="size-4" />
                Start writing
              </Button>
            </Link>
          }
        />
      ) : (
        <section>
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: all.length },
              { id: 'new', label: 'New', count: all.filter((l) => l.status === 'new').length },
              {
                id: 'learning',
                label: 'Learning',
                count: all.filter((l) => l.status === 'learning').length,
              },
              {
                id: 'mastered',
                label: 'Mastered',
                count: all.filter((l) => l.status === 'mastered').length,
              },
            ]}
            active={filter}
            onChange={setFilter}
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visible.map((lesson) => (
              <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="block">
                <Card className="h-full transition hover:bg-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        ERROR_TONE[lesson.errorType].chip,
                      )}
                    >
                      {ERROR_TYPE_LABEL[lesson.errorType]}
                    </span>
                    {lesson.status === 'mastered' ? (
                      <Badge tone="good">
                        <CheckCircle2 className="size-3" />
                        Mastered
                      </Badge>
                    ) : lesson.status === 'learning' ? (
                      <Badge tone="warn">Learning</Badge>
                    ) : (
                      <Badge tone="violet">New</Badge>
                    )}
                  </div>

                  <h3 className="mt-3 font-semibold text-fg">{lesson.title}</h3>

                  {lesson.sourceSentence && (
                    <p className="mt-2 border-l-2 border-white/15 pl-3 text-sm leading-relaxed text-fg-faint italic">
                      &ldquo;{lesson.sourceSentence}&rdquo;
                    </p>
                  )}

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-faint">
                    <Target className="size-3.5" />
                    {lesson.exercises.length} practice questions
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-center text-sm text-fg-faint">
              Nothing in this group yet.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
