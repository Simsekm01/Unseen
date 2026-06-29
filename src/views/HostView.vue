<script setup>
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'
import { EVENT } from '../config.js'
import { STORAGE_MODE } from '../lib/storage.js'

const url = ref(window.location.origin)
const canvas = ref(null)

async function render() {
  if (!canvas.value) return
  await QRCode.toCanvas(canvas.value, url.value || ' ', {
    width: 280, margin: 2,
    color: { dark: '#43512f', light: '#f4ecdc' },
  })
}
onMounted(render)
watch(url, render)

function download() {
  const a = document.createElement('a')
  a.href = canvas.value.toDataURL('image/png')
  a.download = 'kaycee-mustafa-qr.png'
  a.click()
}
</script>

<template>
  <main class="host">
    <header>
      <p class="eyebrow">Für die Organisation</p>
      <h2 class="script">QR-Code</h2>
    </header>

    <p class="lead">Auf die Tischkarten drucken. Gäste scannen, geben das Passwort ein und haben sofort ihre {{ EVENT.maxShots }} Aufnahmen.</p>

    <label class="lbl eyebrow">App-Adresse</label>
    <input class="field" v-model="url" placeholder="https://…" />

    <div class="qr-wrap">
      <canvas ref="canvas"></canvas>
      <p class="qrname script">Kaycee &amp; Mustafa</p>
    </div>

    <button class="btn btn-gold" @click="download">QR als PNG laden</button>

    <div class="mode">
      <p class="eyebrow">Aktueller Modus</p>
      <p>
        <strong :class="STORAGE_MODE">{{ STORAGE_MODE === 'supabase' ? 'Supabase (zentral)' : 'Lokal (nur dieses Gerät)' }}</strong>
        <span v-if="STORAGE_MODE === 'local'"> — fürs echte Event Supabase in der <code>.env</code> eintragen, sonst sieht jedes Handy nur seine eigenen Fotos.</span>
      </p>
    </div>

    <RouterLink to="/" class="back stamp">← zurück</RouterLink>
  </main>
</template>

<style scoped>
.host { flex: 1; padding: 1.6rem 1.4rem 2.4rem; max-width: 460px; margin: 0 auto; width: 100%; }
h2 { font-size: 2.4rem; color: var(--moss); margin-top: 0.1rem; }
.lead { color: var(--brown); line-height: 1.45; margin: 1rem 0 1.4rem; font-size: 1.1rem; }
.lbl { display: block; margin-bottom: 0.4rem; }
.qr-wrap { margin: 1.6rem auto; background: var(--card); border-radius: 16px; padding: 1.4rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem; width: fit-content; box-shadow: 0 8px 20px rgba(58,44,29,0.14); }
.qrname { font-size: 1.8rem; color: var(--moss); }
.btn { width: 100%; }
.mode { margin-top: 1.8rem; padding-top: 1.2rem; border-top: 1px solid var(--line); }
.mode p { color: var(--brown); line-height: 1.45; }
.mode strong.supabase { color: var(--moss); font-style: normal; }
.mode strong.local { color: var(--clay); font-style: normal; }
code { background: var(--paper-2); padding: 0.1rem 0.35rem; border-radius: 5px; font-size: 0.85em; font-style: normal; }
.back { display: block; text-align: center; margin-top: 1.6rem; text-decoration: none; font-size: 0.75rem; }
</style>
