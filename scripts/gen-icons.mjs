/**
 * Generates PNG icons for PWA from the source SVG.
 *
 * Outputs:
 *   public/icon-192.png   — standard icon (any purpose)
 *   public/icon-512.png   — standard icon (any purpose)
 *   public/icon-192-maskable.png  — maskable icon with ~12% safe-zone padding
 *   public/icon-512-maskable.png  — maskable icon with ~12% safe-zone padding
 *   public/apple-touch-icon.png   — 180×180, no rounded corners (iOS adds them)
 */

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = resolve(__dirname, '..')
const srcSvg    = readFileSync(resolve(root, 'public/icon.svg'))

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Render SVG at given canvas size, icon drawn at iconSize centred */
async function renderIcon(canvasSize, iconSize, outputPath) {
  const pad = (canvasSize - iconSize) / 2

  // Resize SVG content to iconSize
  const resized = await sharp(srcSvg)
    .resize(iconSize, iconSize)
    .toBuffer()

  // Composite onto a #0d0d0d background of canvasSize
  await sharp({
    create: {
      width:      canvasSize,
      height:     canvasSize,
      channels:   4,
      background: { r: 13, g: 13, b: 13, alpha: 1 },
    },
  })
    .composite([{ input: resized, left: Math.round(pad), top: Math.round(pad) }])
    .png()
    .toFile(outputPath)

  console.log(`✓ ${outputPath}`)
}

// ── Standard icons (purpose: any) ────────────────────────────────────────────
await renderIcon(192, 192, resolve(root, 'public/icon-192.png'))
await renderIcon(512, 512, resolve(root, 'public/icon-512.png'))

// ── Maskable icons — 12 % padding so content stays in the safe zone ──────────
await renderIcon(192, Math.round(192 * 0.76), resolve(root, 'public/icon-192-maskable.png'))
await renderIcon(512, Math.round(512 * 0.76), resolve(root, 'public/icon-512-maskable.png'))

// ── Apple touch icon — 180×180, full bleed ───────────────────────────────────
await renderIcon(180, 180, resolve(root, 'public/apple-touch-icon.png'))

console.log('All icons generated.')
