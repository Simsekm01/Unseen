// useCamera.js — Kamera starten/stoppen, Frame als Canvas abgreifen.
import { ref, onBeforeUnmount } from 'vue'
import { DEFAULTS } from '../config.js'

export function useCamera() {
  const videoRef = ref(null)
  const ready = ref(false)
  const error = ref(null)
  const isPortrait = ref(true)
  let stream = null

  function detectOrientation() {
    const v = videoRef.value
    if (!v?.videoWidth) return
    const screenPortrait = window.innerHeight > window.innerWidth
    isPortrait.value = screenPortrait
  }

  async function start(facing = 'environment') {
    error.value = null
    stop()
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 2560 },
          height: { ideal: 1920 },
        },
        audio: false,
      })
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        await videoRef.value.play()
        detectOrientation()
        ready.value = true
      }
    } catch (e) {
      error.value =
        e?.name === 'NotAllowedError'
          ? 'Kamerazugriff wurde abgelehnt. Bitte im Browser erlauben.'
          : 'Kamera nicht verfuegbar. Bist du auf https oder localhost?'
    }
  }

  function stop() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    ready.value = false
  }

  function getStream() { return stream }

  function capture({ mirror = false } = {}) {
    const v = videoRef.value
    if (!v?.videoWidth) return null

    detectOrientation()
    const ratio = isPortrait.value ? 2 / 3 : 3 / 2
    const vw = v.videoWidth
    const vh = v.videoHeight
    let cw = vw
    let ch = Math.round(vw / ratio)
    if (ch > vh) { ch = vh; cw = Math.round(vh * ratio) }
    const sx = (vw - cw) / 2
    const sy = (vh - ch) / 2

    const longSide = DEFAULTS.captureWidth
    const targetW = isPortrait.value ? Math.round(longSide * (2 / 3)) : longSide
    const targetH = isPortrait.value ? longSide : Math.round(longSide / (3 / 2))
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')

    if (mirror) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  onBeforeUnmount(stop)

  return { videoRef, ready, error, isPortrait, start, stop, capture, getStream, detectOrientation }
}
