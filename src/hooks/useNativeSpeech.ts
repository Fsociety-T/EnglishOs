import { useCallback, useEffect, useRef, useState } from 'react'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import type { PluginListenerHandle } from '@capacitor/core'
import {
  appendPhrase,
  LONG_PAUSE_MS,
  MIC_REFUSED,
  type SpeechRecognitionState,
} from './speechState'

/**
 * Speaking practice inside the Android app.
 *
 * An Android WebView has no Web Speech API - that is a Chrome feature, and the
 * APK is not Chrome. This routes the same hook to Android's own recogniser
 * instead, so the live transcript survives the move off the browser.
 *
 * Two differences from the browser engine shape everything below:
 *
 * 1. Android reports the *whole* current utterance in every partial result,
 *    not the new words since the last one. So a partial replaces `interim`
 *    rather than being appended to it.
 * 2. Android stops listening by itself at the end of an utterance, with no
 *    equivalent of `continuous`. So each stop commits what was heard and, if
 *    the learner has not pressed stop, starts a fresh utterance.
 */

/** Android refuses a restart issued from inside its own stop callback. */
const RESTART_DELAY_MS = 250

export function useNativeSpeech(lang = 'en-US'): SpeechRecognitionState {
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [longPauses, setLongPauses] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const wantListeningRef = useRef(false)
  const lastResultAtRef = useRef(0)
  // Committing on stop needs the newest partial, and the stop event arrives
  // from native code that never sees React state.
  const interimRef = useRef('')
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commitInterim = useCallback(() => {
    const phrase = interimRef.current
    interimRef.current = ''
    setInterim('')
    if (phrase.trim()) setTranscript((prev) => appendPhrase(prev, phrase))
  }, [])

  const beginUtterance = useCallback(async () => {
    try {
      await SpeechRecognition.start({
        language: lang,
        partialResults: true,
        // The popup is Android's own full-screen listening dialog. It would
        // cover the prompt the learner is answering, and it suppresses partial
        // results entirely, which is the whole point of the live transcript.
        popup: false,
      })
    } catch (cause) {
      wantListeningRef.current = false
      setListening(false)
      setError(cause instanceof Error ? cause.message : 'Speech recognition failed to start.')
    }
  }, [lang])

  useEffect(() => {
    let cancelled = false
    const handles: PluginListenerHandle[] = []

    const attach = async () => {
      const partial = await SpeechRecognition.addListener('partialResults', (data) => {
        const best = data.matches?.[0] ?? ''

        const now = Date.now()
        if (lastResultAtRef.current && now - lastResultAtRef.current > LONG_PAUSE_MS) {
          setLongPauses((n) => n + 1)
        }
        lastResultAtRef.current = now

        interimRef.current = best
        setInterim(best)
      })

      const state = await SpeechRecognition.addListener('listeningState', (data) => {
        if (data.status === 'started') return

        commitInterim()
        if (!wantListeningRef.current) {
          setListening(false)
          return
        }
        restartTimerRef.current = setTimeout(() => {
          if (wantListeningRef.current) void beginUtterance()
        }, RESTART_DELAY_MS)
      })

      if (cancelled) {
        void partial.remove()
        void state.remove()
        return
      }
      handles.push(partial, state)
    }

    void attach()

    return () => {
      cancelled = true
      wantListeningRef.current = false
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      handles.forEach((handle) => void handle.remove())
      void SpeechRecognition.stop().catch(() => {
        /* nothing was listening */
      })
    }
  }, [beginUtterance, commitInterim])

  const start = useCallback(() => {
    void (async () => {
      setError(null)
      lastResultAtRef.current = 0

      const { available } = await SpeechRecognition.available()
      if (!available) {
        setError('This phone has no speech recogniser installed.')
        return
      }

      let status = (await SpeechRecognition.checkPermissions()).speechRecognition
      if (status !== 'granted') {
        status = (await SpeechRecognition.requestPermissions()).speechRecognition
      }
      if (status !== 'granted') {
        setError(MIC_REFUSED)
        return
      }

      wantListeningRef.current = true
      setListening(true)
      await beginUtterance()
    })()
  }, [beginUtterance])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    setListening(false)
    // Commit before stopping: the stop event may not arrive if nothing was
    // being heard, and the last phrase must not be lost either way.
    commitInterim()
    void SpeechRecognition.stop().catch(() => {
      /* already stopped */
    })
  }, [commitInterim])

  const reset = useCallback(() => {
    setTranscript('')
    setInterim('')
    interimRef.current = ''
    setLongPauses(0)
    setError(null)
    lastResultAtRef.current = 0
  }, [])

  return { transcript, interim, listening, longPauses, error, start, stop, reset }
}
