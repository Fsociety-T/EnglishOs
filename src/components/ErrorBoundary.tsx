import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Without this, one bad render blanks the whole app and the learner loses the
 * session they were in the middle of. This keeps the failure visible and
 * explains that their saved work is untouched.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EnglishOS crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <div className="rounded-glass glass p-6">
          <h1 className="text-xl font-bold text-fg">Something broke on this screen</h1>
          <p className="mt-2 leading-relaxed text-fg-muted">
            Your saved sessions, words and streak are safe - nothing was deleted. Reloading
            usually fixes it.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-white/5 p-3 font-mono text-xs text-fg-faint">
            {error.message}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-neon px-4 py-2.5 text-sm font-semibold text-ink-950"
            >
              Reload the app
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/'
                window.location.reload()
              }}
              className="rounded-xl glass px-4 py-2.5 text-sm text-fg"
            >
              Go to the dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
