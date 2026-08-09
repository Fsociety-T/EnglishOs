import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Cloud,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  LogOut,
  Upload,
} from 'lucide-react'
import { Badge, Button, Card, SectionHeading, Spinner } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useSessions } from '@/hooks/useContent'
import { signOut, useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/i18n'
import { ai } from '@/services/ai'
import { useRepo } from '@/services/db'
import { CEFR_LEVELS, DEFAULT_PROFILE, LANGUAGE_NAME, LEARNING_LANGUAGES } from '@/types'
import type { CefrLevel, LearningLanguage } from '@/types'
import { cn } from '@/lib/utils'

export default function Settings() {
  const repo = useRepo()
  const { email } = useAuth()
  const { language, t, setLanguage } = useLanguage()
  const { data: profile, loading, reload } = useAsync(() => repo.getProfile(), [])
  const { data: sessions } = useSessions()

  const [name, setName] = useState('')
  const [level, setLevel] = useState<CefrLevel>('B1')
  const [goal, setGoal] = useState(20)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.displayName)
    setLevel(profile.level)
    setGoal(profile.dailyGoalMinutes)
  }, [profile])

  async function save() {
    await repo.saveProfile({
      // Spread the loaded profile first: this form does not own every field.
      // Rebuilding the profile from the inputs alone would silently erase the
      // measured writing and speaking levels every time someone renamed
      // themselves.
      ...(profile ?? DEFAULT_PROFILE),
      displayName: name.trim() || t('settings.namePlaceholder'),
      language,
      level,
      dailyGoalMinutes: Math.max(5, Math.min(180, goal)),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    reload()
  }

  /**
   * Switching language rewrites every screen, so it is saved immediately
   * rather than waiting for "Save changes" - a half-switched app where the
   * menu is French and the lessons are English would just look broken.
   */
  async function changeLanguage(next: LearningLanguage) {
    if (next === language) return
    await setLanguage(next)
    reload()
  }

  async function handleSignOut() {
    await signOut()
    // A full reload clears every screen's cached data along with the session.
    window.location.reload()
  }

  async function exportData() {
    const json = await repo.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `englishos-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    setImportError(null)
    try {
      await repo.importAll(await file.text())
      reload()
      // A full reload is the honest way to refresh every screen's cached data.
      window.location.reload()
    } catch {
      setImportError(t('settings.importError'))
    }
  }

  if (loading) return <Spinner label={t('settings.loading')} />

  // Sessions arrive newest first, so the first placement in the list is the
  // most recent measurement.
  const lastPlacement = (sessions ?? []).find((session) => session.isPlacement)

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('settings.title')}</h1>
      </header>

      <Card>
        <SectionHeading title={t('settings.aboutYou')} />
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-fg-muted">
              {t('settings.nameLabel')}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.namePlaceholder')}
              className={inputClass}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-fg-muted">
              {t('settings.languageLabel')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {LEARNING_LANGUAGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => void changeLanguage(option)}
                  aria-pressed={language === option}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                    language === option
                      ? 'border-violet/40 bg-violet/15 text-fg'
                      : 'border-white/10 bg-white/5 text-fg-muted hover:bg-white/10',
                  )}
                >
                  {LANGUAGE_NAME[option]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-fg-faint">{t('settings.languageHint')}</p>
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-fg-muted">
              {t('settings.levelLabel', { language: LANGUAGE_NAME[language] })}
            </span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CEFR_LEVELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLevel(option)}
                  className={cn(
                    'rounded-xl border px-2 py-2.5 text-sm font-semibold transition',
                    level === option
                      ? 'border-violet/40 bg-violet/15 text-fg'
                      : 'border-white/10 bg-white/5 text-fg-muted hover:bg-white/10',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-fg-faint">{t(`level.${level}`)}</p>
          </div>

          <div>
            <label htmlFor="goal" className="mb-1.5 block text-sm text-fg-muted">
              {t('settings.goalLabel')}{' '}
              <span className="font-semibold text-fg">
                {goal} {t('common.minutes')}
              </span>
            </label>
            <input
              id="goal"
              type="range"
              min={5}
              max={120}
              step={5}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full accent-violet"
            />
            <p className="mt-1 text-sm text-fg-faint">{t('settings.goalHint')}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save}>{t('common.save')}</Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-good">
              <Check className="size-4" />
              {t('common.saved')}
            </span>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeading
          title={t('settings.measuredLevel')}
          subtitle={t('settings.measuredBlurb')}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet-soft">
              <Gauge className="size-4" />
            </span>
            <div className="min-w-0 text-sm leading-relaxed">
              <p className="text-fg">
                {profile?.writingLevel
                  ? lastPlacement
                    ? t('settings.measuredWriting', {
                        level: profile.writingLevel,
                        date: new Date(lastPlacement.createdAt).toLocaleDateString(),
                      })
                    : t('settings.measuredWritingNoDate', { level: profile.writingLevel })
                  : t('settings.measuredNever')}
              </p>
              <p className="mt-1 text-fg-faint">{t('settings.measuredSpeakingSoon')}</p>
            </div>
          </div>
          <Link to="/level">
            <Button variant="outline">{t('settings.checkLevel')}</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <SectionHeading title={t('settings.setup')} />
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet-soft">
              <Cpu className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                {t('settings.corrections')}
                <Badge tone={ai.isReal ? 'good' : 'warn'}>{ai.name}</Badge>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-fg-faint">
                {ai.isReal ? t('settings.correctionsReal') : t('settings.correctionsMock')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan-soft">
              {repo.isCloud ? <Cloud className="size-4" /> : <HardDrive className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                {t('settings.yourData')}
                <Badge tone={repo.isCloud ? 'good' : 'neutral'}>{repo.name}</Badge>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-fg-faint">
                {repo.isCloud
                  ? t('settings.dataCloud', { email: email ?? '' })
                  : t('settings.dataLocal')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {repo.isCloud && (
        <Card>
          <SectionHeading title={t('settings.account')} subtitle={email ?? undefined} />
          <p className="text-sm leading-relaxed text-fg-muted">{t('settings.signOutBlurb')}</p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="size-4" />
              {t('settings.signOut')}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <SectionHeading
          title={t('settings.backup')}
          subtitle={t('settings.backupSubtitle')}
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="size-4" />
            {t('settings.export')}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            {t('settings.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importData(file)
              e.target.value = ''
            }}
          />
        </div>
        {importError && <p className="mt-3 text-sm text-bad">{importError}</p>}
        <p className="mt-3 text-sm text-fg-faint">
          {t('settings.importWarning')}
        </p>
      </Card>

      <Card className="border-bad/30">
        <SectionHeading title={t('settings.reset')} />
        <p className="text-sm leading-relaxed text-fg-muted">{t('settings.resetBlurb')}</p>
        <div className="mt-4">
          {!confirmReset ? (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              <AlertTriangle className="size-4" />
              {t('settings.resetButton')}
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="danger"
                onClick={async () => {
                  await repo.clearAll()
                  window.location.reload()
                }}
              >
                {t('settings.resetConfirm')}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
