import { useState } from 'react'
import { Check, Loader2, Mail } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { requireSupabase } from '@/services/db/supabaseClient'

/**
 * Magic-link sign in: no password to choose, forget, or leak. The redirect
 * keeps the current origin and path so it works on GitHub Pages under a
 * subdirectory as well as on localhost.
 */
export default function Auth() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendLink() {
    const address = email.trim()
    if (!address || sending) return
    setSending(true)
    setError(null)
    try {
      const { error: authError } = await requireSupabase().auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
      })
      if (authError) throw new Error(authError.message)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link. Try again.')
    } finally {
      setSending(false)
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
        {sent ? (
          <div className="text-center">
            <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-good/15 text-good">
              <Check className="size-6" />
            </span>
            <h1 className="text-lg font-semibold">Check your email</h1>
            <p className="mt-2 leading-relaxed text-fg-muted">
              A sign-in link is on its way to{' '}
              <span className="font-medium text-fg">{email}</span>. Open it on this device and you
              are in.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-fg-faint underline transition hover:text-fg"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Sign in to sync your progress</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Your sessions, words and streak follow you between your phone and your computer.
              No password needed - we email you a link.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendLink()}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50"
            />

            {error && <p className="mt-2 text-sm text-bad">{error}</p>}

            <div className="mt-4">
              <Button onClick={sendLink} disabled={!email.trim() || sending} className="w-full">
                {sending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    Email me a sign-in link
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  )
}
