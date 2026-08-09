import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Pause,
  Play,
  Undo2,
} from 'lucide-react'
import { Badge, Button, Card, Spinner, Tabs } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useLanguage, useT } from '@/i18n'
import { detectWrongLanguage } from '@/lib/detectLanguage'
import { formatTimestamp } from '@/lib/media'
import { newId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { SongLine } from '@/types'

type Mode = 'words' | 'timing' | 'sing'

/** The line that should be lit: the last one that has started. */
function activeIndex(lines: SongLine[], at: number): number {
  let index = -1
  for (let i = 0; i < lines.length; i++) {
    const start = lines[i].startSeconds
    if (start !== null && start <= at) index = i
  }
  return index
}

/** Split a line into words and the punctuation between them, keeping both. */
function tokenize(line: string): string[] {
  return line.split(/(\s+)/).filter(Boolean)
}

/** Strip punctuation so "night," saves as "night". */
function bareWord(token: string): string {
  return token.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '')
}

export default function SongDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepo()
  const { language } = useLanguage()
  const t = useT()

  const { data: song, loading, reload } = useAsync(
    () => (id ? repo.getSong(id) : Promise.resolve(null)),
    [id],
  )

  const [mode, setMode] = useState<Mode>('sing')
  const [draft, setDraft] = useState('')
  const [languageWarning, setLanguageWarning] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0)
  const [follow, setFollow] = useState(true)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const activeRef = useRef<HTMLLIElement | null>(null)

  const player = useYouTubePlayer(song?.embedId ?? null)
  const lines = useMemo(() => song?.lines ?? [], [song])
  const active = activeIndex(lines, player.currentTime)

  // A song with no words can only be in one mode, and a song with words but no
  // timings opens on timing. Guessing this saves a tap every single time.
  useEffect(() => {
    if (!song) return
    setDraft(song.lines.map((line) => line.text).join('\n'))
    if (song.lines.length === 0) setMode('words')
    else if (song.lines.every((line) => line.startSeconds === null)) setMode('timing')
    else setMode('sing')
    setCursor(song.lines.findIndex((line) => line.startSeconds === null))
  }, [song])

  // Keep the lit line in the middle, unless the learner has scrolled away.
  useEffect(() => {
    if (mode !== 'sing' || !follow) return
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [active, mode, follow])

  if (loading) return <Spinner label={t('song.loading')} />

  if (!song) {
    return (
      <Card>
        <p className="text-fg-muted">{t('song.notFound')}</p>
        <div className="mt-4">
          <Link to="/songs">
            <Button variant="outline">{t('song.back')}</Button>
          </Link>
        </div>
      </Card>
    )
  }

  async function saveWords() {
    if (!song) return
    const texts = draft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    // Warn, never block: a song may legitimately carry a line in another
    // language, and refusing the learner's own transcription helps nobody.
    const wrong = detectWrongLanguage(texts.join(' '), song.language)
    setLanguageWarning(wrong ? t('song.languageWarning') : null)

    // Keep any timing already tapped for a line whose text has not changed.
    const previous = new Map(song.lines.map((line) => [line.text, line.startSeconds]))
    const next: SongLine[] = texts.map((text) => ({
      text,
      startSeconds: previous.get(text) ?? null,
    }))

    await repo.updateSong(song.id, { lines: next })
    reload()
    setMode('timing')
  }

  async function stamp() {
    if (!song || cursor < 0 || cursor >= lines.length) return
    const next = lines.map((line, i) =>
      i === cursor ? { ...line, startSeconds: Math.max(0, Math.round(player.currentTime)) } : line,
    )
    await repo.updateSong(song.id, { lines: next })
    setCursor(cursor + 1 < lines.length ? cursor + 1 : -1)
    reload()
  }

  async function undoStamp() {
    if (!song) return
    const target = cursor === -1 ? lines.length - 1 : cursor - 1
    if (target < 0) return
    const next = lines.map((line, i) => (i === target ? { ...line, startSeconds: null } : line))
    await repo.updateSong(song.id, { lines: next })
    setCursor(target)
    reload()
  }

  async function saveWord(token: string) {
    const word = bareWord(token)
    if (!word || savedWords.has(word.toLowerCase()) || !song) return
    await repo.addWord({
      id: newId(),
      language,
      word,
      definition: '',
      example: lines[active]?.text ?? '',
      tags: ['song'],
      source: 'song',
      sourceId: song.id,
      srsBox: 1,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
    await repo.recordActivity({ wordsLearned: 1 })
    setSavedWords((prev) => new Set(prev).add(word.toLowerCase()))
  }

  const timed = lines.filter((line) => line.startSeconds !== null).length

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t('song.back')}
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{song.title}</h1>
          {song.artist && <p className="mt-0.5 text-sm text-fg-muted">{song.artist}</p>}
        </div>
        <a
          href={song.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
        >
          {t('song.openOnYouTube')}
          <ExternalLink className="size-3.5" />
        </a>
      </header>

      {/* Player. Kept mounted across modes so timing never restarts the song. */}
      <div className="overflow-hidden rounded-glass border border-white/10">
        <div className="aspect-video w-full">
          <div ref={player.containerRef} className="size-full" />
        </div>
      </div>
      {player.error && (
        <p className="rounded-xl border border-bad/30 bg-bad/15 px-4 py-3 text-sm text-bad">
          {player.error}
        </p>
      )}

      <div className="max-w-md">
        <Tabs
          tabs={[
            { id: 'words', label: t('song.tabWords') },
            { id: 'timing', label: t('song.tabTiming'), count: lines.length ? timed : undefined },
            { id: 'sing', label: t('song.tabSing') },
          ]}
          active={mode}
          onChange={setMode}
        />
      </div>

      {/* ------------------------------------------------------------ words */}
      {mode === 'words' && (
        <Card>
          <p className="text-sm leading-relaxed text-fg-muted">{t('song.wordsBlurb')}</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('song.wordsPlaceholder')}
            className="mt-3 min-h-[40vh] w-full resize-y rounded-xl border border-white/10 bg-white/5 p-4 text-base leading-loose text-fg outline-none placeholder:text-fg-faint focus:border-violet/50"
          />
          {languageWarning && (
            <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
              {languageWarning}
            </p>
          )}
          <div className="mt-4">
            <Button onClick={saveWords} disabled={!draft.trim()}>
              {t('song.saveWords')}
            </Button>
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------------- timing */}
      {mode === 'timing' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={player.playing ? player.pause : player.play}>
                  {player.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {player.playing ? t('song.pause') : t('song.play')}
                </Button>
                <span className="font-mono text-sm text-fg-muted">
                  {formatTimestamp(player.currentTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={undoStamp} disabled={timed === 0}>
                  <Undo2 className="size-4" />
                  {t('song.backOne')}
                </Button>
                <Button onClick={stamp} disabled={cursor < 0 || !player.ready}>
                  {t('song.setTime')}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm text-fg-faint">{t('song.timingBlurb')}</p>
          </Card>

          <ol className="space-y-1">
            {lines.map((line, i) => (
              <li
                key={`${i}-${line.text}`}
                className={cn(
                  'flex items-baseline gap-3 rounded-xl px-3 py-2 text-sm',
                  i === cursor && 'bg-violet/15 text-fg',
                  i !== cursor && line.startSeconds !== null && 'text-fg-muted',
                  i !== cursor && line.startSeconds === null && 'text-fg-faint',
                )}
              >
                <span className="w-14 shrink-0 font-mono text-xs">
                  {line.startSeconds === null ? '--:--' : formatTimestamp(line.startSeconds)}
                </span>
                {line.startSeconds !== null && <Check className="size-3.5 shrink-0 text-good" />}
                <span className="leading-relaxed">{line.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ------------------------------------------------------------- sing */}
      {mode === 'sing' && (
        <div className="space-y-4">
          {timed === 0 ? (
            <Card>
              <p className="text-sm leading-relaxed text-fg-muted">{t('song.noTimingsYet')}</p>
              <div className="mt-4">
                <Button onClick={() => setMode(lines.length ? 'timing' : 'words')}>
                  {lines.length ? t('song.goTiming') : t('song.goWords')}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" onClick={player.playing ? player.pause : player.play}>
                  {player.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {player.playing ? t('song.pause') : t('song.play')}
                </Button>
                <label className="inline-flex items-center gap-2 text-sm text-fg-muted">
                  <input
                    type="checkbox"
                    checked={follow}
                    onChange={(e) => setFollow(e.target.checked)}
                    className="accent-violet"
                  />
                  {t('song.follow')}
                </label>
              </div>

              <p className="text-sm text-fg-faint">{t('song.singBlurb')}</p>

              <ul className="space-y-2">
                {lines.map((line, i) => (
                  <li
                    key={`${i}-${line.text}`}
                    ref={i === active ? activeRef : null}
                    className={cn(
                      'rounded-xl px-3 py-2 transition',
                      i === active
                        ? 'bg-violet/15 text-lg font-medium text-fg'
                        : 'text-base text-fg-faint',
                    )}
                  >
                    {line.startSeconds !== null && (
                      <button
                        type="button"
                        onClick={() => player.seekTo(line.startSeconds ?? 0)}
                        title={t('song.jumpHere')}
                        className="mr-2 font-mono text-xs text-fg-faint transition hover:text-violet-soft"
                      >
                        {formatTimestamp(line.startSeconds)}
                      </button>
                    )}
                    {tokenize(line.text).map((token, j) =>
                      token.trim() === '' ? (
                        <span key={j}>{token}</span>
                      ) : (
                        <button
                          key={j}
                          type="button"
                          onClick={() => saveWord(token)}
                          title={t('song.saveWord')}
                          className={cn(
                            'rounded px-0.5 transition hover:bg-violet/20 hover:text-fg',
                            savedWords.has(bareWord(token).toLowerCase()) &&
                              'text-good underline decoration-dotted underline-offset-4',
                          )}
                        >
                          {token}
                        </button>
                      ),
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
