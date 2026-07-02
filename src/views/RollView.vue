<script setup>
<<<<<<< HEAD
import { ref, onMounted, computed } from 'vue'
import { EVENT, isRevealed, revealLabel } from '../config.js'
=======
import { ref, onMounted } from 'vue'
import { activeWedding, isRevealed, revealLabel } from '../config.js'
>>>>>>> cef553901371bf220774623f8c092096541acc20
import { storage } from '../lib/storage.js'
import { useSession } from '../stores/session.js'
import FilmFrame from '../components/FilmFrame.vue'

const session = useSession()
const photos = ref([])
const loading = ref(true)
<<<<<<< HEAD
const revealed = isRevealed()

onMounted(async () => {
  photos.value = await storage.listMyPhotos(session.guestId)
  loading.value = false
=======
const loadError = ref('')
const revealed = isRevealed()

onMounted(async () => {
  try {
    photos.value = await storage.listMyPhotos(session.guestId)
  } catch {
    loadError.value = 'Fotos konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
>>>>>>> cef553901371bf220774623f8c092096541acc20
})
</script>

<template>
  <main class="roll">
    <header class="head">
      <p class="eyebrow">Mein Album</p>
      <h2 class="script">{{ session.guestName }}</h2>
<<<<<<< HEAD
      <p class="meta stamp">{{ session.shotsTaken }} / {{ EVENT.maxShots }} belichtet</p>
=======
      <p class="meta stamp">{{ session.shotsTaken }} / {{ activeWedding.maxShots }} belichtet</p>
>>>>>>> cef553901371bf220774623f8c092096541acc20
    </header>

    <div v-if="!revealed" class="banner">
      <p class="bt">In der Dunkelkammer</p>
      <p>Alle Alben öffnen am <strong>{{ revealLabel() }}</strong>. Deine eigenen Fotos siehst du natürlich schon jetzt.</p>
    </div>

<<<<<<< HEAD
    <p v-if="loading" class="empty">lädt…</p>
=======
    <div v-if="loading" class="skeleton">
      <div v-for="n in 4" :key="n" class="skel-item"></div>
    </div>
    <p v-else-if="loadError" class="err">{{ loadError }}</p>
>>>>>>> cef553901371bf220774623f8c092096541acc20
    <p v-else-if="!photos.length" class="empty">Noch keine Aufnahmen. Zurück zur Kamera und los.</p>
    <div v-else class="strip">
      <FilmFrame v-for="(p, i) in photos" :key="p.id" :src="p.url" :index="i + 1" />
    </div>
  </main>
</template>

<style scoped>
.roll { flex: 1; padding: 1.4rem 1.2rem 2rem; max-width: 560px; margin: 0 auto; width: 100%; }
.head { text-align: center; }
.head h2 { font-size: 2.4rem; color: var(--moss); margin: 0.1rem 0; }
.meta { font-size: 0.8rem; }
.banner { margin: 1.2rem 0; background: rgba(93,107,67,0.14); border: 1px solid var(--line);
  border-left: 3px solid var(--olive); border-radius: 12px; padding: 0.9rem 1.1rem; }
.banner .bt { margin: 0 0 0.2rem; font-weight: 600; color: var(--moss); }
.banner p { margin: 0; color: var(--brown); line-height: 1.4; }
.banner strong { color: var(--ink); }
.empty { text-align: center; color: var(--brown); margin-top: 2rem; font-size: 1.1rem; }
<<<<<<< HEAD
.strip { margin-top: 1.2rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }
=======
.err {
  text-align: center; color: var(--clay); margin-top: 2rem; font-size: 1rem;
  font-family: var(--font-label); font-style: normal;
}
.strip { margin-top: 1.2rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }

.skeleton { margin-top: 1.2rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }
.skel-item {
  aspect-ratio: 2/3; border-radius: 8px; background: var(--paper-2);
  animation: shimmer 1.4s ease-in-out infinite alternate;
}
@keyframes shimmer { from { opacity: 0.5; } to { opacity: 1; } }
>>>>>>> cef553901371bf220774623f8c092096541acc20
</style>
