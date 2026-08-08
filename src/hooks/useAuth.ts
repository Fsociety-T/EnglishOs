import { useEffect, useState } from 'react'
import { cloudConfigured, supabase } from '@/services/db/supabaseClient'

export interface AuthState {
  /** Null in local mode, where there is no account at all. */
  email: string | null
  signedIn: boolean
  loading: boolean
}

export function useAuth(): AuthState {
  // In local mode there is nothing to wait for, so never start in a loading
  // state - that would flash a spinner on every page load for no reason.
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(cloudConfigured)

  useEffect(() => {
    if (!supabase) return

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setEmail(data.session?.user.email ?? null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { email, signedIn: !cloudConfigured || email !== null, loading }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
