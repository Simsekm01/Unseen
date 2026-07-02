<script setup>
<<<<<<< HEAD
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { EVENT, dateStamp } from '../config.js'
import { useCamera } from '../composables/useCamera.js'
import { applyVintage } from '../lib/vintage.js'
=======
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { activeWedding, isShootingOpen, shootStartLabel } from '../config.js'
import { useCamera } from '../composables/useCamera.js'
import { getFilter } from '../lib/filters.js'
>>>>>>> cef553901371bf220774623f8c092096541acc20
import { storage } from '../lib/storage.js'
import { useSession } from '../stores/session.js'
import ShotCounter from '../components/ShotCounter.vue'

const router = useRouter()
<<<<<<< HEAD
const session = useSession()
const { videoRef, ready, error, start, capture } = useCamera()
=======
const route = useRoute()
const session = useSession()
const slug = route.params.slug
const { videoRef, ready, error, start, stop, capture, getStream, detectOrientation } = useCamera()
>>>>>>> cef553901371bf220774623f8c092096541acc20

const facing = ref('environment')
const isFront = computed(() => facing.value === 'user')
const flashing = ref(false)
const processing = ref(false)
<<<<<<< HEAD
const reveal = ref(null)        // developed Foto-Vorschau nach dem Schuss
const lastThumb = ref(null)
let revealTimer = null

onMounted(() => start(facing.value))

async function flip() {
  facing.value = isFront.value ? 'environment' : 'user'
=======
const reveal = ref(null)
const lastThumb = ref(null)
let revealTimer = null

const liveCanvasRef = ref(null)
let liveRafId = null

const zoom = ref(1)
const maxZoom = ref(5)
const supportsHwZoom = ref(false)
const showZoomSlider = ref(false)
let zoomHideTimer = null
let pinchStartDist = 0
let pinchStartZoom = 1

const shootingOpen = computed(() => isShootingOpen())

onMounted(() => {
  start(facing.value)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(liveRafId)
  window.removeEventListener('resize', onResize)
})

function onResize() { detectOrientation() }

watch(ready, (val) => {
  if (val) { detectHwZoom(); startLiveFilter() }
  else cancelAnimationFrame(liveRafId)
})

function detectHwZoom() {
  const stream = getStream()
  if (!stream) return
  const track = stream.getVideoTracks()[0]
  const caps = track?.getCapabilities?.()
  if (caps?.zoom) {
    supportsHwZoom.value = true
    maxZoom.value = Math.min(caps.zoom.max, 5)
  } else {
    supportsHwZoom.value = false
    maxZoom.value = 5
  }
}

async function applyZoom(val) {
  zoom.value = Math.max(1, Math.min(maxZoom.value, val))
  if (supportsHwZoom.value) {
    const stream = getStream()
    const track = stream?.getVideoTracks()[0]
    if (track) {
      try { await track.applyConstraints({ advanced: [{ zoom: zoom.value }] }) } catch {}
    }
  }
  flashZoomSlider()
}

function flashZoomSlider() {
  showZoomSlider.value = true
  clearTimeout(zoomHideTimer)
  zoomHideTimer = setTimeout(() => { showZoomSlider.value = false }, 2000)
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    pinchStartDist = getPinchDist(e.touches)
    pinchStartZoom = zoom.value
  }
}
function onTouchMove(e) {
  if (e.touches.length === 2) {
    e.preventDefault()
    applyZoom(pinchStartZoom * (getPinchDist(e.touches) / pinchStartDist))
  }
}
function getPinchDist(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
}

function startLiveFilter() {
  cancelAnimationFrame(liveRafId)
  const v = videoRef.value
  const c = liveCanvasRef.value
  if (!v || !c) return
  const filter = getFilter(activeWedding.filterId)

  function loop() {
    if (!v.videoWidth) { liveRafId = requestAnimationFrame(loop); return }
    const container = c.parentElement
    if (container) {
      c.width = container.clientWidth * (devicePixelRatio > 1 ? 2 : 1)
      c.height = container.clientHeight * (devicePixelRatio > 1 ? 2 : 1)
    }
    const ctx = c.getContext('2d')
    const cw = c.width, ch = c.height
    ctx.save()
    if (isFront.value) { ctx.translate(cw, 0); ctx.scale(-1, 1) }
    if (!supportsHwZoom.value && zoom.value > 1) {
      const z = zoom.value, zw = cw / z, zh = ch / z, zx = (cw - zw) / 2, zy = (ch - zh) / 2
      ctx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight, zx, zy, zw, zh)
      ctx.restore(); ctx.save()
      ctx.drawImage(c, zx, zy, zw, zh, 0, 0, cw, ch)
    } else {
      ctx.drawImage(v, 0, 0, cw, ch)
    }
    ctx.restore()
    filter.live(ctx, cw, ch)
    liveRafId = requestAnimationFrame(loop)
  }
  liveRafId = requestAnimationFrame(loop)
}

