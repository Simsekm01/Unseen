<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isRevealed, revealLabel, DEFAULTS } from '../config.js'
import { storage } from '../lib/storage.js'
import { useSession } from '../stores/session.js'

const router = useRouter()
const route = useRoute()
const session = useSession()
const slug = route.params.slug
const revealed = isRevealed()

const allPhotos = ref([])
const myVotes = ref(new Set())
const counts = ref({})
const loading = ref(true)
const busy = ref(false)
const current = ref(0)

const votesPerGuest = DEFAULTS.votesPerGuest
const votesUsed = computed(() => myVotes.value.size)
const votesLeft = computed(() => votesPerGuest - votesUsed.value)
const allVoted = computed(() => votesUsed.value >= votesPerGuest)

const photo = computed(() => allPhotos.value[current.value] || null)
const isVoted = computed(() => photo.value ? myVotes.value.has(photo.value.id) : false)

const ranking = computed(() =>
  [...allPhotos.value]
    .map((p) => ({ ...p, votes: counts.value[p.id] || 0 }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 12)
)

const loadError = ref('')

onMounted(async () => {
  if (!revealed) { loading.value = false; return }
  try {
    const groups = await storage.listByGuest()
    allPhotos.value = groups.flatMap((g) => g.photos.map((p) => ({ ...p, guest: g.guestName })))
    myVotes.value = new Set(await storage.myVotes(session.guestId))
    counts.value = await storage.voteCounts()
  } catch {
    loadError.value = 'Voting konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
})

function prev() {
  if (current.value > 0) current.value--
}
function next() {
  if (current.value < allPhotos.value.length - 1) current.value++
}

let touchStartX = 0
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 50) dx > 0 ? prev() : next()
}

async function toggleVote() {
  if (!photo.value || busy.value) return
  busy.value = true
  const pid = photo.value.id
  try {
    if (myVotes.value.has(pid)) {
      await storage.removeVote(session.guestId, pid)
      myVotes.value.delete(pid)
      counts.value[pid] = Math.max(0, (counts.value[pid] || 1) - 1)
    } else if (votesLeft.value > 0) {
      await storage.addVote(session.guestId, pid)
      myVotes.value.add(pid)
      counts.value[pid] = (counts.value[pid] || 0) + 1
    }
    myVotes.value = new Set(myVotes.value)
  } finally { busy.value = false }
}
</script>

<template>
  <main class="vote">
    <!-- Locked -->
    <section v-if="!revealed" class="locked">
      <p class="big script">Noch geschlossen</p>
      <p>Das Voting öffnet {{ revealLabel() }}.</p>
      <button class="btn" @click="router.push(`/${slug}/shoot`)">Zurück zur Kamera</button>
    </section>

    <template v-else>
      <!-- Header -->
      <header class="head">
        <p class="eyebrow">Voting · Bestes Bild</p>
        <div class="vote-pips">
          <span v-for="i in votesPerGuest" :key="i" class="pip" :class="{ filled: i <= votesUsed }">♥</span>
        </div>
        <p class="meta stamp">{{ votesUsed }} von {{ votesPerGuest }} gewählt</p>
      </header>

      <p v-if="loading" class="empty">lädt…</p>
      <p v-else-if="loadError" class="err">{{ loadError }}</p>

      <!-- Completed state -->
      <section v-else-if="allVoted" class="completed">
        <div class="done-badge">
          <span class="done-check">✓</span>
        </div>
        <h2 class="script">Abstimmung abgeschlossen</h2>
        <p class="done-sub">Danke für deine Stimmen!</p>

        <h3 class="eyebrow results-title">Ergebnisse</h3>
        <ol class="results-list">
          <li v-for="(p, i) in ranking" :key="p.id">
            <span class="rank stamp">{{ i + 1 }}</span>
            <img :src="p.url" loading="lazy" decoding="async" alt="" />
            <span class="rguest">{{ p.guest }}</span>
            <span class="rvotes stamp">{{ p.votes }} ♥</span>
          </li>
        </ol>
      </section>

      <!-- Carousel -->
      <template v-else-if="allPhotos.length">
        <div class="carousel"
          @touchstart.passive="onTouchStart"
          @touchend="onTouchEnd">

          <button class="arrow arrow-left" :disabled="current === 0" @click="prev">‹</button>

          <div class="slide-wrap">
            <Transition name="slide" mode="out-in">
              <div class="slide" :key="photo?.id">
                <img v-if="photo" :src="photo.url" loading="lazy" decoding="async" alt="" class="slide-img" />
                <p v-if="photo" class="slide-guest stamp">{{ photo.guest }}</p>
              </div>
            </Transition>
          </div>

          <button class="arrow arrow-right" :disabled="current >= allPhotos.length - 1" @click="next">›</button>
        </div>

        <div class="carousel-meta">
          <span class="stamp pos">{{ current + 1 }} / {{ allPhotos.length }}</span>
        </div>

        <button class="heart-btn" :class="{ voted: isVoted, disabled: !isVoted && votesLeft === 0 }"
          :disabled="(!isVoted && votesLeft === 0) || busy"
          @click="toggleVote">
          <svg class="heart-svg" viewBox="0 0 32 32">
            <path class="heart-outline" d="M16 28s-11-7.2-11-14.5C5 9.4 8.1 6 12 6c2.3 0 3.9 1.4 4 1.5C16.1 7.4 17.7 6 20 6c3.9 0 7 3.4 7 7.5C27 20.8 16 28 16 28z" />
            <path class="heart-fill" d="M16 28s-11-7.2-11-14.5C5 9.4 8.1 6 12 6c2.3 0 3.9 1.4 4 1.5C16.1 7.4 17.7 6 20 6c3.9 0 7 3.4 7 7.5C27 20.8 16 28 16 28z" />
          </svg>
        </button>
      </template>

      <p v-else class="empty">Noch keine Fotos zum Abstimmen.</p>
    </template>
  </main>
