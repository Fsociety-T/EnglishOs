import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gauge, Mic, PenLine, ScrollText } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner, Tabs } from '@/components/ui'
import { useSessions } from '@/hooks/useContent'
import { useT } from '@/i18n'
import { formatRelative } from '@/lib/utils'
import type { SessionKind } from '@/types'

type Filter = 'all' | SessionKind

/** Fair across long and short pieces, which a raw mistake count is not. */
function mistakeRate(corrections: number, words: number): number {
  return words > 0 ? Math.round((corrections / words) * 1000) / 10 : 0
}

/**
 * Everything you have written and said, in one place.
 *
 * Until this existed the app stored every session and offered no way back to
 * any of them but the most recent - the work was kept and unreachable. Reading
 * something you wrote a month ago and wincing is one of the clearest signs of
 * progress a learner ever gets, and it was the one thing the app would not
 * let them do.
 */
export default function History() {
  const t = useT()
  const [filter, setFilter] = useState<Filter>('all')
  const { data: sessions, loading } = useSessions()

  const all = useMemo(() => sessions ?? [], [sessions])
  const visible = filter === 'all' ? all : all.filter((s) => s.kind === filter)

  if (loading) return <Spinner label={t('history.loading')} />

  const writingCount = all.filter((s) => s.kind === 'writing').length

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('history.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('history.subtitle')}</p>
      </header>

      {all.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="size-6" />}
          title={t('history.emptyTitle')}
          body={t('history.emptyBody')}
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
              { id: 'all', label: t('history.all'), count: all.length },
              { id: 'writing', label: t('session.writing'), count: writingCount },
              {
                id: 'speaking',
                label: t('session.speaking'),
                count: all.length - writingCount,
              },
            ]}
            active={filter}
            onChange={setFilter}
          />

          <div className="mt-4 space-y-2">
            {visible.map((session) => (
              <Link key={session.id} to={`/session/${session.id}`} className="block">
                <Card className="p-4 transition hover:bg-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={session.kind === 'writing' ? 'violet' : 'info'}>
                          {session.kind === 'writing' ? (
                            <PenLine className="size-3" />
                          ) : (
                            <Mic className="size-3" />
                          )}
                          {t(session.kind === 'writing' ? 'session.writing' : 'session.speaking')}
                        </Badge>
                        {/* The placement tests are the spine of the story: they
                            are where the app last told you what level you are. */}
                        {session.isPlacement && (
                          <Badge tone="good">
                            <Gauge className="size-3" />
                            {session.estimatedLevel ?? t('history.placement')}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 truncate font-medium text-fg">{session.topicTitle}</p>
                      <p className="mt-1 text-sm text-fg-faint">
                        {formatRelative(session.createdAt)} &middot;{' '}
                        {t('session.words', { count: session.wordCount })} &middot;{' '}
                        {t('history.mistakeRate', {
                          rate: mistakeRate(session.corrections.length, session.wordCount),
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-2xl font-bold text-gradient">
                      {session.scores.overall}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-center text-sm text-fg-faint">{t('history.emptyGroup')}</p>
          )}
        </section>
      )}
    </div>
  )
}
