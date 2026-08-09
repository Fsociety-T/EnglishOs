import { useState } from 'react'
import { LockKeyhole, Loader2, LogIn, UserPlus } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useLanguage } from '@/i18n'
import { requireSupabase } from '@/services/db/supabaseClient'
import { LANGUAGE_NAME, LEARNING_LANGUAGES } from '@/types'
import { cn } from '@/lib/utils'

type Mode = 'sign-in' | 'sign-up'

/** Standard email-and-password authentication for the cloud version of EnglishOS. */
export default function Auth() {
  const { language, t, previewLanguage } = useLanguage()
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
      setError(t('auth.passwordMismatch'))
      return
    }
    if (signingUp && password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const supabase = requireSupabase()
      const result = signingUp
        ? await supabase.auth.signUp({
            email: address,
            password,
            // The database trigger reads this to create the profile already set
            // to the right language, so the first screen after sign-up is
            // never in the wrong one.
            options: { data: { language } },
          })
        : await supabase.auth.signInWithPassword({ email: address, password })
      if (result.error) throw new Error(result.error.message)

      // If email confirmation is enabled in Supabase, no session is returned.
      // Explain the configuration issue clearly instead of leaving the form idle.
      if (signingUp && !result.data.session) {
        throw new Error(t('auth.confirmEmailError'))
      }

      // A brand new account has no measured level, only the B1 the profile
      // defaults to. Land on the placement test instead of a dashboard that has
      // already quietly guessed - the test screen offers "not now" for anyone
      // who would rather just start writing.
      if (signingUp) window.location.hash = '#/level'
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.genericError'))
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
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('sign-up')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              signingUp ? 'bg-violet text-white shadow-sm' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {t('auth.createAccount')}
          </button>
        </div>

        <h1 className="text-lg font-semibold">
          {signingUp ? t('auth.createTitle') : t('auth.welcomeBack')}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          {signingUp ? t('auth.createBlurb') : t('auth.signInBlurb')}
        </p>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          {signingUp && (
            <div>
              <span className="mb-1.5 block text-sm text-fg-muted">
                {t('auth.languageQuestion')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {LEARNING_LANGUAGES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => previewLanguage(option)}
                    aria-pressed={language === option}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm font-semibold transition',
                      language === option
                        ? 'border-violet/40 bg-violet/15 text-fg'
                        : 'border-white/10 bg-white/5 text-fg-muted hover:bg-white/10',
                    )}
                  >
                    {LANGUAGE_NAME[option]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-fg-faint">{t('auth.languageHint')}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-fg-muted">
              {t('auth.email')}
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
              {t('auth.password')}
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
                {t('auth.confirmPassword')}
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
                {signingUp ? t('auth.creating') : t('auth.signingIn')}
              </>
            ) : signingUp ? (
              <>
                <UserPlus className="size-4" />
                {t('auth.createAccount')}
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                {t('auth.signIn')}
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-fg-faint">
          <LockKeyhole className="size-3.5" /> {t('auth.securedBy')}
        </p>
      </Card>
    </main>
  )
}