</template>

<style scoped>
.vote {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 1rem 1rem 2rem; max-width: 540px; margin: 0 auto; width: 100%;
}

.head { text-align: center; margin-bottom: 0.8rem; }

/* Vote pips */
.vote-pips { display: flex; justify-content: center; gap: 0.5rem; margin: 0.5rem 0 0.3rem; }
.pip {
  font-size: 1.4rem; color: var(--line);
  transition: color 0.3s ease, transform 0.3s ease;
}
.pip.filled { color: var(--clay); transform: scale(1.15); }
.meta { font-size: 0.72rem; }

/* Carousel */
.carousel {
  flex: 1; display: flex; align-items: center; gap: 0.4rem;
  width: 100%; min-height: 0; position: relative;
}

.err { text-align: center; color: var(--clay); margin-top: 2rem; font-size: 1rem; font-family: var(--font-label); font-style: normal; }

.arrow {
  flex: none; width: 44px; height: 44px; border-radius: 50%;
  background: var(--card); border: 1px solid var(--line); color: var(--brown);
  font-size: 1.5rem; display: grid; place-items: center;
  transition: opacity 0.15s;
  z-index: 2;
}
.arrow:disabled { opacity: 0.25; }

.slide-wrap {
  flex: 1; overflow: hidden; border-radius: 16px;
  aspect-ratio: 3/4; max-height: 65dvh;
  background: var(--card); border: 1px solid var(--line);
  box-shadow: 0 8px 24px rgba(58,44,29,0.14);
}

.slide {
  width: 100%; height: 100%; position: relative;
  display: flex; flex-direction: column;
}
.slide-img {
  width: 100%; flex: 1; object-fit: cover; display: block;
  border-radius: 14px 14px 0 0;
}
.slide-guest {
  text-align: center; padding: 0.5rem; font-size: 0.72rem;
  background: var(--card);
}

/* Slide transition */
.slide-enter-active { transition: all 0.25s ease; }
.slide-leave-active { transition: all 0.15s ease; }
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to { opacity: 0; transform: translateX(-30px); }

.carousel-meta { margin: 0.6rem 0 0.4rem; }
.pos { font-size: 0.7rem; }

/* Heart button */
.heart-btn {
  width: 64px; height: 64px; border-radius: 50%; border: none;
  background: var(--card); box-shadow: 0 4px 16px rgba(58,44,29,0.15);
  display: grid; place-items: center; padding: 0; cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 0.5rem;
}
.heart-btn:active { transform: scale(0.9); }
.heart-btn.disabled { opacity: 0.4; cursor: not-allowed; }
.heart-btn.voted { background: var(--clay); box-shadow: 0 4px 20px rgba(169,96,63,0.3); }

.heart-svg { width: 32px; height: 32px; }
.heart-outline {
  fill: none; stroke: var(--clay); stroke-width: 1.5;
  transition: stroke 0.2s;
}
.heart-fill {
  fill: var(--clay); opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform-origin: center;
}
.heart-btn.voted .heart-fill { opacity: 1; animation: heartPop 0.4s ease; }
.heart-btn.voted .heart-outline { stroke: #fff; }

@keyframes heartPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* Completed state */
.completed {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 0.8rem; width: 100%; padding-top: 1rem;
}
.done-badge {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--moss); display: grid; place-items: center;
  animation: badgePop 0.5s ease;
}
.done-check { color: #fff; font-size: 1.8rem; font-style: normal; font-family: var(--font-label); }
@keyframes badgePop {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.completed h2 { font-size: 2rem; color: var(--moss); }
.done-sub { color: var(--brown); margin: 0; }
.results-title { margin-top: 1.2rem; }

.results-list {
  list-style: none; margin: 0.6rem 0 0; padding: 0;
  display: flex; flex-direction: column; gap: 0.5rem; width: 100%;
}
.results-list li {
  display: flex; align-items: center; gap: 0.8rem;
  background: rgba(244,236,220,0.86); border: 1px solid var(--line);
  border-radius: 12px; padding: 0.4rem 0.7rem;
}
.rank { width: 1.6rem; text-align: center; color: var(--gold); font-size: 0.9rem; }
.results-list img { width: 56px; height: 40px; object-fit: cover; border-radius: 6px; }
.rguest { flex: 1; font-size: 1.1rem; }
.rvotes { color: var(--clay); font-size: 0.8rem; }

/* Locked / empty */
.locked {
  flex: 1; text-align: center; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.8rem;
}
.locked .big { font-size: 2.2rem; color: var(--moss); }
.locked p { color: var(--brown); }
.empty { text-align: center; color: var(--brown); margin-top: 2rem; font-size: 1.1rem; }
</style>
