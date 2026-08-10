/**
 * Draws the Android launcher icon and splash screen.
 *
 * The PWA icons in `public/` stop at 512px and `capacitor-assets` wants 1024,
 * so rather than upscale a bitmap and ship a soft letterform, the mark is
 * redrawn here from the same shapes at whatever size is asked for.
 *
 *   npx tsx scripts/make-android-assets.mts
 *   npx capacitor-assets generate --android
 *
 * The second command is what writes into `android/`. This one only fills
 * `assets/`, which is its input.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const VIOLET = '#8b5cf6'
const CYAN = '#22d3ee'
const INK = '#0a0a0f'

/**
 * The E, as five rectangles on a 1024 grid - the same blocky mark as the PWA
 * icon, which was drawn at 512 and is doubled here.
 */
function letterE(fill: string): string {
  return `
    <rect x="200" y="64"  width="176" height="896" fill="${fill}"/>
    <rect x="200" y="64"  width="630" height="176" fill="${fill}"/>
    <rect x="200" y="424" width="530" height="176" fill="${fill}"/>
    <rect x="200" y="784" width="630" height="176" fill="${fill}"/>
  `
}

const gradient = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${VIOLET}"/>
      <stop offset="1" stop-color="${CYAN}"/>
    </linearGradient>
  </defs>
`

/** Full-bleed: Android rounds the corners itself, and rounding twice looks wrong. */
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${gradient}
  <rect width="1024" height="1024" fill="url(#g)"/>
  ${letterE(INK)}
</svg>`

/**
 * Adaptive icons are two layers, and the launcher crops them to a circle, a
 * squircle or a rounded square depending on the phone. Only the middle ~66%
 * is guaranteed to survive, so the mark is scaled to 62% and centred.
 */
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(195 195) scale(0.62)">
    ${letterE(INK)}
  </g>
</svg>`

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${gradient}
  <rect width="1024" height="1024" fill="url(#g)"/>
</svg>`

/**
 * The splash fills the whole screen at every aspect ratio, so the mark sits
 * small and centred on the app's own background - anything larger gets cropped
 * on a tall phone.
 */
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  ${gradient}
  <rect width="2732" height="2732" fill="${INK}"/>
  <g transform="translate(1024 1024) scale(0.66)">
    <rect width="1024" height="1024" rx="180" fill="url(#g)"/>
    ${letterE(INK)}
  </g>
</svg>`

const files: [string, string][] = [
  ['assets/icon.png', icon],
  ['assets/icon-foreground.png', foreground],
  ['assets/icon-background.png', background],
  ['assets/splash.png', splash],
  // The generator wants both, and the app is dark either way.
  ['assets/splash-dark.png', splash],
]

await mkdir('assets', { recursive: true })
for (const [path, svg] of files) {
  await sharp(Buffer.from(svg)).png().toFile(path)
  console.log(`wrote ${path}`)
}
