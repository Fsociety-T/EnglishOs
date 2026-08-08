import { useCallback, useEffect, useRef, useState } from 'react'

const BAR_COUNT = 40

export interface AudioRecorderState {
  recording: boolean
  seconds: number
  /** Recent loudness values 0-1, oldest first. Drives the waveform. */
  levels: number[]
  audioBlob: Blob | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

/**
 * Captures microphone audio and a live loudness trace for the waveform.
 *
 * Runs alongside the Web Speech API rather than feeding it: speech recognition
 * opens its own microphone internally, so the two are independent.
 */
export function useAudioRecorder(): AudioRecorderState {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0))
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (timerRef.current !== null) clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void audioContextRef.current?.close().catch(() => undefined)
    audioContextRef.current = null
    analyserRef.current = null
  }, [])

  // Always release the microphone if the screen unmounts mid-recording.
  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []
    setSeconds(0)
    setLevels(new Array(BAR_COUNT).fill(0))

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
      }
      recorder.start()

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      const buffer = new Uint8Array(analyser.frequencyBinCount)
      const sample = () => {
        const currentAnalyser = analyserRef.current
        if (!currentAnalyser) return
        currentAnalyser.getByteTimeDomainData(buffer)
        // Root mean square around the 128 midpoint gives perceived loudness.
        let sumSquares = 0
        for (let i = 0; i < buffer.length; i++) {
          const deviation = (buffer[i] - 128) / 128
          sumSquares += deviation * deviation
        }
        const rms = Math.sqrt(sumSquares / buffer.length)
        setLevels((prev) => [...prev.slice(1), Math.min(1, rms * 3)])
        rafRef.current = requestAnimationFrame(sample)
      }
      rafRef.current = requestAnimationFrame(sample)

      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      setRecording(true)
    } catch (err) {
      cleanup()
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission was refused. Allow it in your browser to record.'
          : 'Could not start recording. Check that a microphone is connected.',
      )
    }
  }, [cleanup])

  const stop = useCallback(() => {
    try {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    } catch {
      /* already stopped */
    }
    cleanup()
    setRecording(false)
  }, [cleanup])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setSeconds(0)
    setLevels(new Array(BAR_COUNT).fill(0))
    setError(null)
  }, [])

  return { recording, seconds, levels, audioBlob, error, start, stop, reset }
}