async function flip() {
  facing.value = isFront.value ? 'environment' : 'user'
  zoom.value = 1
>>>>>>> cef553901371bf220774623f8c092096541acc20
  await start(facing.value)
}

async function shoot() {
<<<<<<< HEAD
  if (session.rollEmpty || processing.value || !ready.value) return
  const raw = capture({ mirror: isFront.value }) // Selfie nicht spiegelverkehrt
  if (!raw) return

  flashing.value = true
  processing.value = true
  setTimeout(() => (flashing.value = false), 160)

  try {
    const blob = await applyVintage(raw, { stamp: true })
    await storage.savePhoto({ guestId: session.guestId, guestName: session.guestName, blob })
    session.countShot()

    const url = URL.createObjectURL(blob)
    lastThumb.value && URL.revokeObjectURL(lastThumb.value)
    lastThumb.value = url
    // Filter erst NACH dem Schuss zeigen — kurze "Entwickelt"-Vorschau
    reveal.value = url
    clearTimeout(revealTimer)
    revealTimer = setTimeout(() => (reveal.value = null), 2600)
  } finally {
    processing.value = false
  }
=======
  if (session.rollEmpty || processing.value || !ready.value || !shootingOpen.value) return
  const raw = capture({ mirror: isFront.value })
  if (!raw) return
  flashing.value = true
  processing.value = true
  setTimeout(() => (flashing.value = false), 160)
  const filter = getFilter(activeWedding.filterId)
  try {
    const blob = await filter.apply(raw, { stamp: true })
    await storage.savePhoto({ guestId: session.guestId, guestName: session.guestName, blob })
    session.countShot()
    const url = URL.createObjectURL(blob)
    lastThumb.value && URL.revokeObjectURL(lastThumb.value)
    lastThumb.value = url
    reveal.value = url
    clearTimeout(revealTimer)
    revealTimer = setTimeout(() => (reveal.value = null), 2600)
  } finally { processing.value = false }
>>>>>>> cef553901371bf220774623f8c092096541acc20
}
</script>

<template>
  <main class="shoot">
<<<<<<< HEAD
    <header class="bar">
      <div class="who">
        <span class="eyebrow">Willkommen</span>
        <strong>{{ session.guestName }}</strong>
      </div>
      <ShotCounter :left="session.shotsLeft" :total="EVENT.maxShots" />
    </header>

    <div class="viewfinder">
      <video ref="videoRef" playsinline muted :class="{ mirror: isFront }"></video>
      <div class="grid"></div>

      <div v-if="flashing" class="flash"></div>

      <!-- Entwickelt-Vorschau -->
=======
    <!-- Full-viewport viewfinder -->
    <div class="viewfinder"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove">
      <video ref="videoRef" playsinline muted class="hidden-video"></video>
      <canvas ref="liveCanvasRef" class="live-canvas"></canvas>

      <!-- Top HUD -->
      <div class="hud-top">
        <div class="who">
          <span class="eyebrow">Willkommen</span>
          <strong>{{ session.guestName }}</strong>
        </div>
        <ShotCounter :left="session.shotsLeft" :total="activeWedding.maxShots" />
      </div>

      <!-- Zoom slider -->
      <div v-if="showZoomSlider" class="zoom-slider">
        <label for="zoom-input" class="zoom-label stamp">{{ zoom.toFixed(1) }}x</label>
        <input id="zoom-input" type="range" min="1" :max="maxZoom" step="0.1"
          :value="zoom" @input="applyZoom(+$event.target.value)"
          class="zoom-range" orient="vertical" />
      </div>

      <div v-if="flashing" class="flash"></div>

      <!-- Developed preview -->
>>>>>>> cef553901371bf220774623f8c092096541acc20
      <div v-if="reveal" class="developed" @click="reveal = null">
        <p class="eyebrow tag">Entwickelt</p>
        <div class="frame"><img :src="reveal" alt="" /></div>
        <p class="tap stamp">Tippen zum Weitermachen</p>
      </div>

      <div v-if="error" class="overlay">
        <p>{{ error }}</p>
        <button class="btn btn-ghost" @click="start(facing)">Nochmal</button>
      </div>

