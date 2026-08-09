import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, GraduationCap, PenLine, RotateCcw, Target } from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useLanguage, useT } from '@/i18n'
import { useLessons, useSessions } from '@/hooks/useContent'
import { ERROR_TONE } from '@/lib/errorStyles'
import { dueLessons, isLessonDue } from '@/lib/srs'
import { cn } from '@/lib/utils'
import type { ErrorType, LessonStatus } from '@/types'
import { ERROR_TYPE_LABEL } from '@/types'

type Filter = 'all' | 'due' | LessonStatus

export default function Lessons() {
  const { language } = useLanguage()
  const t = useT()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: lessons, loading } = useLessons()
  const { data: sessions } = useSessions()

  /** How often each mistake actually happens, across every session. */
  const weakAreas = useMemo(() => {
    const counts = new Map<ErrorType, number>()
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
  const due = dueLessons(all)
  const visible =
    filter === 'all' ? all : filter === 'due' ? due : all.filter((l) => l.status === filter)

  if (loading) return <Spinner label={t('lessons.loading')} />

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('lessons.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('lessons.subtitle')}</p>
      </header>

      {weakAreas.length > 0 && (
        <Card>
          <SectionHeading
            title={t('lessons.weakAreas')}
            subtitle={t('lessons.weakAreasSub')}
          />
          <div className="space-y-3">
            {weakAreas.map(({ type, count, percent }) => (
              <div key={type}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-fg-muted">
                    {ERROR_TYPE_LABEL[language][type]}
                  </span>
                  <span className="text-fg-faint">
                    {count === 1 ? t('lessons.once') : t('lessons.times', { count })}
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
          title={t('lessons.emptyTitle')}
          body={t('lessons.emptyBody')}
          action={
            <Link to="/write">
              <Button>
                <PenLine className="size-4" />
                {t('dash.startWriting')}
              </Button>
            </Link>
          }
        />
      ) : (
        <section>
          <Tabs
            tabs={[
              { id: 'all', label: t('lessons.all'), count: all.length },
              ...(due.length > 0
                ? [{ id: 'due' as const, label: t('lessons.due'), count: due.length }]
                : []),
              { id: 'new', label: t('lessons.new'), count: all.filter((l) => l.status === 'new').length },
              {
                id: 'learning',
                label: t('lessons.learning'),
                count: all.filter((l) => l.status === 'learning').length,
              },
              {
                id: 'mastered',
                label: t('lessons.mastered'),
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
                      {ERROR_TYPE_LABEL[language][lesson.errorType]}
                    </span>
                    {/* Due beats mastered: a mastered lesson whose review has
                        come round is the one thing on this screen worth doing
                        today, and a green tick would say the opposite. */}
                    {isLessonDue(lesson) ? (
                      <Badge tone="warn">
                        <RotateCcw className="size-3" />
                        {t('lessons.due')}
                      </Badge>
                    ) : lesson.status === 'mastered' ? (
                      <Badge tone="good">
                        <CheckCircle2 className="size-3" />
                        {t('lessons.mastered')}
                      </Badge>
                    ) : lesson.status === 'learning' ? (
                      <Badge tone="warn">{t('lessons.learning')}</Badge>
                    ) : (
                      <Badge tone="violet">{t('lessons.new')}</Badge>
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
                    {t('lessons.questions', { count: lesson.exercises.length })}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-center text-sm text-fg-faint">{t('lessons.emptyGroup')}</p>
          )}
        </section>
      )}
    </div>
  )
}
