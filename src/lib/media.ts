import type { PodcastPlatform } from '@/types'

export interface ParsedMedia {
  platform: PodcastPlatform
  embedId: string | null
  thumbnailUrl: string | null
  embedUrl: string | null
}

/**
 * Work out what a pasted link is and how to embed it.
 *
 * Done with URL parsing rather than a network call so adding a podcast is
 * instant and works offline. YouTube thumbnails are predictable from the video
 * id, which is why no oEmbed request is needed.
 */
export function parseMediaUrl(rawUrl: string): ParsedMedia {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return { platform: 'other', embedId: null, thumbnailUrl: null, embedUrl: null }
  }

  const host = url.hostname.replace(/^www\./, '')

  // youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, /shorts/ID
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    let id: string | null = null
    if (host === 'youtu.be') {
      id = url.pathname.slice(1) || null
    } else if (url.pathname === '/watch') {
      id = url.searchParams.get('v')
    } else {
      const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/)
      id = match?.[2] ?? null
    }
    if (id) {
      return {
        platform: 'youtube',
        embedId: id,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      }
    }
  }

  // open.spotify.com/episode/ID or /show/ID
  if (host === 'open.spotify.com') {
    const match = url.pathname.match(/^\/(episode|show)\/([^/?]+)/)
    if (match) {
      return {
        platform: 'spotify',
        embedId: match[2],
        thumbnailUrl: null,
        embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
      }
    }
  }

  return { platform: 'other', embedId: null, thumbnailUrl: null, embedUrl: null }
}

/** A readable fallback title before the learner renames it. */
export function guessTitle(rawUrl: string, platform: PodcastPlatform): string {
  if (platform === 'youtube') return 'YouTube video'
  if (platform === 'spotify') return 'Spotify episode'
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return 'Saved link'
  }
}

export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`
}