<<<<<<< HEAD
      <div v-if="session.rollEmpty" class="overlay used">
        <p class="big script">Film voll</p>
        <p>Alle {{ EVENT.maxShots }} Aufnahmen gemacht. Danke!</p>
        <button class="btn" @click="router.push('/roll')">Mein Album ansehen</button>
      </div>
    </div>

    <footer class="controls">
      <button class="thumb" :class="{ empty: !lastThumb }" @click="router.push('/roll')">
        <img v-if="lastThumb" :src="lastThumb" alt="Letzte Aufnahme" />
      </button>

      <button class="shutter" :class="{ busy: processing }"
        :disabled="session.rollEmpty || processing || !ready" @click="shoot">
        <span class="ring"></span>
      </button>

      <button class="flip" @click="flip" aria-label="Kamera wechseln">⟲</button>
    </footer>
=======
      <div v-if="!shootingOpen" class="overlay used">
        <p class="big script">{{ new Date() < (activeWedding.shootStart || 0) ? 'Noch nicht gestartet' : 'Fotografieren beendet' }}</p>
        <p v-if="new Date() < (activeWedding.shootStart || 0)">Fotografieren beginnt um {{ shootStartLabel() }}</p>
        <p v-else>Die Kamera ist geschlossen.</p>
      </div>

      <div v-else-if="session.rollEmpty" class="overlay used">
        <p class="big script">Film voll</p>
        <p>Alle {{ activeWedding.maxShots }} Aufnahmen gemacht. Danke!</p>
        <button class="btn" @click="router.push(`/${slug}/roll`)">Mein Album ansehen</button>
      </div>

      <!-- Bottom controls overlaid on viewfinder -->
      <footer class="controls">
        <button class="thumb" :class="{ empty: !lastThumb }" @click="router.push(`/${slug}/roll`)">
          <img v-if="lastThumb" :src="lastThumb" alt="Letzte Aufnahme" />
        </button>

        <button class="shutter" :class="{ busy: processing }"
          :disabled="session.rollEmpty || processing || !ready || !shootingOpen" @click="shoot">
          <span class="ring"></span>
        </button>

        <button class="flip" @click="flip" aria-label="Kamera wechseln">⟲</button>
      </footer>
    </div>
>>>>>>> cef553901371bf220774623f8c092096541acc20
  </main>
</template>

<style scoped>
<<<<<<< HEAD
.shoot { flex: 1; display: flex; flex-direction: column; }
.bar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.2rem 0.6rem; }
.who { display: flex; flex-direction: column; line-height: 1.1; }
.who strong { font-size: 1.4rem; color: var(--moss); }

.viewfinder {
  position: relative; flex: 1; margin: 0.4rem 1rem; border-radius: 16px; overflow: hidden;
  background: #1c160e; border: 3px solid var(--card); box-shadow: 0 10px 30px rgba(58,44,29,0.2);
}
video { width: 100%; height: 100%; object-fit: cover; display: block; }
video.mirror { transform: scaleX(-1); }

.grid {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.25;
  background-image:
    linear-gradient(rgba(244,236,220,0.5) 1px, transparent 1px),
    linear-gradient(90deg, rgba(244,236,220,0.5) 1px, transparent 1px);
  background-size: 33.33% 33.33%;
}
.flash { position: absolute; inset: 0; background: #fff; animation: f 0.16s ease-out; }
=======
.shoot {
  flex: 1; display: flex; flex-direction: column;
  height: 100dvh; overflow: hidden;
}

.viewfinder {
  position: relative; flex: 1;
  background: #0e0c08; overflow: hidden;
  touch-action: none;
}
.hidden-video { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.live-canvas { width: 100%; height: 100%; display: block; object-fit: cover; }

/* HUD on top of viewfinder */
.hud-top {
  position: absolute; top: 0; left: 0; right: 0; z-index: 3;
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: calc(0.8rem + env(safe-area-inset-top)) 1rem 0.6rem;
  background: linear-gradient(rgba(14,12,8,0.5), transparent);
  pointer-events: none;
}
.hud-top > * { pointer-events: auto; }
.who { display: flex; flex-direction: column; line-height: 1.1; }
.who .eyebrow { color: rgba(244,236,220,0.7); }
.who strong { font-size: 1.3rem; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }

/* Controls overlaid at bottom */
.controls {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 3;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  padding: 1rem 1.6rem calc(1.2rem + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, rgba(14,12,8,0.45));
}

.thumb {
  width: 50px; height: 50px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.1); overflow: hidden; padding: 0; justify-self: start;
  backdrop-filter: blur(4px);
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb.empty { opacity: 0.35; }

.shutter {
  width: 76px; height: 76px; border-radius: 50%;
  background: rgba(255,255,255,0.92);
  border: 4px solid rgba(255,255,255,0.3);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.35);
  display: grid; place-items: center; padding: 0;
  transition: transform 0.1s ease;
}
.shutter:active { transform: scale(0.9); }
.shutter:disabled { background: rgba(255,255,255,0.3); opacity: 0.5; }
.shutter.busy .ring { animation: spin 0.8s linear infinite; }
.ring {
  width: 58px; height: 58px; border-radius: 50%;
  border: 3px solid rgba(0,0,0,0.12);
}
@keyframes spin { to { transform: rotate(360deg); } }

.flip {
  justify-self: end; width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,0.12); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff; font-size: 1.3rem;
}

