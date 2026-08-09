import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Music, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner } from '@/components/ui'
import { useLanguage, useT } from '@/i18n'
import { useSongs } from '@/hooks/useContent'
import { parseMediaUrl } from '@/lib/media'
import { formatRelative, newId } from '@/lib/utils'
import { useRepo } from '@/services/db'

export default function Songs() {
  const repo = useRepo()
  const { language } = useLanguage()
  const t = useT()

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const { data: songs, loading, reload } = useSongs()

  async function add() {
    const trimmed = url.trim()
    if (!trimmed || !title.trim() || adding) return

    // YouTube only, and said plainly at the point of pasting rather than
    // discovered later on a song that will not follow along.
    const parsed = parseMediaUrl(trimmed)
    if (parsed.platform !== 'youtube' || !parsed.embedId) {
      setError(t('song.youtubeOnly'))
      return
    }

    setAdding(true)
    setError(null)
    await repo.addSong({
      id: newId(),
      language,
      title: title.trim(),
      artist: artist.trim(),
      url: trimmed,
      embedId: parsed.embedId,
      lines: [],
      createdAt: new Date().toISOString(),
    })
    setUrl('')
    setTitle('')
    setArtist('')
    setAdding(false)
    reload()
  }

  if (loading) return <Spinner label={t('song.loading')} />

  const all = songs ?? []
  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('song.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('song.subtitle')}</p>
      </header>

      <Card>
        <div className="space-y-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('song.linkPlaceholder')}
            className={inputClass}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('song.titlePlaceholder')}
              className={inputClass}
            />
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder={t('song.artistPlaceholder')}
              className={inputClass}
            />
            <Button onClick={add} disabled={!url.trim() || !title.trim() || adding}>
              <Plus className="size-4" />
              {t('song.add')}
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      </Card>

      {all.length === 0 ? (
        <EmptyState
          icon={<Music className="size-6" />}
          title={t('song.emptyTitle')}
          body={t('song.emptyBody')}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((song) => {
            const timed = song.lines.filter((line) => line.startSeconds !== null).length
            return (
              // Not <Card>: this one needs its own padding and a positioning
              // context, and `cn` is a plain join, so a p-0 next to Card's p-5
              // would be a coin toss decided by stylesheet order.
              <div
                key={song.id}
                className="rounded-glass glass group relative h-full overflow-hidden transition hover:bg-white/10"
              >
                <Link to={`/songs/${song.id}`} className="block">
                  {song.embedId && (
                    <img
                      src={`https://i.ytimg.com/vi/${song.embedId}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <p className="truncate font-medium text-fg">{song.title}</p>
                    {song.artist && (
                      <p className="truncate text-sm text-fg-faint">{song.artist}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {song.lines.length === 0 ? (
                        <Badge tone="violet">{t('song.needsWords')}</Badge>
                      ) : timed === 0 ? (
                        <Badge tone="warn">{t('song.needsTiming')}</Badge>
                      ) : timed < song.lines.length ? (
                        <Badge tone="warn">
                          {t('song.partlyTimed', { done: timed, total: song.lines.length })}
                        </Badge>
                      ) : (
                        <Badge tone="good">{t('song.readyToSing')}</Badge>
                      )}
                      <span className="text-xs text-fg-faint">
                        {formatRelative(song.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label={t('song.delete', { title: song.title })}
                  onClick={async () => {
                    await repo.deleteSong(song.id)
                    reload()
                  }}
                  className="absolute top-2 right-2 rounded-lg bg-ink-950/70 p-1.5 text-fg-faint opacity-0 transition hover:text-bad group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
