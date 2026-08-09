import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { repo } from '@/services/db'
import { DEFAULT_PROFILE } from '@/types'
import type { LearningLanguage } from '@/types'
import { STRINGS } from './strings'
import type { StringKey } from './strings'

/**
 * The interface language is the profile's learning language: someone studying
 * French reads the app in French. It is cached in localStorage so the very
 * first paint is already correct - waiting for the profile round-trip would
 * show a flash of English to every French learner on every load.
 */
const CACHE_KEY = 'englishos.language'

function readCache(): LearningLanguage {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached === 'en' || cached === 'fr') return cached
  } catch {
    // Private browsing can throw on access. The default is a fine answer.
  }
  return DEFAULT_PROFILE.language
}

function writeCache(language: LearningLanguage): void {
  try {
    localStorage.setItem(CACHE_KEY, language)
  } catch {
    // Not being able to cache only costs a flash on the next load.
  }
}

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string

interface LanguageContextValue {
  language: LearningLanguage
  t: Translate
  /**
   * Switch the interface without writing to the profile. The sign-up screen
   * needs this: there is no account to save against yet, but the form should
   * still answer in the language just picked.
   */
  previewLanguage: (language: LearningLanguage) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/**
 * Substitutes {name} placeholders. Kept deliberately small - the app needs
 * interpolation, not a plural engine, and counts that need real plural rules
 * are phrased to avoid them.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  )
}

/**
 * Translate outside React, using the cached language.
 *
 * The error boundary needs this: it wraps the provider, so it renders when no
 * context exists - and a crash screen in the wrong language is exactly when a
 * learner is least able to cope with one.
 */
export function translateStatic(
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  const language = readCache()
  return interpolate(STRINGS[language][key] ?? STRINGS.en[key] ?? key, vars)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LearningLanguage>(readCache)

  // Reconcile the cache with the stored profile once, on mount. The cache is
  // only a first-paint guess; the profile is the truth.
  useEffect(() => {
    let active = true
    repo
      .getProfile()
      .then((profile) => {
        if (!active) return
        setLanguageState(profile.language)
        writeCache(profile.language)
      })
      .catch(() => {
        // An unreachable profile is handled by the screens that need it.
      })
    return () => {
      active = false
    }
  }, [])

  const previewLanguage = useCallback((next: LearningLanguage) => {
    setLanguageState(next)
    writeCache(next)
  }, [])

  // There is deliberately no setLanguage. The learning language is chosen once
  // at sign-up and fixed after that: it decides which lessons, topics, grammar
  // rules and history a learner sees, so switching it mid-account would empty
  // every screen at once rather than translate them.

  const t = useCallback<Translate>(
    (key, vars) => interpolate(STRINGS[language][key] ?? STRINGS.en[key] ?? key, vars),
    [language],
  )

  const value = useMemo(
    () => ({ language, t, previewLanguage }),
    [language, t, previewLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside a LanguageProvider')
  return context
}

/** Shorthand for the common case of only needing the translate function. */
export function useT(): Translate {
  return useLanguage().t
}

export type { StringKey }
