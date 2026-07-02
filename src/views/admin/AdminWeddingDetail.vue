<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storage } from '../../lib/storage.js'
import { FILTERS } from '../../lib/filters.js'
import { COLOR_SCHEMES } from '../../lib/colorSchemes.js'
import QRCode from 'qrcode'

const route = useRoute()
const weddingId = route.params.id
const wedding = ref(null)
const stats = ref({ guestCount: 0, photoCount: 0 })
const loading = ref(true)
const qrCanvas = ref(null)

function appUrl() {
  return `${window.location.origin}/${wedding.value?.slug || ''}`
}

onMounted(async () => {
  try {
    const all = await storage.listMyWeddings(null)
    wedding.value = all.find((w) => w.id === weddingId) || null
    if (wedding.value) {
      stats.value = await storage.getWeddingStats(weddingId)
      setTimeout(renderQR, 100)
    }
  } catch {}
  loading.value = false
})

async function renderQR() {
  if (!qrCanvas.value || !wedding.value) return
  await QRCode.toCanvas(qrCanvas.value, appUrl(), {
    width: 240, margin: 2,
    color: { dark: '#43512f', light: '#f4ecdc' },
  })
}

function copyLink() {
  navigator.clipboard.writeText(appUrl())
}

function downloadQR() {
  const a = document.createElement('a')
  a.href = qrCanvas.value.toDataURL('image/png')
  a.download = `${wedding.value.slug}-qr.png`
  a.click()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('de-AT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <main class="detail">
    <header>
      <RouterLink to="/admin" class="back stamp">← Dashboard</RouterLink>
    </header>

    <div v-if="loading" class="center">
      <p class="eyebrow">Lade …</p>
    </div>

    <div v-else-if="!wedding" class="center">
      <p>Hochzeit nicht gefunden.</p>
    </div>

    <template v-else>
      <h1 class="script title">{{ wedding.name }}</h1>
      <p class="stamp">{{ formatDate(wedding.date) }}</p>

      <div class="stats">
        <div class="stat">
          <span class="stat-num">{{ stats.guestCount }}</span>
          <span class="eyebrow">Gäste</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ stats.photoCount }}</span>
          <span class="eyebrow">Fotos</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ wedding.max_shots || wedding.maxShots || 36 }}</span>
          <span class="eyebrow">Max Shots</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="eyebrow">Filter</span>
          <span>{{ FILTERS[wedding.filter_id || wedding.filterId]?.label || 'Vintage' }}</span>
        </div>
        <div class="info-item">
          <span class="eyebrow">Farbschema</span>
          <span>{{ COLOR_SCHEMES[wedding.color_scheme || wedding.colorScheme]?.label || 'Herbst' }}</span>
        </div>
        <div class="info-item">
          <span class="eyebrow">Slug</span>
          <span class="stamp">{{ wedding.slug }}</span>
        </div>
      </div>

      <div class="qr-section">
        <h2 class="eyebrow">QR-Code & Link</h2>
        <div class="link-box">
          <code>{{ appUrl() }}</code>
          <button class="btn btn-ghost btn-sm" @click="copyLink">Kopieren</button>
        </div>
        <div class="qr-wrap">
          <canvas ref="qrCanvas"></canvas>
        </div>
        <button class="btn btn-gold" @click="downloadQR">QR als PNG laden</button>
      </div>

      <RouterLink :to="`/${wedding.slug}`" class="btn">Hochzeit öffnen</RouterLink>
    </template>
  </main>
</template>

<style scoped>
.detail {
  flex: 1; display: flex; flex-direction: column;
  padding: 1.4rem 1.4rem 2.4rem; max-width: 560px; margin: 0 auto; width: 100%; gap: 1.2rem;
}
.back { text-decoration: none; font-size: 0.75rem; }
.title { font-size: 2.6rem; color: var(--moss); }
.center { flex: 1; display: flex; align-items: center; justify-content: center; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; }
.stat {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px;
  padding: 1.2rem 0.6rem;
}
.stat-num { font-size: 1.8rem; font-weight: 600; color: var(--moss); font-style: normal; font-family: var(--font-label); }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.info-item {
  display: flex; flex-direction: column; gap: 0.2rem;
  background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem 1rem;
}
.info-item:last-child { grid-column: span 2; }

.qr-section {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding-top: 0.8rem; border-top: 1px solid var(--line);
}
.link-box {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem;
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
  width: 100%; word-break: break-all;
}
.link-box code { flex: 1; font-size: 0.85rem; font-family: var(--font-label); font-style: normal; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; }
.qr-wrap {
  background: var(--card); border-radius: 16px; padding: 1.2rem;
  box-shadow: 0 8px 20px rgba(58,44,29,0.14);
}
.btn { text-align: center; text-decoration: none; width: 100%; }
</style>
