<script setup>
import { ref, onMounted, computed } from 'vue'
import { EVENT, isRevealed, revealLabel } from '../config.js'
import { storage } from '../lib/storage.js'
import FilmFrame from '../components/FilmFrame.vue'

const albums = ref([])     // Vorschau (gesperrt)
const groups = ref([])     // volle Alben (offen)
const loading = ref(true)
const revealed = isRevealed()
const openName = ref(null)
const lightbox = ref(null)

const totalPhotos = computed(() => groups.value.reduce((n, g) => n + g.photos.length, 0))

onMounted(async () => {
  if (revealed) groups.value = await storage.listByGuest()
  else albums.value = await storage.listAlbums()
  loading.value = false
})

function toggle(name) { openName.value = openName.value === name ? null : name }
</script>

<template>
  <main class="gallery">
    <header class="head">
      <p class="eyebrow">Die Alben der Gäste</p>
      <h2 class="script">Kaycee &amp; Mustafa</h2>
    </header>

    <!-- GESPERRT: Album-Kacheln mit verschwommenem Cover -->
    <template v-if="!revealed">
      <p v-if="loading" class="empty">lädt…</p>
      <p v-else-if="!albums.length" class="empty">Noch keine Alben — sobald jemand fotografiert, erscheint es hier.</p>
      <div v-else class="tiles">
        <article v-for="a in albums" :key="a.guestName" class="tile">
          <img :src="a.cover" class="cover" alt="" />
          <div class="lock">
            <p class="big script">{{ a.guestName }}</p>
            <p class="open stamp">Öffnet {{ revealLabel() }}</p>
            <p class="cnt stamp">{{ a.count }} {{ a.count === 1 ? 'Foto' : 'Fotos' }}</p>
          </div>
        </article>
      </div>
    </template>

    <!-- OFFEN: Ordner pro Gast -->
    <template v-else>
      <p v-if="loading" class="empty">lädt…</p>
      <p v-else-if="!groups.length" class="empty">Noch keine Fotos vorhanden.</p>
      <template v-else>
        <p class="count stamp">{{ groups.length }} Gäste · {{ totalPhotos }} Fotos</p>
        <ul class="folders">
          <li v-for="g in groups" :key="g.guestName" class="folder">
            <button class="folder-head" @click="toggle(g.guestName)">
              <img :src="g.photos[0].url" class="ftab" alt="" />
              <span class="fname">{{ g.guestName }}</span>
              <span class="fcount stamp">{{ g.photos.length }}</span>
              <span class="chev">{{ openName === g.guestName ? '–' : '+' }}</span>
            </button>
            <div v-if="openName === g.guestName" class="contact">
              <button v-for="(p, i) in g.photos" :key="p.id" class="cell" @click="lightbox = p.url">
                <FilmFrame :src="p.url" :index="i + 1" />
              </button>
            </div>
          </li>
        </ul>
      </template>
    </template>

    <div v-if="lightbox" class="lb" @click="lightbox = null"><img :src="lightbox" alt="" /></div>
  </main>
</template>

<style scoped>
.gallery { flex: 1; padding: 1.4rem 1.2rem 2rem; max-width: 640px; margin: 0 auto; width: 100%; }
.head { text-align: center; margin-bottom: 1.2rem; }
.head h2 { font-size: 2.6rem; color: var(--moss); margin-top: 0.2rem; }

.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.tile { position: relative; aspect-ratio: 3/4; border-radius: 14px; overflow: hidden;
  border: 1px solid var(--line); box-shadow: 0 8px 20px rgba(58,44,29,0.14); }
.cover { width: 100%; height: 100%; object-fit: cover; filter: blur(14px) brightness(0.78) saturate(0.85); transform: scale(1.15); }
.lock { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.3rem; text-align: center; padding: 1rem; background: rgba(67,81,47,0.28); color: var(--paper); }
.lock .big { font-size: 1.8rem; }
.lock .open { font-size: 0.62rem; color: var(--paper); opacity: 0.95; }
.lock .cnt { font-size: 0.6rem; color: var(--paper); opacity: 0.8; }

.count { text-align: center; margin: 0 0 1rem; }
.folders { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.folder { background: rgba(244,236,220,0.86); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.folder-head { width: 100%; display: flex; align-items: center; gap: 0.8rem; background: transparent;
  border: none; color: var(--ink); padding: 0.7rem 1rem; font-family: var(--font-serif); font-style: italic; font-size: 1.3rem; }
.ftab { width: 46px; height: 46px; border-radius: 8px; object-fit: cover; border: 1px solid var(--line); flex: none; }
.fname { font-weight: 600; flex: 1; text-align: left; }
.fcount { font-size: 0.85rem; }
.chev { color: var(--brown); width: 1ch; }
.contact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; padding: 0 0.9rem 1rem; }
.cell { background: none; border: none; padding: 0; cursor: pointer; }
.empty { text-align: center; color: var(--brown); margin-top: 2.5rem; font-size: 1.15rem; }

.lb { position: fixed; inset: 0; z-index: 100; background: rgba(28,22,14,0.94);
  display: grid; place-items: center; padding: 1.5rem; }
.lb img { max-width: 100%; max-height: 100%; border-radius: 4px; }

@media (min-width: 560px) {
  .tiles { grid-template-columns: repeat(3, 1fr); }
  .contact { grid-template-columns: repeat(4, 1fr); }
}
</style>
