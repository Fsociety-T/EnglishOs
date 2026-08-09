import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Cloud, Cpu, Download, HardDrive, LogOut, Upload } from 'lucide-react'
import { Badge, Button, Card, SectionHeading, Spinner } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { signOut, useAuth } from '@/hooks/useAuth'
import { ai } from '@/services/ai'
import { useRepo } from '@/services/db'
import { CEFR_LEVELS } from '@/types'
import type { CefrLevel } from '@/types'
import { cn } from '@/lib/utils'

const LEVEL_HINT: Record<CefrLevel, string> = {
  A1: 'Beginner - simple words and phrases',
  A2: 'Elementary - everyday basics',
  B1: 'Intermediate - can handle most daily situations',
  B2: 'Upper intermediate - comfortable and fairly fluent',
  C1: 'Advanced - fluent and precise',
  C2: 'Near-native',
}

export default function Settings() {
  const repo = useRepo()
  const { email } = useAuth()
  const { data: profile, loading, reload } = useAsync(() => repo.getProfile(), [])

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
      displayName: name.trim() || 'Learner',
      level,
      dailyGoalMinutes: Math.max(5, Math.min(180, goal)),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
      setImportError('That file could not be read. Make sure it is an EnglishOS backup.')
    }
  }

  if (loading) return <Spinner label="Loading settings..." />

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
      </header>

      <Card>
        <SectionHeading title="About you" />
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-fg-muted">
              What should the app call you?
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Learner"
              className={inputClass}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-fg-muted">Your English level</span>
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
            <p className="mt-2 text-sm text-fg-faint">{LEVEL_HINT[level]}</p>
          </div>

          <div>
            <label htmlFor="goal" className="mb-1.5 block text-sm text-fg-muted">
              Daily goal: <span className="font-semibold text-fg">{goal} minutes</span>
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
            <p className="mt-1 text-sm text-fg-faint">
              Small and daily beats long and rare. Fifteen minutes is a good start.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save}>Save changes</Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-good">
              <Check className="size-4" />
              Saved
            </span>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeading title="How the app is set up" />
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet-soft">
              <Cpu className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                Corrections
                <Badge tone={ai.isReal ? 'good' : 'warn'}>{ai.name}</Badge>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-fg-faint">
                {ai.isReal
                  ? 'Your writing and speaking are reviewed by the full AI.'
                  : 'The offline engine reliably catches common mistakes, but it is not the full AI. Real AI review is the last step of the build.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan-soft">
              {repo.isCloud ? <Cloud className="size-4" /> : <HardDrive className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                Your data
                <Badge tone={repo.isCloud ? 'good' : 'neutral'}>{repo.name}</Badge>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-fg-faint">
                {repo.isCloud
                  ? `Signed in as ${email ?? 'your account'}. Everything syncs between your devices automatically.`
                  : 'Everything is saved in this browser on this device. Export a backup below before clearing your browser data, or to move to another computer.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {repo.isCloud && (
        <Card>
          <SectionHeading title="Account" subtitle={email ?? undefined} />
          <p className="text-sm leading-relaxed text-fg-muted">
            Signing out leaves your data safe in the cloud. Sign back in on any device to pick up
            where you left off.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <SectionHeading
          title="Backup"
          subtitle="Your sessions, lessons, words, podcasts and streak, as one file."
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="size-4" />
            Export my data
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Import a backup
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
          Importing replaces everything currently saved. Export first if you are not sure.
        </p>
      </Card>

      <Card className="border-bad/30">
        <SectionHeading title="Start over" />
        <p className="text-sm leading-relaxed text-fg-muted">
          Deletes every session, lesson, word, podcast and streak on this device. This cannot be
          undone.
        </p>
        <div className="mt-4">
          {!confirmReset ? (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              <AlertTriangle className="size-4" />
              Delete all my data
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
                Yes, delete everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
