import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useNativeSpeech } from './useNativeSpeech'
import {
  appendPhrase,
  LONG_PAUSE_MS,
  MIC_REFUSED,
  type SpeechRecognitionState,
} from './speechState'

export type { SpeechRecognitionState }

/*
 * Minimal local typings for the Web Speech API.
 *
 * Deliberately not declared in the global scope: some TypeScript DOM lib
 * versions ship their own SpeechRecognition types, and a global re-declaration
 * would clash. Everything here is local and reached through a cast.
 */
interface SpeechRecognitionAlternativeLike {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResultLike {
  readonly length: number
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}
interface SpeechRecognitionResultListLike {
  readonly length: number
  [index: number]: SpeechRecognitionResultLike
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Which engine this build is talking to. Fixed for the life of the process -
 * an app cannot stop being an app - so the hook below can be chosen once at
 * module load instead of branching on every render.
 */
const IS_NATIVE = Capacitor.isNativePlatform()

/**
 * In the browser: Chrome and Edge only, so Safari and Firefox are false.
 * In the app: always true, because Android ships its own recogniser. Whether
 * this particular phone actually has one is checked when listening starts,
 * which is the first moment the answer is knowable.
 */
export const speechRecognitionSupported = IS_NATIVE || getConstructor() !== null

function useWebSpeech(lang = 'en-US'): SpeechRecognitionState {
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [longPauses, setLongPauses] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const lastResultAtRef = useRef<number>(0)
  // Chrome ends recognition on its own after a silence. While the user still
  // means to be recording, we restart it - this ref is what tells the two apart.
  const wantListeningRef = useRef(false)

  useEffect(() => {
    const Constructor = getConstructor()
    if (!Constructor) return

    const recognition = new Constructor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const now = Date.now()
      if (lastResultAtRef.current && now - lastResultAtRef.current > LONG_PAUSE_MS) {
        setLongPauses((n) => n + 1)
      }
      lastResultAtRef.current = now

      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalChunk += text
        else interimChunk += text
      }
      if (finalChunk) {
        setTranscript((prev) => appendPhrase(prev, finalChunk))
      }
      setInterim(interimChunk)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(
        event.error === 'not-allowed' ? MIC_REFUSED : `Speech recognition error: ${event.error}`,
      )
    }

    recognition.onend = () => {
      if (wantListeningRef.current) {
        try {
          recognition.start()
        } catch {
          /* already restarting */
        }
      } else {
        setListening(false)
      }
    }

    recognitionRef.current = recognition
    return () => {
      wantListeningRef.current = false
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        /* nothing to abort */
      }
    }
  }, [lang])

  const start = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    setError(null)
    wantListeningRef.current = true
    lastResultAtRef.current = 0
    try {
      recognition.start()
      setListening(true)
    } catch {
      // start() throws if it is already running, which is harmless here.
      setListening(true)
    }
  }, [])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
    setListening(false)
    setInterim('')
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setInterim('')
    setLongPauses(0)
    setError(null)
    lastResultAtRef.current = 0
  }, [])

  return { transcript, interim, listening, longPauses, error, start, stop, reset }
}

/**
 * Speaking practice calls this and never learns which engine answered.
 *
 * Chosen once, at module load, so neither implementation is ever mounted and
 * unmounted mid-session - swapping hooks between renders would throw away the
 * transcript the learner is in the middle of dictating.
 */
export const useSpeechRecognition: (lang?: string) => SpeechRecognitionState = IS_NATIVE
  ? useNativeSpeech
  : useWebSpeech
