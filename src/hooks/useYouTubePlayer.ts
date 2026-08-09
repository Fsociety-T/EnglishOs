import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A YouTube embed that will tell you where it has got to.
 *
 * A plain iframe cannot: there is no way to read playback position out of it,
 * which is why the podcast screen only ever embeds and never syncs. The IFrame
 * Player API can, and that single fact is what makes timed words possible.
 *
 * Only YouTube is wired up. Spotify's embed reports nothing comparable and
 * plays a thirty-second preview when signed out, so songs are YouTube-only and
 * the shelf says so when a different link is pasted.
 */

/** The slice of the YouTube API this app actually touches. */
interface YouTubePlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string
      host?: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: () => void
        onStateChange?: (event: { data: number }) => void
      }
    },
  ) => YouTubePlayer
  PlayerState: { PLAYING: number; ENDED: number }
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'

/**
 * Loaded once for the whole app, not once per song.
 *
 * The API calls a single global callback when it finishes, so a second loader
 * would overwrite the first one's callback and leave it waiting forever.
 * Deliberately not precached by the service worker: with no network there is
 * no video to follow anyway.
 */
let apiPromise: Promise<YouTubeApi> | null = null

function loadApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('The YouTube player loaded but is missing.'))
    }
    const script = document.createElement('script')
    script.src = API_SRC
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('The YouTube player could not be loaded.'))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

/** Fast enough that a line lights up on the beat, slow enough to be free. */
const POLL_MS = 100

export interface YouTubeController {
  /** Attach to the element the player should replace. */
  containerRef: React.RefObject<HTMLDivElement | null>
  ready: boolean
  playing: boolean
  /** Seconds into the video, updated while playing. */
  currentTime: number
  /** Total length, known once the player is ready. 0 until then. */
  duration: number
  error: string | null
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
}

export function useYouTubePlayer(videoId: string | null): YouTubeController {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoId || !containerRef.current) return
    let cancelled = false
    setReady(false)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    loadApi()
      .then((api) => {
        if (cancelled || !containerRef.current) return
        playerRef.current = new api.Player(containerRef.current, {
          videoId,
          // Match the nocookie embeds parseMediaUrl already produces.
          host: 'https://www.youtube-nocookie.com',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => {
              if (cancelled) return
              setReady(true)
              // Needed to know what "watched to the end" even means.
              try {
                setDuration(playerRef.current?.getDuration() ?? 0)
              } catch {
                setDuration(0)
              }
            },
            onStateChange: (event) => {
              if (cancelled) return
              setPlaying(event.data === api.PlayerState.PLAYING)
            },
          },
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy()
      } catch {
        // The iframe may already be gone with the unmounted subtree.
      }
      playerRef.current = null
    }
  }, [videoId])

  // Only while playing: a paused player's time cannot change, and a timer that
  // runs on every song screen forever is a battery cost for nothing.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const player = playerRef.current
      if (!player) return
      try {
        setCurrentTime(player.getCurrentTime())
      } catch {
        // Reading during teardown throws; the next tick is not coming anyway.
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [playing])

  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(Math.max(0, seconds), true)
    // Move the highlight immediately rather than waiting for the next poll.
    setCurrentTime(Math.max(0, seconds))
  }, [])

  return { containerRef, ready, playing, currentTime, duration, error, play, pause, seekTo }
}
