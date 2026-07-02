<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { activeWedding, isRevealed } from '../config.js'
import { storage } from '../lib/storage.js'
import FilmFrame from '../components/FilmFrame.vue'

const albums = ref([])
const groups = ref([])
const loading = ref(true)
const revealed = ref(isRevealed())
const openName = ref(null)
const lightbox = ref(null)
const countdown = ref('')
let countdownTimer = null

const totalPhotos = computed(() => groups.value.reduce((n, g) => n + g.photos.length, 0))

function updateCountdown() {
  if (!activeWedding.revealAt) { countdown.value = ''; return }
  const diff = activeWedding.revealAt.getTime() - Date.now()
  if (diff <= 0) {
    countdown.value = ''
    revealed.value = true
    clearInterval(countdownTimer)
    loadRevealed()
    return
  }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (d > 0) countdown.value = `${d}T ${h}h ${m}m ${s}s`
  else if (h > 0) countdown.value = `${h}h ${m}m ${s}s`
  else countdown.value = `${m}m ${s}s`
}

const loadError = ref('')

async function loadRevealed() {
  loading.value = true
  try {
    groups.value = await storage.listByGuest()
  } catch {
    loadError.value = 'Galerie konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    if (revealed.value) {
      await loadRevealed()
    } else {
      albums.value = await storage.listAlbums()
      loading.value = false
      updateCountdown()
      countdownTimer = setInterval(updateCountdown, 1000)
    }
  } catch {
    loadError.value = 'Daten konnten nicht geladen werden.'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearInterval(countdownTimer)
})

function toggle(name) { openName.value = openName.value === name ? null : name }
</script>

<template>
  <main class="gallery">
    <header class="head">
      <p class="eyebrow">Die Alben der Gäste</p>
      <h2 class="script">{{ activeWedding.coupleA }} &amp; {{ activeWedding.coupleB }}</h2>
    </header>

    <!-- LOCKED: Masonry grid with blurred covers + countdown -->
    <template v-if="!revealed">
      <div v-if="countdown" class="countdown-bar">
        <span class="eyebrow">Galerie öffnet in</span>
        <span class="countdown-digits stamp">{{ countdown }}</span>
      </div>

      <p v-if="loading" class="empty">lädt…</p>
      <p v-else-if="loadError" class="err">{{ loadError }}</p>
      <p v-else-if="!albums.length" class="empty">Noch keine Alben — sobald jemand fotografiert, erscheint es hier.</p>
      <div v-else class="masonry">
        <article v-for="(a, i) in albums" :key="a.guestName" class="tile" :class="`h-${(i % 3) + 1}`">
          <img :src="a.cover" class="cover" loading="lazy" decoding="async" alt="" />
          <div class="lock">
            <p class="lock-name script">{{ a.guestName }}</p>
            <p class="lock-count stamp">{{ a.count }} {{ a.count === 1 ? 'Foto' : 'Fotos' }}</p>
          </div>
        </article>
      </div>
    </template>

    <!-- REVEALED -->
    <template v-else>
      <p v-if="loading" class="empty">lädt…</p>
      <p v-else-if="!groups.length" class="empty">Noch keine Fotos vorhanden.</p>
      <template v-else>
        <p class="count stamp">{{ groups.length }} Gäste · {{ totalPhotos }} Fotos</p>
        <ul class="folders">
          <li v-for="g in groups" :key="g.guestName" class="folder" :class="{ open: openName === g.guestName }">
            <button class="folder-head" @click="toggle(g.guestName)">
              <img :src="g.photos[0].url" class="ftab" loading="lazy" decoding="async" alt="" />
              <span class="fname">{{ g.guestName }}</span>
              <span class="fcount stamp">{{ g.photos.length }}</span>
              <span class="chev">{{ openName === g.guestName ? '–' : '+' }}</span>
            </button>
            <Transition name="slide">
              <div v-if="openName === g.guestName" class="contact">
                <button v-for="(p, i) in g.photos" :key="p.id" class="cell" @click="lightbox = p.url">
                  <FilmFrame :src="p.url" :index="i + 1" />
                </button>
              </div>
            </Transition>
          </li>
        </ul>
      </template>
    </template>

    <!-- Lightbox -->
    <Transition name="lb-fade">
      <div v-if="lightbox" class="lb" @click="lightbox = null"><img :src="lightbox" alt="" /></div>
    </Transition>
  </main>
