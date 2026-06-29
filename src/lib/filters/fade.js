import { dateStamp } from '../../config.js'

function curve(v, lift) {
  const x = v / 255
  return Math.max(0, Math.min(255, (lift + x * (1 - lift)) * 255))
}

function buildLUT(lift) {
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) lut[i] = curve(i, lift)
  return lut
}

const LUT = buildLUT(0.18)

export async function applyFade(srcCanvas, opts = {}) {
  const {
    stamp = true,
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
    let r = LUT[d[i]], g = LUT[d[i + 1]], b = LUT[d[i + 2]]

    // Entsaettigung auf ~70%
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    const sat = 0.7
    r = gray + (r - gray) * sat
    g = gray + (g - gray) * sat
    b = gray + (b - gray) * sat

    // Warmer Hauch in den Lichtern
    const lum = gray / 255
    if (lum > 0.5) {
      const t = (lum - 0.5) * 2
      r += t * 4
      g += t * 6
      b -= t * 3
    }

    d[i] = Math.max(0, Math.min(255, r))
    d[i + 1] = Math.max(0, Math.min(255, g))
    d[i + 2] = Math.max(0, Math.min(255, b))
  }
  ctx.putImageData(img, 0, 0)

  // Datumsstempel in zartem Beige
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
    ctx.shadowColor = 'rgba(80,60,30,0.4)'
    ctx.shadowBlur = size * 0.2
    ctx.fillStyle = 'rgba(230,220,195,0.85)'
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
}

export function applyLiveFade(ctx, w, h) {
  // Lifted blacks
  ctx.save()
  ctx.globalCompositeOperation = 'lighten'
  ctx.fillStyle = 'rgba(46,42,38,1)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Entsaettigung
  ctx.save()
  ctx.globalCompositeOperation = 'saturation'
  ctx.fillStyle = 'rgba(128,128,128,0.30)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Warmer Hauch
  ctx.save()
  ctx.globalCompositeOperation = 'soft-light'
  ctx.fillStyle = 'rgba(200,190,140,0.12)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}
