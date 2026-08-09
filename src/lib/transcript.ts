/**
 * Reading a transcript the learner pasted in.
 *
 * The app cannot take this from YouTube: the player is on another origin, and
 * scraping their caption endpoint is both against their terms and one silent
 * change away from breaking. So the learner copies it from the panel YouTube
 * already shows them, and this turns that paste into something the page can
 * follow along with.
 *
 * The formats below are what that copy actually looks like in the wild, which
 * is messier than any spec: sometimes the time sits on its own line above the
 * speech, sometimes in front of it, sometimes in brackets, and sometimes there
 * are no times at all. A transcript with no times is still worth having - it
 * just cannot light up as it plays.
 */

import type { TranscriptLine } from '@/types'

export type { TranscriptLine }

/** `2:05`, `12:05`, `1:02:03`, optionally wrapped in brackets. */
const STAMP = /^\[?\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.\d+)?\s*\]?/

function toSeconds(hours: string | undefined, minutes: string, seconds: string): number {
  return (hours ? Number(hours) * 3600 : 0) + Number(minutes) * 60 + Number(seconds)
}

export function parseTranscript(raw: string): TranscriptLine[] {
  const out: TranscriptLine[] = []
  /** A time on its own line belongs to the next line that has words. */
  let pending: number | null = null

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const match = STAMP.exec(line)
    if (!match) {
      out.push({ text: line, startSeconds: pending })
      pending = null
      continue
    }

    const at = toSeconds(match[1], match[2], match[3])
    const rest = line.slice(match[0].length).trim()

    if (rest) {
      out.push({ text: rest, startSeconds: at })
      pending = null
    } else {
      // Time alone: hold it for the words on the next line.
      pending = at
    }
  }

  return out
}

/** The line being spoken: the last one that has started. */
export function transcriptIndexAt(lines: TranscriptLine[], at: number): number {
  let index = -1
  for (let i = 0; i < lines.length; i++) {
    const start = lines[i].startSeconds
    if (start !== null && start <= at) index = i
  }
  return index
}

export function timedCount(lines: TranscriptLine[]): number {
  return lines.filter((line) => line.startSeconds !== null).length
}
