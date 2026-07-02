<<<<<<< HEAD
// vintage.js — warmer Film-Look + eingebrannter, dezenter Datumsstempel.
// Input: HTMLCanvasElement (roher Frame). Output: Promise<Blob> (jpeg).

import { EVENT, dateStamp } from '../config.js'
=======
import { DEFAULTS, dateStamp } from '../config.js'
>>>>>>> cef553901371bf220774623f8c092096541acc20

function curve(v, lift, gain) {
  let x = v / 255
  x = lift + x * (1 - lift)
  x = Math.pow(x, gain)
  return Math.max(0, Math.min(255, x * 255))
}
function buildLUT(lift, gain) {
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) lut[i] = curve(i, lift, gain)
  return lut
}
const LUT = buildLUT(0.05, 0.94)

export async function applyVintage(srcCanvas, opts = {}) {
  const {
    stamp = true,
    grain = 0.07,
    leak = true,
<<<<<<< HEAD
    quality = EVENT.jpegQuality,
=======
    quality = DEFAULTS.jpegQuality,
>>>>>>> cef553901371bf220774623f8c092096541acc20
  } = opts

  const w = srcCanvas.width
  const h = srcCanvas.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(srcCanvas, 0, 0, w, h)

<<<<<<< HEAD
  // Tonkurve + Warmth + dezentes Split-Toning + leichte Entsaettigung
=======
>>>>>>> cef553901371bf220774623f8c092096541acc20
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    let r = LUT[d[i]], g = LUT[d[i + 1]], b = LUT[d[i + 2]]
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const shadow = 1 - lum
    r += 12; b -= 10
    r += shadow * -4 + lum * 8
    g += shadow * 5 + lum * 3
    b += shadow * 7 - lum * 6
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    const sat = 0.9
    r = gray + (r - gray) * sat
    g = gray + (g - gray) * sat
    b = gray + (b - gray) * sat
    d[i] = r; d[i + 1] = g; d[i + 2] = b
  }
  ctx.putImageData(img, 0, 0)

  // Vignette
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.34,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(40,26,8,0.34)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

<<<<<<< HEAD
  // dezenter Light-Leak
=======
  // Light-Leak
>>>>>>> cef553901371bf220774623f8c092096541acc20
  if (leak) {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    const side = Math.random() > 0.5 ? w : 0
    const lg = ctx.createLinearGradient(side, 0, side === 0 ? w * 0.4 : w * 0.6, h)
    lg.addColorStop(0, 'rgba(220,150,70,0.12)')
    lg.addColorStop(0.4, 'rgba(200,120,50,0.04)')
    lg.addColorStop(1, 'rgba(200,120,50,0)')
    ctx.fillStyle = lg
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }

<<<<<<< HEAD
  // warmer Gesamt-Tint
=======
  // Gesamt-Tint
>>>>>>> cef553901371bf220774623f8c092096541acc20
  ctx.save()
  ctx.globalCompositeOperation = 'soft-light'
  ctx.fillStyle = 'rgba(210,160,90,0.10)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Filmkorn
  if (grain > 0) {
    const gi = ctx.getImageData(0, 0, w, h)
    const gd = gi.data
    for (let i = 0; i < gd.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * grain
      gd[i] += n; gd[i + 1] += n; gd[i + 2] += n
    }
    ctx.putImageData(gi, 0, 0)
  }

<<<<<<< HEAD
  // Datumsstempel — elegant, warmes Creme, kursive Serife
=======
  // Datumsstempel
>>>>>>> cef553901371bf220774623f8c092096541acc20
  if (stamp) {
    try { if (document.fonts?.ready) await document.fonts.ready } catch {}
    const text = dateStamp()
    const size = Math.round(h * 0.04)
    ctx.save()
    ctx.font = `italic 600 ${size}px 'Cormorant Garamond', serif`
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'right'
    const x = w - size
    const y = h - size * 0.9
    ctx.shadowColor = 'rgba(40,26,8,0.55)'
    ctx.shadowBlur = size * 0.25
    ctx.fillStyle = 'rgba(244,236,220,0.92)'
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
}
<<<<<<< HEAD
=======

export function applyLiveVintage(ctx, w, h) {
  ctx.save()
  ctx.globalCompositeOperation = 'soft-light'
  ctx.fillStyle = 'rgba(210,155,80,0.18)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  ctx.save()
  ctx.globalCompositeOperation = 'saturation'
  ctx.fillStyle = 'rgba(128,128,128,0.12)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.34,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(40,26,8,0.30)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}
>>>>>>> cef553901371bf220774623f8c092096541acc20
