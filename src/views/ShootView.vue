<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { EVENT, dateStamp } from '../config.js'
import { useCamera } from '../composables/useCamera.js'
import { applyVintage } from '../lib/vintage.js'
import { storage } from '../lib/storage.js'
import { useSession } from '../stores/session.js'
import ShotCounter from '../components/ShotCounter.vue'

const router = useRouter()
const session = useSession()
const { videoRef, ready, error, start, capture } = useCamera()

const facing = ref('environment')
const isFront = computed(() => facing.value === 'user')
const flashing = ref(false)
const processing = ref(false)
const reveal = ref(null)        // developed Foto-Vorschau nach dem Schuss
const lastThumb = ref(null)
let revealTimer = null

onMounted(() => start(facing.value))

async function flip() {
  facing.value = isFront.value ? 'environment' : 'user'
  await start(facing.value)
}

async function shoot() {
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
}
</script>

<template>
  <main class="shoot">
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
      <div v-if="reveal" class="developed" @click="reveal = null">
        <p class="eyebrow tag">Entwickelt</p>
        <div class="frame"><img :src="reveal" alt="" /></div>
        <p class="tap stamp">Tippen zum Weitermachen</p>
      </div>

      <div v-if="error" class="overlay">
        <p>{{ error }}</p>
        <button class="btn btn-ghost" @click="start(facing)">Nochmal</button>
      </div>

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
  </main>
</template>

<style scoped>
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
@keyframes f { from { opacity: 0.85; } to { opacity: 0; } }

.developed {
  position: absolute; inset: 0; z-index: 5;
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
}
.overlay p { margin: 0; }
.overlay.used .big { font-size: 2.6rem; color: var(--paper); }
.overlay .btn { font-style: normal; }

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
</style>
