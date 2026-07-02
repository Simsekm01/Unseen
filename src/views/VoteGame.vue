<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { EVENT, isRevealed, revealLabel } from '../config.js'
import { storage } from '../lib/storage.js'
import { useSession } from '../stores/session.js'

const router = useRouter()
const session = useSession()
const revealed = isRevealed()

const groups = ref([])           // [{guestName, photos:[{id,url}]}]
const myVotes = ref(new Set())   // photoIds
const counts = ref({})
const loading = ref(true)
const tab = ref(0)               // welches Album
const showResults = ref(false)
const busy = ref(false)

const votesLeft = computed(() => EVENT.votesPerGuest - myVotes.value.size)
const album = computed(() => groups.value[tab.value] || null)

const ranking = computed(() => {
  const all = groups.value.flatMap((g) => g.photos.map((p) => ({ ...p, guest: g.guestName })))
  return all
    .map((p) => ({ ...p, votes: counts.value[p.id] || 0 }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 12)
})

onMounted(async () => {
  if (!revealed) { loading.value = false; return }
  groups.value = await storage.listByGuest()
  myVotes.value = new Set(await storage.myVotes(session.guestId))
  counts.value = await storage.voteCounts()
  loading.value = false
})

async function toggle(photoId) {
  if (busy.value) return
  busy.value = true
  try {
    if (myVotes.value.has(photoId)) {
      await storage.removeVote(session.guestId, photoId)
      myVotes.value.delete(photoId)
      counts.value[photoId] = Math.max(0, (counts.value[photoId] || 1) - 1)
    } else if (votesLeft.value > 0) {
      await storage.addVote(session.guestId, photoId)
      myVotes.value.add(photoId)
      counts.value[photoId] = (counts.value[photoId] || 0) + 1
    }
    myVotes.value = new Set(myVotes.value)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="vote">
    <!-- gesperrt -->
    <section v-if="!revealed" class="locked">
      <p class="big script">Noch geschlossen</p>
      <p>Das Voting öffnet {{ revealLabel() }}.</p>
      <button class="btn" @click="router.push('/games')">Zurück zu den Spielen</button>
    </section>

    <template v-else>
      <header class="head">
        <p class="eyebrow">Spiel · Bestes Bild</p>
        <h2 class="script">Stimm ab</h2>
        <div class="meta">
          <span class="stamp votesleft" :class="{ done: votesLeft === 0 }">
            {{ votesLeft }} von {{ EVENT.votesPerGuest }} Stimmen frei
          </span>
          <button class="link stamp" @click="showResults = !showResults">
            {{ showResults ? 'Zurück zum Abstimmen' : 'Ergebnisse' }}
          </button>
        </div>
      </header>

      <p v-if="loading" class="empty">lädt…</p>

      <!-- Ergebnisse -->
      <section v-else-if="showResults" class="results">
        <ol>
          <li v-for="(p, i) in ranking" :key="p.id">
            <span class="rank stamp">{{ i + 1 }}</span>
            <img :src="p.url" alt="" />
            <span class="rguest">{{ p.guest }}</span>
            <span class="rvotes stamp">{{ p.votes }} ♥</span>
          </li>
        </ol>
      </section>

      <!-- Abstimmen: durch Alben blättern -->
      <template v-else-if="album">
        <nav class="tabs">
          <button v-for="(g, i) in groups" :key="g.guestName"
            class="tab" :class="{ on: i === tab }" @click="tab = i">
            {{ g.guestName }}
          </button>
        </nav>

        <div class="grid">
          <button v-for="p in album.photos" :key="p.id" class="cell"
            :class="{ voted: myVotes.has(p.id) }"
            :disabled="!myVotes.has(p.id) && votesLeft === 0"
            @click="toggle(p.id)">
            <img :src="p.url" alt="" />
            <span class="heart">{{ myVotes.has(p.id) ? '♥' : '♡' }}</span>
            <span v-if="counts[p.id]" class="badge stamp">{{ counts[p.id] }}</span>
          </button>
        </div>
      </template>

      <p v-else class="empty">Noch keine Fotos zum Abstimmen.</p>
    </template>
  </main>
</template>

<style scoped>
.vote { flex: 1; padding: 1.2rem 1rem 2rem; max-width: 680px; margin: 0 auto; width: 100%; }
.head { text-align: center; }
.head h2 { font-size: 2.4rem; color: var(--moss); margin: 0.1rem 0; }
.meta { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.3rem; }
.votesleft { font-size: 0.72rem; color: var(--moss); }
.votesleft.done { color: var(--clay); }
.link { font-size: 0.72rem; background: none; border: none; color: var(--brown); text-decoration: underline; cursor: pointer; }

.tabs { display: flex; gap: 0.4rem; overflow-x: auto; padding: 0.9rem 0.2rem; -webkit-overflow-scrolling: touch; }
.tab { flex: none; font-family: var(--font-serif); font-style: italic; font-size: 1.05rem;
  background: rgba(244,236,220,0.8); border: 1px solid var(--line); color: var(--brown);
  padding: 0.4rem 0.9rem; border-radius: 999px; }
.tab.on { background: var(--moss); color: var(--paper); border-color: var(--moss); }

.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7rem; }
.cell { position: relative; padding: 0; border: 2px solid transparent; border-radius: 12px; overflow: hidden;
  background: var(--card); cursor: pointer; aspect-ratio: 3/2; }
.cell img { width: 100%; height: 100%; object-fit: cover; transition: filter 0.15s ease; }
.cell:disabled { cursor: not-allowed; }
.cell:disabled img { filter: grayscale(0.4) brightness(0.85); }
.cell.voted { border-color: var(--clay); }
.heart { position: absolute; right: 8px; bottom: 6px; font-size: 1.5rem; color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.cell.voted .heart { color: var(--clay); }
.badge { position: absolute; left: 8px; top: 8px; background: rgba(28,22,14,0.7); color: var(--paper);
  font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 999px; }

.results ol { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.results li { display: flex; align-items: center; gap: 0.8rem; background: rgba(244,236,220,0.86);
  border: 1px solid var(--line); border-radius: 12px; padding: 0.4rem 0.7rem; }
.results .rank { width: 1.6rem; text-align: center; color: var(--gold); font-size: 0.9rem; }
.results img { width: 56px; height: 40px; object-fit: cover; border-radius: 6px; }
.results .rguest { flex: 1; font-size: 1.1rem; }
.results .rvotes { color: var(--clay); font-size: 0.8rem; }

.locked { text-align: center; margin-top: 3rem; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
.locked .big { font-size: 2.2rem; color: var(--moss); }
.locked p { color: var(--brown); }
.empty { text-align: center; color: var(--brown); margin-top: 2rem; font-size: 1.1rem; }

@media (min-width: 560px) { .grid { grid-template-columns: repeat(3, 1fr); } }
</style>
