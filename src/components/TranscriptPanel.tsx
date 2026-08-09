import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { formatTimestamp } from '@/lib/media'
import type { TranscriptLine } from '@/types'

function tokenize(line: string): string[] {
  return line.split(/(\s+)/).filter(Boolean)
}

/** Strip surrounding punctuation so a word saves clean. */
export function bareWord(token: string): string {
  return token.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '')
}

/**
 * The episode's words, in the page rather than painted inside the player.
 *
 * That is the whole point: YouTube's own captions cannot be tapped, saved or
 * asked about, because they live on the other side of an iframe. These are
 * ours, so every word is a button.
 */
export default function TranscriptPanel({
  lines,
  activeIndex,
  follow,
  onFollowChange,
  onJump,
  onSaveWord,
  savedWords,
  onReplace,
  onExplain,
}: {
  lines: TranscriptLine[]
  /** -1 when nothing is playing or the paste carried no times. */
  activeIndex: number
  follow: boolean
  onFollowChange: (follow: boolean) => void
  /** Absent when the episode cannot report its position, e.g. Spotify. */
  onJump?: (seconds: number) => void
  onSaveWord: (word: string, line: string) => void
  savedWords: Set<string>
  onReplace: () => void
  /** Send a line to the "what did they just say?" box. */
  onExplain: (line: string) => void
}) {
  const t = useT()
  const activeRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (!follow) return
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeIndex, follow])

  const timed = lines.some((line) => line.startSeconds !== null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-faint">{t('pod.transcriptHint')}</p>
        <div className="flex items-center gap-3">
          {timed && (
            <label className="inline-flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={follow}
                onChange={(e) => onFollowChange(e.target.checked)}
                className="accent-violet"
              />
              {t('pod.followAlong')}
            </label>
          )}
          <Button variant="ghost" onClick={onReplace} className="px-2 py-1">
            {t('pod.replaceTranscript')}
          </Button>
        </div>
      </div>

      {/* Its own scroller: a two hour episode must not push the player away. */}
      <ul className="max-h-[60vh] space-y-1 overflow-y-auto rounded-glass glass p-3">
        {lines.map((line, i) => (
          <li
            key={`${i}-${line.startSeconds ?? 'x'}`}
            ref={i === activeIndex ? activeRef : null}
            className={cn(
              'rounded-xl px-3 py-2 leading-relaxed transition',
              i === activeIndex ? 'bg-violet/15 text-fg' : 'text-fg-muted',
            )}
          >
            {line.startSeconds !== null && (
              <button
                type="button"
                onClick={() => onJump?.(line.startSeconds ?? 0)}
                disabled={!onJump}
                title={t('pod.jumpHere')}
                className="mr-2 font-mono text-xs text-fg-faint transition hover:text-violet-soft disabled:hover:text-fg-faint"
              >
                {formatTimestamp(line.startSeconds)}
              </button>
            )}
            <button
              type="button"
              onClick={() => onExplain(line.text)}
              title={t('pod.explainLine')}
              className="mr-2 rounded px-1 text-xs text-fg-faint transition hover:bg-violet/20 hover:text-violet-soft"
            >
              ?
            </button>
            {tokenize(line.text).map((token, j) =>
              token.trim() === '' ? (
                <span key={j}>{token}</span>
              ) : (
                <button
                  key={j}
                  type="button"
                  onClick={() => onSaveWord(token, line.text)}
                  title={t('pod.saveThisWord')}
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
    </div>
  )
}
