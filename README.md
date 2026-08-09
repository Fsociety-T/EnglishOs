# EnglishOS

One place to practice a language instead of five scattered tools.
**English and French**, chosen when you sign up and switchable in Settings.

Write or speak about a topic, get corrected, and turn your own mistakes into the
exact grammar lessons you need. Save the words you like, keep a shelf of podcasts
to watch later, and watch your weak areas get stronger over time.

**The loop:** practice → get corrected → get a lesson built from your errors → track it.

## Features

| Area | What it does |
| --- | --- |
| **Writing** | Pick a topic, write, and get every mistake highlighted and explained. |
| **Speaking** | Record yourself. Live transcript, fluency metrics (words per minute, filler words, pauses), and the same corrections. |
| **Lessons** | Your corrections are grouped by error type and turned into short lessons with a mini-quiz. |
| **Vocabulary** | A word notebook with Leitner spaced repetition (1 / 3 / 7 / 21 / 60 days) and flashcards. |
| **Podcasts** | Paste a YouTube or Spotify link, watch it in-app, and take timestamped notes. Any word goes straight to the notebook. |
| **Progress** | Streaks, daily goal, activity heatmap, score trends, and a breakdown of which grammar areas are improving. |
| **Two languages** | English and French. Not a translated shell: each has its own interface text, grammar rules, lessons, practice topics and vocabulary. French adds gender agreement and accents as error types, which English does not have. |

Your history is filed per language, so switching to French shows your French
sessions and lessons only — the two never mix.

Built as a PWA, so the finished website installs as a real app on phone and desktop.

## How this project is built (unusual, on purpose)

**Nothing is installed on the developer's machine.** There is no `node_modules`
directory here and no local dev server. The repository holds source code only —
a few hundred kilobytes.

All installing and building happens in the cloud:

1. Push to `main`
2. GitHub Actions runs `npm ci && npm run build` on its own runner
3. The built site is published to GitHub Pages

The build script is `tsc --noEmit && vite build`, so **any type error fails the
deploy**. With no local preview, that type check is the main safety net.

`package-lock.json` is generated with `npm install --package-lock-only`, which
resolves the whole dependency tree and writes the lockfile *without downloading
any packages*.

## Setup

One-time, in the GitHub repository:

1. **Settings → Pages → Source → GitHub Actions**
2. Later, for cloud sync (Phase 10), add two repository secrets under
   **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Without those secrets the app still builds and runs in **demo mode**, storing
data in the browser's `localStorage` with no account required.

3. Run `supabase/schema.sql` in the Supabase SQL editor. It is safe to re-run,
   and re-running is what adds the `language` columns to a project created
   before the French version existed. Accounts from before that point stay on
   English with their history intact.

## Running locally (optional)

Only if you have ~500 MB of free disk space. It is much faster to iterate this way.

```bash
npm install
npm run dev
```

## Stack

React 19 · Vite 8 · TypeScript 5.9 · Tailwind CSS 4 (CSS-first `@theme`) ·
React Router 7 (`HashRouter`) · Supabase · Web Speech API

## Build phases

- [x] **0** — Repo skeleton, CI pipeline, live URL
- [ ] **1** — Design system, app shell, routing, service interfaces
- [ ] **2** — Writing practice + correction view
- [ ] **3** — Speaking practice
- [ ] **4** — Grammar lessons from your errors
- [ ] **5** — Vocabulary notebook + SRS flashcards
- [ ] **6** — Podcast library + timestamped notes
- [ ] **7** — Dashboard + progress tracking
- [ ] **8** — Polish + PWA install
- [ ] **9** — Supabase cloud sync
- [ ] **10** — Real Claude AI corrections
