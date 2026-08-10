# Building the Android app

The APK is a **Trusted Web Activity** (TWA): a thin Android wrapper that opens
`https://fsociety-t.github.io/EnglishOs/` using Chrome's engine, with no browser
UI around it.

It does *not* bundle the website. Pushing to `main` updates the app for everyone
already — you only rebuild the APK when the icon, name, package id, or start URL
changes.

Chrome's engine is also why speaking practice still works. The live transcript
uses the Web Speech API, which exists in Chrome but not in a plain Android
WebView, so a bundled-webview wrapper (Capacitor, Cordova) would silently lose
that feature.

## One-time setup

### 1. Add the three GitHub secrets

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
> copy is still valid base64 — it decodes into a truncated keystore and fails
> at signing with `java.io.EOFException`. The workflow now checks the keystore
> opens before building and reports the decoded byte size; the correct size is
> **2718 bytes**.

> **Back up `android.keystore` somewhere private.** It is the app's identity.
> Lose it and you can never update an installed app again — users would have to
> uninstall and reinstall. Anyone who *has* it can publish an update Android
> trusts as genuine.

### 2. Publish the Digital Asset Link

Android only drops the address bar if the site vouches for the app. The proof
file must sit at the **domain root**, not under `/EnglishOs/`:

```
https://fsociety-t.github.io/.well-known/assetlinks.json
```

GitHub Pages serves that path only from a repository named exactly
`fsociety-t.github.io`. Create it, and add `.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "io.github.fsociety_t.englishos",
      "sha256_cert_fingerprints": [
        "4A:8D:97:3C:4F:13:42:AD:C1:47:62:DF:54:A4:17:8D:52:BF:99:A4:CC:FA:4D:9B:70:49:0F:59:A7:C5:2B:26"
      ]
    }
  }
]
```

**Also add an empty `.nojekyll` file at that repository's root.** GitHub Pages
runs Jekyll, and Jekyll excludes every file and folder whose name begins with a
dot — so `.well-known/` is dropped from the published site and the URL above
returns 404 even though the file is committed. `.nojekyll` turns Jekyll off and
the folder is served as-is. Its contents do not matter, only that it exists.

Then **Settings → Pages → Build and deployment → Deploy from a branch → `main` /
`(root)` → Save**, and wait for the first build.

Check it before rebuilding anything:

```sh
curl -i https://fsociety-t.github.io/.well-known/assetlinks.json
```

`200` with `content-type: application/json` is what Android needs. Google's
validator shows what Android itself will conclude:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://fsociety-t.github.io&relation=delegate_permission/common.handle_all_urls
```

**Verification happens when the app is installed, not when it runs.** An app
installed before the file went live keeps its address bar forever. Uninstall it
and install the APK again.

The fingerprint is derived from the keystore and is not secret. If you ever
replace the keystore, this file must be updated to match, or every installed app
falls back to showing the address bar.

Skipping this step is not fatal — the app still works, it just renders with a
visible URL bar.

## Building

**Actions → Build Android APK → Run workflow.** Optionally set a version name
like `1.0.1`.

Each successful build publishes a **release** tagged `v<version name>`, with
`EnglishOS-<version>.apk` attached. That is the copy to install: it is a plain
public link that opens on the phone, and it does not expire.

Re-running with a version name that already has a release **replaces** the APK
on it rather than failing, so a bad build can be corrected without inventing a
version number.

The run page also keeps an **englishos-apk** artifact for 30 days, holding both
`app-release-signed.apk` and `app-release-bundle.aab`. The `.aab` is only needed
for the Play Store, which is why it is not attached to the release.

`versionCode` is set from the workflow run number, so every build can install
over the previous one. Android rejects an update whose `versionCode` is not
higher than the installed one.

Because the repository is public, so is the release. Anyone with the link can
download the APK.

## Installing on a phone

Open the release on the phone, download the `.apk`, and tap it. Android will ask
you to allow installing from unknown sources — expected for an app not from the
Play Store.

## Changing the app

Edit `twa-manifest.json` and re-run the workflow. Do not edit `appVersionCode`
by hand; the workflow overwrites it.

Changing `packageId` creates a *different* app: it installs alongside the old
one instead of updating it, and needs a new `assetlinks.json` entry.