/* Zoom slider */
.zoom-slider {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  z-index: 4; animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.zoom-label {
  font-size: 0.6rem; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 8px;
}
.zoom-range {
  writing-mode: vertical-lr; direction: rtl;
  width: 28px; height: 120px;
  -webkit-appearance: none; appearance: none; background: transparent;
}
.zoom-range::-webkit-slider-runnable-track {
  width: 4px; background: rgba(255,255,255,0.3); border-radius: 2px;
}
.zoom-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
  background: #fff; border: 2px solid rgba(255,255,255,0.5);
  box-shadow: 0 1px 6px rgba(0,0,0,0.4); margin-left: -8px;
}

.flash { position: absolute; inset: 0; background: #fff; animation: f 0.16s ease-out; z-index: 6; }
>>>>>>> cef553901371bf220774623f8c092096541acc20
@keyframes f { from { opacity: 0.85; } to { opacity: 0; } }

.developed {
  position: absolute; inset: 0; z-index: 5;
<<<<<<< HEAD
  background: rgba(28,22,14,0.78); backdrop-filter: blur(3px);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.8rem; padding: 1.4rem;
  animation: dev 0.5s ease;
}
@keyframes dev { from { opacity: 0; } to { opacity: 1; } }
.developed .frame { max-width: 92%; transform: rotate(-1.2deg); }
.developed .tag, .developed .tap { color: var(--paper); }
.developed .tap { opacity: 0.7; font-size: 0.7rem; }

.overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; text-align: center; padding: 2rem; background: rgba(28,22,14,0.84); color: var(--paper);
=======
  background: rgba(14,12,8,0.82); backdrop-filter: blur(4px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.8rem; padding: 1.4rem; animation: dev 0.5s ease;
}
@keyframes dev { from { opacity: 0; } to { opacity: 1; } }
.developed .frame { max-width: 88%; transform: rotate(-1.2deg); }
.developed .tag, .developed .tap { color: rgba(244,236,220,0.9); }
.developed .tap { opacity: 0.6; font-size: 0.7rem; }

.overlay {
  position: absolute; inset: 0; z-index: 4;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; text-align: center; padding: 2rem;
  background: rgba(14,12,8,0.88); color: var(--paper);
>>>>>>> cef553901371bf220774623f8c092096541acc20
}
.overlay p { margin: 0; }
.overlay.used .big { font-size: 2.6rem; color: var(--paper); }
.overlay .btn { font-style: normal; }
<<<<<<< HEAD

.controls { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  padding: 1.2rem 1.6rem calc(1.2rem + env(safe-area-inset-bottom)); }
.thumb { width: 52px; height: 52px; border-radius: 8px; border: 2px solid var(--card);
  background: var(--paper-2); overflow: hidden; padding: 0; justify-self: start; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb.empty { opacity: 0.4; }

.shutter { width: 80px; height: 80px; border-radius: 50%; background: var(--gold);
  border: 5px solid var(--card); box-shadow: 0 0 0 2px var(--gold), 0 6px 16px rgba(58,44,29,0.3);
  display: grid; place-items: center; padding: 0; transition: transform 0.1s ease; }
.shutter:active { transform: scale(0.92); }
.shutter:disabled { background: var(--brown); box-shadow: 0 0 0 2px var(--brown); opacity: 0.5; }
.shutter.busy .ring { animation: spin 0.8s linear infinite; }
.ring { width: 56px; height: 56px; border-radius: 50%; border: 2px solid rgba(44,32,16,0.4); }
@keyframes spin { to { transform: rotate(360deg); } }

.flip { justify-self: end; width: 48px; height: 48px; border-radius: 50%;
  background: var(--card); border: 1px solid var(--line); color: var(--brown); font-size: 1.3rem; }
=======
>>>>>>> cef553901371bf220774623f8c092096541acc20
</style>
