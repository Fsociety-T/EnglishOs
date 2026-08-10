import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The Android wrapper.
 *
 * Same `appId` as the Trusted Web Activity this replaces, and the same signing
 * keystore, so it installs over that app rather than sitting beside it as a
 * duplicate.
 *
 * The web files are bundled, not fetched. That is the trade this build makes:
 * the app works with no network at all, but it no longer picks up a push to
 * `main` on its own - a UI change needs a new APK. Supabase data stays live
 * either way.
 */
const config: CapacitorConfig = {
  appId: 'io.github.fsociety_t.englishos',
  appName: 'EnglishOS',
  webDir: 'dist',
  android: {
    // Everything the app talks to is HTTPS. Leaving mixed content off means a
    // plain-HTTP request fails loudly in testing instead of silently shipping.
    allowMixedContent: false,
  },
  server: {
    // Serves the bundled files from https://localhost rather than a file:// URL.
    // This is what makes the WebView a secure context, which the microphone
    // (getUserMedia) and Web Crypto both refuse to work without.
    androidScheme: 'https',
  },
}

export default config
