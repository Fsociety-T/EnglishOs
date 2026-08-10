import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The Android app serves these same files from https://localhost/ inside its
// own WebView, so it needs a root base - and no service worker, because the
// APK already carries every file and a cache layered on top of that can only
// ever hand back something staler than what is already on disk.
const NATIVE = process.env.CAPACITOR === '1'

// Served from https://<user>.github.io/EnglishOs/, not a domain root, so every
// path below has to carry the repository name.
const BASE = NATIVE ? '/' : '/EnglishOs/'

const pwa = VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  includeAssets: ['apple-touch-icon.png'],
  manifest: {
    name: 'EnglishOS - practice and track your English',
    short_name: 'EnglishOS',
    description:
      'Practice writing and speaking English, get corrected, and turn your own mistakes into grammar lessons.',
    theme_color: '#0a0a0f',
    background_color: '#0a0a0f',
    display: 'standalone',
    scope: BASE,
    start_url: BASE,
    icons: [
      { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: 'pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
    navigateFallback: `${BASE}index.html`,
    runtimeCaching: [
      {
        // Fonts come from Google, so they need their own cache to survive offline.
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // YouTube thumbnails on the podcast shelf.
        urlPattern: /^https:\/\/i\.ytimg\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'thumbnails',
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), ...(NATIVE ? [] : [pwa])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
