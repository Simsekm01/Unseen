<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdmin } from '../../stores/admin.js'
import { storage } from '../../lib/storage.js'

const router = useRouter()
const admin = useAdmin()
const weddings = ref([])
const stats = ref({})
const loading = ref(true)

const loadError = ref('')

onMounted(async () => {
  try {
    weddings.value = await storage.listMyWeddings(admin.adminId)
    for (const w of weddings.value) {
      stats.value[w.id] = await storage.getWeddingStats(w.id)
    }
  } catch {
    loadError.value = 'Hochzeiten konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
})

function logout() {
  admin.logout()
  router.replace('/admin/login')
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <main class="dashboard">
    <header class="head">
      <div>
        <p class="eyebrow">Admin-Dashboard</p>
        <h1 class="script title">Unseen</h1>
      </div>
      <div class="head-right">
        <span class="stamp user">{{ admin.adminName }}</span>
        <button class="btn btn-ghost btn-sm" @click="logout">Abmelden</button>
      </div>
    </header>

    <div v-if="loading" class="center">
      <p class="eyebrow">Lade Hochzeiten …</p>
    </div>

    <div v-else-if="loadError" class="center">
      <p style="color: var(--clay); font-family: var(--font-label); font-style: normal;">{{ loadError }}</p>
    </div>

    <div v-else-if="weddings.length === 0" class="empty">
      <p>Du hast noch keine Hochzeiten erstellt.</p>
    </div>

    <div v-else class="list">
      <RouterLink v-for="w in weddings" :key="w.id" :to="`/admin/wedding/${w.id}`" class="wedding-card">
        <div class="wc-main">
          <h3>{{ w.name }}</h3>
          <p class="stamp">{{ formatDate(w.date) }}</p>
        </div>
        <div class="wc-stats stamp">
          <span>{{ stats[w.id]?.guestCount || 0 }} Gäste</span>
          <span>{{ stats[w.id]?.photoCount || 0 }} Fotos</span>
        </div>
      </RouterLink>
    </div>

    <RouterLink to="/admin/new" class="btn new-btn">+ Neue Hochzeit erstellen</RouterLink>
    <RouterLink to="/" class="back stamp">← Zur Startseite</RouterLink>
  </main>
</template>

<style scoped>
.dashboard {
  flex: 1; display: flex; flex-direction: column;
  padding: 1.6rem 1.4rem 2.4rem; max-width: 600px; margin: 0 auto; width: 100%; gap: 1.4rem;
}
.head { display: flex; align-items: flex-start; justify-content: space-between; }
.title { font-size: 2.4rem; color: var(--moss); margin-top: 0.1rem; }
.head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
.user { font-size: 0.8rem; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; }
.center, .empty { flex: 1; display: flex; align-items: center; justify-content: center; }
.empty p { color: var(--brown); font-size: 1.1rem; }
.list { display: flex; flex-direction: column; gap: 0.8rem; }
.wedding-card {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px;
  padding: 1.2rem 1.4rem; text-decoration: none; color: inherit;
  transition: transform 0.1s ease;
}
.wedding-card:active { transform: scale(0.98); }
.wc-main h3 { font-size: 1.15rem; color: var(--moss); margin-bottom: 0.2rem; }
.wc-main p { font-size: 0.75rem; }
.wc-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; font-size: 0.72rem; }
.new-btn { text-align: center; text-decoration: none; margin-top: 0.4rem; }
.back { display: block; text-align: center; text-decoration: none; font-size: 0.75rem; margin-top: 0.6rem; }
</style>