</template>

<style scoped>
.gallery { flex: 1; padding: 1.4rem 1.2rem 2rem; max-width: 640px; margin: 0 auto; width: 100%; }
.head { text-align: center; margin-bottom: 1rem; }
.head h2 { font-size: 2.6rem; color: var(--moss); margin-top: 0.2rem; }

/* Countdown bar */
.countdown-bar {
  display: flex; align-items: center; justify-content: center; gap: 0.8rem;
  background: rgba(93,107,67,0.12); border: 1px solid var(--line);
  border-radius: 999px; padding: 0.6rem 1.4rem; margin-bottom: 1.2rem;
}
.countdown-digits { font-size: 1rem; color: var(--moss); font-weight: 600; letter-spacing: 0.08em; }

/* Masonry grid */
.masonry {
  columns: 2; column-gap: 0.8rem;
}
@media (min-width: 560px) { .masonry { columns: 3; } }

.tile {
  break-inside: avoid; position: relative; border-radius: 14px; overflow: hidden;
  border: 1px solid var(--line); box-shadow: 0 6px 18px rgba(58,44,29,0.12);
  margin-bottom: 0.8rem;
}
.tile.h-1 { aspect-ratio: 3/4; }
.tile.h-2 { aspect-ratio: 2/3; }
.tile.h-3 { aspect-ratio: 4/5; }

.cover {
  width: 100%; height: 100%; object-fit: cover;
  filter: blur(16px) brightness(0.75) saturate(0.8);
  transform: scale(1.2);
}
.lock {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.3rem; text-align: center; padding: 1rem;
  background: rgba(67,81,47,0.22);
}
.lock-name { font-size: 1.6rem; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
.lock-count { font-size: 0.58rem; color: rgba(255,255,255,0.85); }

/* Revealed folders */
.count { text-align: center; margin: 0 0 1rem; }
.folders { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.folder {
  background: rgba(244,236,220,0.86); border: 1px solid var(--line); border-radius: 14px; overflow: hidden;
  transition: box-shadow 0.2s;
}
.folder.open { box-shadow: 0 6px 20px rgba(58,44,29,0.14); }
.folder-head {
  width: 100%; display: flex; align-items: center; gap: 0.8rem; background: transparent;
  border: none; color: var(--ink); padding: 0.7rem 1rem;
  font-family: var(--font-serif); font-style: italic; font-size: 1.3rem;
}
.ftab { width: 46px; height: 46px; border-radius: 8px; object-fit: cover; border: 1px solid var(--line); flex: none; }
.fname { font-weight: 600; flex: 1; text-align: left; }
.fcount { font-size: 0.85rem; }
.chev { color: var(--brown); width: 1ch; }
.contact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; padding: 0 0.9rem 1rem; }
.cell { background: none; border: none; padding: 0; cursor: pointer; }
.empty { text-align: center; color: var(--brown); margin-top: 2.5rem; font-size: 1.15rem; }
.err { text-align: center; color: var(--clay); margin-top: 2rem; font-size: 1rem; font-family: var(--font-label); font-style: normal; }

/* Slide transition for folder open */
.slide-enter-active { transition: all 0.3s ease; overflow: hidden; }
.slide-leave-active { transition: all 0.2s ease; overflow: hidden; }
.slide-enter-from { max-height: 0; opacity: 0; }
.slide-enter-to { max-height: 600px; opacity: 1; }
.slide-leave-from { max-height: 600px; opacity: 1; }
.slide-leave-to { max-height: 0; opacity: 0; }

/* Lightbox */
.lb {
  position: fixed; inset: 0; z-index: 100; background: rgba(14,12,8,0.95);
  display: grid; place-items: center; padding: 1.5rem;
}
.lb img { max-width: 100%; max-height: 100%; border-radius: 4px; }
.lb-fade-enter-active { transition: opacity 0.3s ease; }
.lb-fade-leave-active { transition: opacity 0.2s ease; }
.lb-fade-enter-from, .lb-fade-leave-to { opacity: 0; }

@media (min-width: 560px) {
  .contact { grid-template-columns: repeat(4, 1fr); }
}
</style>
