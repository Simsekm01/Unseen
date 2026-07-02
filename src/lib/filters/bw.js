import { dateStamp } from '../../config.js'

function sCurve(v) {
  const x = v / 255
  const c = x < 0.5
    ? 2 * x * x
    : 1 - 2 * (1 - x) * (1 - x)
  return Math.max(0, Math.min(255, c * 255))
}

function buildLUT() {
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) {
    const lum = i
    lut[i] = sCurve(lum)
  }
  return lut
}

const LUT = buildLUT()

export async function applyBW(srcCanvas, opts = {}) {
  const {
    stamp = true,
    grain = 0.14,
    quality = 0.92,
  } = opts

  const w = srcCanvas.width
  const h = srcCanvas.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(srcCanvas, 0, 0, w, h)

  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    const val = LUT[Math.round(lum)]
    d[i] = val
    d[i + 1] = val
    d[i + 2] = val
  }
  ctx.putImageData(img, 0, 0)

  // Harte Vignette
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.28,
    w / 2, h / 2, Math.max(w, h) * 0.72,
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

  // Filmkorn
  if (grain > 0) {
    const gi = ctx.getImageData(0, 0, w, h)
    const gd = gi.data
    for (let i = 0; i < gd.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * grain
      gd[i] += n
      gd[i + 1] += n
      gd[i + 2] += n
    }
    ctx.putImageData(gi, 0, 0)
  }

  // Datumsstempel in Weiss
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
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = size * 0.3
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
}

export function applyLiveBW(ctx, w, h) {
  ctx.save()
  ctx.filter = 'grayscale(1) contrast(1.1)'
  ctx.drawImage(ctx.canvas, 0, 0)
  ctx.restore()

  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.28,
    w / 2, h / 2, Math.max(w, h) * 0.72,
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.40)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}
