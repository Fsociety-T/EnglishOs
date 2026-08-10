# Building the Android app

The APK is a **Capacitor** app: the website is built, bundled inside the APK,
and shown in the app's own WebView. It has no address bar, no tabs, and nothing
that looks like a browser.

## Why not a Trusted Web Activity

A TWA is the better wrapper on paper — it uses Chrome's engine and it does not
bundle anything, so a push to `main` updates every installed app for free.

It has one condition. Android hides the address bar only if the website vouches
for the app, by serving a Digital Asset Link at the **domain root**:

```
https://fsociety-t.github.io/.well-known/assetlinks.json
```

GitHub Pages serves that path only from a repository named exactly
`fsociety-t.github.io`, which does not exist, so the file 404s and every install
shows the address bar. Capacitor was chosen instead because it needs nothing
from the website at all.

**The cost of that choice, stated plainly: the app no longer updates itself.**
Pushing to `main` updates the website, not the phone. A UI change reaches the
app only in the next APK. Supabase data — sessions, words, lessons — is live
either way, because that is fetched at runtime.

If the user site repository is ever created, the TWA build is worth going back
to. It is in the git history at `da89e4f`.

## Speaking practice

An Android WebView has **no Web Speech API** — that is a Chrome feature, and
this app is not Chrome. Speaking practice would have lost its live transcript.

`src/hooks/useSpeechRecognition.ts` therefore picks its engine once at load:
the browser's `SpeechRecognition` on the web, and Android's own recogniser
through `@capacitor-community/speech-recognition` in the app
(`src/hooks/useNativeSpeech.ts`). Speaking practice never learns which answered.

The two behave differently in ways that hook has to absorb: Android reports the
whole utterance in every partial result rather than the new words, and it stops
listening by itself at the end of each utterance instead of running
continuously.

## One-time setup

### Signing secrets

Three gitignored files in the repository root hold the values, one value per
file so a copy cannot pick up a stray label. Never commit them or paste them
into a chat.

Go to **Settings → Secrets and variables → Actions → New repository secret** and
add all three:

| Secret | Copy the entire contents of |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `android.keystore.base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | `android.keystore.password.txt` |
| `ANDROID_KEY_PASSWORD` | `android.keystore.password.txt` (same value) |

> **The base64 is a single 3624-character line.** Open the file, select all
> (`Ctrl+A`), copy. Selecting by dragging tends to stop short, and a partial
> copy is still valid base64 — it decodes into a truncated keystore. The
> workflow reports the decoded byte size; the correct size is **2718 bytes**.

> **Back up `android.keystore` somewhere private.** It is the app's identity.
> Lose it and you can never update an installed app again — users would have to
> uninstall and reinstall. Anyone who *has* it can publish an update Android
> trusts as genuine.

### Supabase secrets

The same two the website build uses, and for the same reason — they are baked
into the bundle at build time:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without them the APK ships permanently stuck in offline demo mode with no way
to sign in, so the workflow checks the built bundle and fails rather than
release one.

## Building

**Actions → Build Android APK → Run workflow.** Set a version name like `1.0.1`.

Each successful build publishes a **release** tagged `v<version name>` with
`EnglishOS-<version>.apk` attached. That is the copy to install: a plain public
link that opens on the phone and does not expire. Re-running with a version name
that already has a release replaces the APK on it rather than failing.

`versionCode` comes from the workflow run number, so every build installs over
the previous one. Android rejects an update whose `versionCode` is not higher
than the installed one.

Because the repository is public, so is the release. Anyone with the link can
download the APK. The signing key stays secret; only the built app is public.

### What the workflow checks before it releases

- the keystore decodes to a working file, before Gradle is started
- Supabase credentials actually reached the bundle
- the finished APK is signed by the expected key, matching `EXPECTED_SHA256` in
  the workflow — an unsigned or debug-signed APK installs once and then refuses
  every later update, which is a miserable thing to discover months on

## Installing on a phone

Open the release on the phone, download the `.apk`, and tap it. Android will ask
you to allow installing from unknown sources — expected for an app not from the
Play Store.

Because the package id and signing key are unchanged from the old TWA build,
this installs **over** that app rather than beside it.

## Changing the app

| To change | Edit |
|---|---|
| Icon and splash | `scripts/make-android-assets.mts`, then regenerate (below) |
| App name | `android/app/src/main/res/values/strings.xml` |
| Package id | `capacitor.config.ts` **and** `android/app/build.gradle` |

Regenerating the icons:

```sh
npx tsx scripts/make-android-assets.mts   # draws assets/ at 1024 and 2732
npx capacitor-assets generate --android   # writes them into android/res
```

Changing `packageId` creates a *different* app: it installs alongside the old
one instead of updating it.

## Working on it locally

```sh
npm ci
CAPACITOR=1 npm run build   # base / and no service worker
npx cap sync android        # copy dist into the Android project
```

`android/` is committed on purpose — Capacitor treats it as source you are meant
to edit, and the signing config lives in it. Everything Gradle produces is
ignored.

Building the APK itself needs a JDK and the Android SDK, which the Codespace
does not have. That is what the workflow is for.

## Known limits

- No auto-update, as above.
- Google Fonts are still fetched from the network, so the very first launch on a
  phone with no connection falls back to system fonts.
- No `.aab`, so no Play Store submission without adding one.
