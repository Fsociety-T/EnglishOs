import { useState } from 'react'
import { LockKeyhole, Loader2, LogIn, UserPlus } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { requireSupabase } from '@/services/db/supabaseClient'

type Mode = 'sign-in' | 'sign-up'

/** Standard email-and-password authentication for the cloud version of EnglishOS. */
export default function Auth() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signingUp = mode === 'sign-up'

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setError(null)
    setConfirmPassword('')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const address = email.trim()
    if (!address || !password) return
    if (signingUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (signingUp && password.length < 6) {
      setError('Choose a password with at least 6 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const supabase = requireSupabase()
      const result = signingUp
        ? await supabase.auth.signUp({ email: address, password })
        : await supabase.auth.signInWithPassword({ email: address, password })
      if (result.error) throw new Error(result.error.message)

      // If email confirmation is enabled in Supabase, no session is returned.
      // Explain the configuration issue clearly instead of leaving the form idle.
      if (signingUp && !result.data.session) {
        throw new Error(
          'Account created, but email confirmation is enabled. Disable “Confirm email” in Supabase Auth settings to allow immediate password sign-in.',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-neon text-lg font-extrabold text-ink-950">
          E
        </span>
        <span className="text-2xl font-bold tracking-tight">
          <span className="text-gradient">English</span>
          <span className="text-fg">OS</span>
        </span>
      </div>

      <Card>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => switchMode('sign-in')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              !signingUp ? 'bg-violet text-white shadow-sm' : 'text-fg-muted hover:text-fg'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('sign-up')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              signingUp ? 'bg-violet text-white shadow-sm' : 'text-fg-muted hover:text-fg'
            }`}
          >
            Create account
          </button>
        </div>

        <h1 className="text-lg font-semibold">{signingUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          {signingUp
            ? 'Create an account to keep your English practice in sync across devices.'
            : 'Sign in to continue practising and keep your progress synced.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-fg-muted">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-fg-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={signingUp ? 'new-password' : 'current-password'}
              minLength={signingUp ? 6 : undefined}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-fg outline-none focus:border-violet/50"
            />
          </div>

          {signingUp && (
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm text-fg-muted">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-fg outline-none focus:border-violet/50"
              />
            </div>
          )}

          {error && <p className="text-sm text-bad">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {signingUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : signingUp ? (
              <>
                <UserPlus className="size-4" />
                Create account
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Sign in
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-fg-faint">
          <LockKeyhole className="size-3.5" /> Your password is securely handled by Supabase.
        </p>
      </Card>
    </main>
  )
}
