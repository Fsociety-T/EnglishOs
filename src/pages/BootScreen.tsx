const PILLARS = [
  {
    title: 'Writing practice',
    body: 'Pick a topic, write freely, and get every mistake explained line by line.',
  },
  {
    title: 'Speaking practice',
    body: 'Record yourself talking. Get a transcript, a fluency score, and corrections.',
  },
  {
    title: 'Lessons from your errors',
    body: 'Every mistake you make becomes a short grammar lesson built just for you.',
  },
  {
    title: 'Word notebook',
    body: 'Save words you like and review them with spaced repetition so they stick.',
  },
  {
    title: 'Podcast shelf',
    body: 'Save podcasts to watch later and take notes with timestamps while you listen.',
  },
  {
    title: 'Progress tracking',
    body: 'Streaks, charts, and a heatmap that show your weak areas getting stronger.',
  },
] as const

export default function BootScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-16">
      <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-fg-muted">
        <span className="size-1.5 rounded-full bg-good" />
        Phase 0 deployed &middot; build pipeline is live
      </span>

      <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
        <span className="text-gradient">English</span>
        <span className="text-fg">OS</span>
      </h1>

      <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
        One place to practice English. Write or speak about a topic, get corrected,
        and turn your own mistakes into the exact lessons you need.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-glass glass p-5 transition-colors hover:bg-white/10"
          >
            <h2 className="text-sm font-semibold text-fg">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-faint">{pillar.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-sm text-fg-faint">
        Screens arrive in the next phase. Nothing here is installed on your computer &mdash;
        this site is built in the cloud on every push.
      </p>
    </main>
  )
}
