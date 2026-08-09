import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner, Tabs } from '@/components/ui'
import { useT } from '@/i18n'
import type { StringKey } from '@/i18n/strings'
import { useAsync } from '@/hooks/useAsync'
import { guessTitle, parseMediaUrl } from '@/lib/media'
import { formatRelative, newId } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { PodcastStatus } from '@/types'

type Tab = 'all' | PodcastStatus

const STATUS_KEY: Record<PodcastStatus, StringKey> = {
  'to-watch': 'pod.toWatch',
  watching: 'pod.watching',
  done: 'pod.done',
}

export default function Podcasts() {
  const repo = useRepo()
  const t = useT()
  const [tab, setTab] = useState<Tab>('all')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: podcasts, loading, reload } = useAsync(() => repo.listPodcasts(), [])
  const all = useMemo(() => podcasts ?? [], [podcasts])
  const visible = tab === 'all' ? all : all.filter((p) => p.status === tab)

  async function add() {
    const trimmed = url.trim()
    if (!trimmed || adding) return
    setAdding(true)
    setError(null)

    const parsed = parseMediaUrl(trimmed)
    if (parsed.platform === 'other' && !/^https?:\/\//i.test(trimmed)) {
      setError(t('pod.badLink'))
      setAdding(false)
      return
    }

    await repo.addPodcast({
      id: newId(),
      title: title.trim() || guessTitle(trimmed, parsed.platform),
      url: trimmed,
      platform: parsed.platform,
      embedId: parsed.embedId,
      thumbnailUrl: parsed.thumbnailUrl,
      status: 'to-watch',
      progressSeconds: 0,
      createdAt: new Date().toISOString(),
    })
    setUrl('')
    setTitle('')
    setAdding(false)
    reload()
  }

  if (loading) return <Spinner label={t('pod.loading')} />

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Podcast shelf</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Save anything you want to watch or listen to later, then take notes while you do.
        </p>
      </header>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={t('pod.linkPlaceholder')}
            className={inputClass}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={t('pod.titlePlaceholder')}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50 sm:w-56"
          />
          <Button onClick={add} disabled={!url.trim() || adding}>
            <Plus className="size-4" />
            Save
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      </Card>

      {all.length === 0 ? (
        <EmptyState
          icon={<Headphones className="size-6" />}
          title={t('pod.emptyTitle')}
          body={t('pod.emptyBody')}
        />
      ) : (
        <section>
          <Tabs
            tabs={[
              { id: 'all', label: t('lessons.all'), count: all.length },
              {
                id: 'to-watch',
                label: t('pod.toWatch'),
                count: all.filter((p) => p.status === 'to-watch').length,
              },
              {
                id: 'watching',
                label: t('pod.watching'),
                count: all.filter((p) => p.status === 'watching').length,
              },
              { id: 'done', label: t('pod.done'), count: all.filter((p) => p.status === 'done').length },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((podcast) => (
              <Card key={podcast.id} className="group h-full overflow-hidden p-0">
                <Link to={`/podcasts/${podcast.id}`} className="block">
                  {podcast.thumbnailUrl ? (
                    <img
                      src={podcast.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-video w-full place-items-center bg-white/5 text-fg-faint">
                      <Headphones className="size-8" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/podcasts/${podcast.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium text-fg">{podcast.title}</p>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${podcast.title}`}
                      onClick={async () => {
                        await repo.deletePodcast(podcast.id)
                        reload()
                      }}
                      className="rounded-lg p-1.5 text-fg-faint opacity-0 transition hover:bg-bad/15 hover:text-bad group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge
                      tone={
                        podcast.status === 'done'
                          ? 'good'
                          : podcast.status === 'watching'
                            ? 'warn'
                            : 'neutral'
                      }
                    >
                      {t(STATUS_KEY[podcast.status])}
                    </Badge>
                    <span className="text-xs text-fg-faint">
                      {formatRelative(podcast.createdAt)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-center text-sm text-fg-faint">Nothing in this group.</p>
          )}
        </section>
      )}
    </div>
  )
}
