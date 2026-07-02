// useCamera.js — Kamera starten/stoppen, Frame als Canvas abgreifen.
import { ref, onBeforeUnmount } from 'vue'
<<<<<<< HEAD
import { EVENT } from '../config.js'
=======
import { DEFAULTS } from '../config.js'
>>>>>>> cef553901371bf220774623f8c092096541acc20

export function useCamera() {
  const videoRef = ref(null)
  const ready = ref(false)
  const error = ref(null)
<<<<<<< HEAD
  let stream = null

=======
  const isPortrait = ref(true)
  let stream = null

  function detectOrientation() {
    const v = videoRef.value
    if (!v?.videoWidth) return
    const screenPortrait = window.innerHeight > window.innerWidth
    isPortrait.value = screenPortrait
  }

>>>>>>> cef553901371bf220774623f8c092096541acc20
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
<<<<<<< HEAD
=======
        detectOrientation()
>>>>>>> cef553901371bf220774623f8c092096541acc20
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

<<<<<<< HEAD
  // Frame mittig auf 3:2 croppen. mirror=true spiegelt horizontal (Selfie).
  function capture({ mirror = false } = {}) {
    const v = videoRef.value
    if (!v || !v.videoWidth) return null

    const ratio = 3 / 2
=======
  function getStream() { return stream }

  function capture({ mirror = false } = {}) {
    const v = videoRef.value
    if (!v?.videoWidth) return null

    detectOrientation()
    const ratio = isPortrait.value ? 2 / 3 : 3 / 2
>>>>>>> cef553901371bf220774623f8c092096541acc20
    const vw = v.videoWidth
    const vh = v.videoHeight
    let cw = vw
    let ch = Math.round(vw / ratio)
    if (ch > vh) { ch = vh; cw = Math.round(vh * ratio) }
    const sx = (vw - cw) / 2
    const sy = (vh - ch) / 2

<<<<<<< HEAD
    const targetW = EVENT.captureWidth
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = Math.round(targetW / ratio)
=======
    const longSide = DEFAULTS.captureWidth
    const targetW = isPortrait.value ? Math.round(longSide * (2 / 3)) : longSide
    const targetH = isPortrait.value ? longSide : Math.round(longSide / (3 / 2))
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
>>>>>>> cef553901371bf220774623f8c092096541acc20
    const ctx = canvas.getContext('2d')

    if (mirror) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  onBeforeUnmount(stop)

<<<<<<< HEAD
  return { videoRef, ready, error, start, stop, capture }
=======
  return { videoRef, ready, error, isPortrait, start, stop, capture, getStream, detectOrientation }
>>>>>>> cef553901371bf220774623f8c092096541acc20
}
