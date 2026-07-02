<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdmin } from '../../stores/admin.js'
import { storage } from '../../lib/storage.js'
import { slugify } from '../../lib/slugify.js'
import { FILTERS } from '../../lib/filters.js'
import { COLOR_SCHEMES, applyColorScheme, resetColorScheme } from '../../lib/colorSchemes.js'
import FilterPreview from '../../components/FilterPreview.vue'
import QRCode from 'qrcode'

const router = useRouter()
const admin = useAdmin()

const step = ref(1)
const totalSteps = 5
const busy = ref(false)
const error = ref('')

// Step 1 — Grunddaten
const weddingName = ref('')
const coupleA = ref('')
const coupleB = ref('')
const weddingDate = ref('')

const slugPreview = computed(() => slugify(weddingName.value || ''))
const origin = globalThis.location.origin

// Step 2 — Zeitfenster
const shootStart = ref('')
const shootEnd = ref('')
const revealAt = ref('')
const votingEnabled = ref(false)
const votingDays = ref(3)

// Step 3 — Kamera-Setup
const maxShots = ref(36)
const filterId = ref('vintage')

// Step 4 — Design
const colorScheme = ref('herbst')

// Step 5 — Passwort
const password = ref('')
const passwordConfirm = ref('')

const passwordStrength = computed(() => {
  const p = password.value
  if (p.length < 4) return { label: 'Zu kurz', level: 0 }
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  if (score <= 1) return { label: 'Schwach', level: 1 }
  if (score <= 3) return { label: 'Mittel', level: 2 }
  return { label: 'Stark', level: 3 }
})

// After creation
const created = ref(false)
const createdSlug = ref('')
const createdId = ref('')
const qrCanvas = ref(null)

function appUrl() {
  return `${origin}/${createdSlug.value}`
}

watch(colorScheme, (id) => {
  applyColorScheme(id)
})

function canNext() {
  if (step.value === 1) {
    return weddingName.value.trim() && coupleA.value.trim() && coupleB.value.trim() && weddingDate.value
  }
  if (step.value === 2) {
    return revealAt.value
  }
  if (step.value === 5) {
    return password.value.length >= 4 && password.value === passwordConfirm.value
  }
  return true
}

function next() {
  if (!canNext()) return
  error.value = ''
  step.value++
}

function back() {
  error.value = ''
  step.value--
}

async function create() {
  if (!canNext()) return
  error.value = ''
  busy.value = true

  try {
    const slug = slugPreview.value
    const available = await storage.checkSlugAvailable(slug)
    let finalSlug = slug
    if (!available) {
      for (let i = 2; i < 100; i++) {
        if (await storage.checkSlugAvailable(`${slug}-${i}`)) {
          finalSlug = `${slug}-${i}`
          break
        }
      }
    }

    const votingEndsAt = votingEnabled.value && revealAt.value
      ? new Date(new Date(revealAt.value).getTime() + votingDays.value * 86400000).toISOString()
      : null

    const data = {
      slug: finalSlug,
      name: weddingName.value.trim(),
      couple_a: coupleA.value.trim(),
      couple_b: coupleB.value.trim(),
      date: weddingDate.value,
      shoot_start: shootStart.value || null,
      shoot_end: shootEnd.value || null,
      reveal_at: revealAt.value,
      voting_enabled: votingEnabled.value,
      voting_ends_at: votingEndsAt,
      max_shots: maxShots.value,
      filter_id: filterId.value,
      color_scheme: colorScheme.value,
      password: password.value,
      owner_id: admin.adminId,
      localPassword: password.value,
    }

    const result = await storage.createWedding(data)
    createdSlug.value = finalSlug
    createdId.value = result.id
    created.value = true

    setTimeout(renderQR, 100)
  } catch (e) {
    error.value = e.message || 'Erstellen fehlgeschlagen.'
  } finally {
    busy.value = false
  }
}

async function renderQR() {
  if (!qrCanvas.value) return
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
  a.download = `${createdSlug.value}-qr.png`
  a.click()
}

onMounted(() => {
  resetColorScheme()
})
</script>

<template>
  <main class="wizard">
    <header class="head">
      <RouterLink to="/admin" class="back stamp">← Dashboard</RouterLink>
      <h1 class="script title">Neue Hochzeit</h1>
    </header>

    <!-- Success -->
    <div v-if="created" class="success">
      <h2 class="script">Erstellt!</h2>
      <p class="lead">Eure Hochzeit ist bereit. Teilt diesen Link mit euren Gästen:</p>

      <div class="link-box">
        <code>{{ appUrl() }}</code>
        <button class="btn btn-ghost btn-sm" @click="copyLink">Kopieren</button>
      </div>

      <div class="qr-wrap">
        <canvas ref="qrCanvas"></canvas>
        <p class="script qr-name">{{ weddingName }}</p>
      </div>

      <div class="success-actions">
        <button class="btn btn-gold" @click="downloadQR">QR als PNG laden</button>
        <RouterLink :to="`/admin/wedding/${createdId}`" class="btn btn-ghost">Einstellungen</RouterLink>
        <RouterLink :to="`/${createdSlug}`" class="btn">Hochzeit testen</RouterLink>
      </div>
    </div>

    <!-- Wizard Steps -->
    <template v-else>
      <div class="progress">
        <div v-for="s in totalSteps" :key="s" class="dot" :class="{ active: s === step, done: s < step }"></div>
      </div>

      <!-- Step 1: Grunddaten -->
      <div v-if="step === 1" class="step">
        <h2 class="eyebrow">Grunddaten</h2>
        <label class="lbl eyebrow">Name der Hochzeit</label>
        <input class="field" v-model="weddingName" placeholder="z.B. Anna & Ben" />
        <p v-if="slugPreview" class="slug-preview stamp">{{ origin }}/{{ slugPreview }}</p>

        <div class="row">
          <div class="col">
            <label class="lbl eyebrow">Vorname A</label>
            <input class="field" v-model="coupleA" placeholder="Anna" />
          </div>
          <div class="col">
            <label class="lbl eyebrow">Vorname B</label>
            <input class="field" v-model="coupleB" placeholder="Ben" />
          </div>
        </div>

        <label class="lbl eyebrow">Hochzeitsdatum</label>
        <input class="field" type="date" v-model="weddingDate" />
      </div>

      <!-- Step 2: Zeitfenster -->
      <div v-if="step === 2" class="step">
        <h2 class="eyebrow">Zeitfenster</h2>

        <label class="lbl eyebrow">Fotografieren von</label>
        <input class="field" type="datetime-local" v-model="shootStart" />

        <label class="lbl eyebrow">Fotografieren bis</label>
        <input class="field" type="datetime-local" v-model="shootEnd" />

        <p class="hint stamp">Leer lassen = keine Einschränkung</p>

        <label class="lbl eyebrow">Galerie öffnet</label>
        <input class="field" type="datetime-local" v-model="revealAt" />

        <div class="toggle-row">
          <label class="lbl eyebrow">Voting aktivieren</label>
          <button class="toggle-btn" :class="{ on: votingEnabled }" @click="votingEnabled = !votingEnabled">
            <span class="toggle-knob"></span>
          </button>
        </div>

        <div v-if="votingEnabled" class="vote-dur">
          <label class="lbl eyebrow">Abstimmung dauert</label>
          <div class="dur-row">
            <input class="field dur-input" type="number" min="1" max="30" v-model.number="votingDays" />
            <span class="stamp">Tage nach Galerie-Öffnung</span>
          </div>
        </div>
      </div>

      <!-- Step 3: Kamera-Setup -->
      <div v-if="step === 3" class="step">
        <h2 class="eyebrow">Kamera-Setup</h2>

        <label class="lbl eyebrow">Anzahl Fotos</label>
        <div class="slider-row">
          <input type="range" min="16" max="36" step="1" v-model.number="maxShots" class="slider" />
          <span class="shots-val stamp">{{ maxShots }} Aufnahmen</span>
        </div>
        <p class="hint stamp">{{ maxShots === 36 ? 'Wie eine echte Einwegkamera' : maxShots === 16 ? 'Wenige, besondere Momente' : '' }}</p>

        <label class="lbl eyebrow">Filter</label>
        <div class="filter-grid">
          <button v-for="(f, id) in FILTERS" :key="id"
            class="filter-tile" :class="{ selected: filterId === id }" @click="filterId = id">
            <FilterPreview :filter-id="id" :size="80" />
            <span class="stamp">{{ f.label }}</span>
          </button>
        </div>
      </div>

      <!-- Step 4: Design -->
      <div v-if="step === 4" class="step">
        <h2 class="eyebrow">Design</h2>

        <label class="lbl eyebrow">Farbschema</label>
        <div class="scheme-grid">
          <button v-for="(s, id) in COLOR_SCHEMES" :key="id"
            class="scheme-tile" :class="{ selected: colorScheme === id }" @click="colorScheme = id">
            <div class="scheme-preview" :style="{ background: s.bg, borderColor: s.primary }">
              <span class="scheme-name script" :style="{ color: s.primary }">{{ coupleA || 'A' }} & {{ coupleB || 'B' }}</span>
              <div class="scheme-dots">
                <span :style="{ background: s.primary }"></span>
                <span :style="{ background: s.secondary }"></span>
                <span :style="{ background: s.accent }"></span>
              </div>
            </div>
            <span class="stamp">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Step 5: Passwort -->
      <div v-if="step === 5" class="step">
        <h2 class="eyebrow">Zugangsdaten</h2>
        <p class="lead">Dieses Passwort geben eure Gäste ein, um die Kamera zu öffnen. Druckt es z.B. auf die Tischkarten.</p>

        <label class="lbl eyebrow">Passwort</label>
        <input class="field" type="text" v-model="password" placeholder="z.B. liebe2026" autocomplete="off" />

        <div v-if="password" class="strength">
          <div class="strength-bar">
            <div class="strength-fill" :class="`level-${passwordStrength.level}`"
              :style="{ width: (passwordStrength.level / 3 * 100) + '%' }"></div>
          </div>
          <span class="stamp">{{ passwordStrength.label }}</span>
        </div>

        <label class="lbl eyebrow">Passwort bestätigen</label>
        <input class="field" type="text" v-model="passwordConfirm" placeholder="Nochmal eingeben" autocomplete="off" />
        <p v-if="passwordConfirm && password !== passwordConfirm" class="err-hint stamp">Passwörter stimmen nicht überein</p>
      </div>

      <p v-if="error" class="err">{{ error }}</p>

      <div class="nav-btns">
        <button v-if="step > 1" class="btn btn-ghost" @click="back">Zurück</button>
        <span v-else></span>
        <button v-if="step < totalSteps" class="btn" :disabled="!canNext()" @click="next">Weiter</button>
        <button v-else class="btn btn-gold" :disabled="!canNext() || busy" @click="create">
          {{ busy ? 'Erstelle …' : 'Hochzeit erstellen' }}
        </button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.wizard {
  flex: 1; display: flex; flex-direction: column;
  padding: 1.4rem 1.4rem 2.4rem; max-width: 560px; margin: 0 auto; width: 100%; gap: 1.2rem;
}
.head { display: flex; flex-direction: column; }
.back { text-decoration: none; font-size: 0.75rem; margin-bottom: 0.4rem; }
.title { font-size: 2.4rem; color: var(--moss); }

.progress { display: flex; justify-content: center; gap: 0.6rem; }
.dot {
  width: 10px; height: 10px; border-radius: 50%; background: var(--paper-2);
  border: 2px solid var(--line); transition: all 0.2s;
}
.dot.active { background: var(--moss); border-color: var(--moss); transform: scale(1.2); }
.dot.done { background: var(--gold); border-color: var(--gold); }

.step {
  display: flex; flex-direction: column; gap: 0.9rem;
  background: rgba(244, 236, 220, 0.86); backdrop-filter: blur(6px);
  border: 1px solid var(--line); border-radius: 18px; padding: 1.4rem;
}
.lbl { display: block; font-size: 0.62rem; }
.lead { color: var(--brown); line-height: 1.4; font-size: 1rem; margin: 0; }
.hint { margin: 0; font-size: 0.72rem; opacity: 0.7; }
.slug-preview { font-size: 0.72rem; margin: -0.4rem 0 0; word-break: break-all; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.col { display: flex; flex-direction: column; gap: 0.3rem; }

/* Toggle */
.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-btn {
  width: 48px; height: 28px; border-radius: 14px; border: 2px solid var(--line);
  background: var(--paper-2); position: relative; cursor: pointer; padding: 0;
  transition: background 0.2s;
}
.toggle-btn.on { background: var(--moss); border-color: var(--moss); }
.toggle-knob {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: white; transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-btn.on .toggle-knob { transform: translateX(20px); }
.dur-row { display: flex; align-items: center; gap: 0.6rem; }
.dur-input { width: 70px; text-align: center; }

/* Slider */
.slider-row { display: flex; align-items: center; gap: 1rem; }
.slider { flex: 1; -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; background: var(--paper-2); }
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
  background: var(--gold); border: 3px solid var(--card); box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.shots-val { white-space: nowrap; font-size: 0.8rem; min-width: 110px; }

/* Filter tiles */
.filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; }
.filter-tile {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 0.8rem; border-radius: 14px; border: 2px solid var(--line);
  background: var(--card); cursor: pointer; transition: border-color 0.2s;
}
.filter-tile.selected { border-color: var(--moss); box-shadow: 0 0 0 2px var(--moss); }

/* Color scheme tiles */
.scheme-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
@media (min-width: 480px) { .scheme-grid { grid-template-columns: repeat(3, 1fr); } }
.scheme-tile {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 0.6rem; border-radius: 14px; border: 2px solid var(--line);
  background: var(--card); cursor: pointer; transition: border-color 0.2s;
}
.scheme-tile.selected { border-color: var(--moss); box-shadow: 0 0 0 2px var(--moss); }
.scheme-preview {
  width: 100%; aspect-ratio: 4/3; border-radius: 10px; border: 2px solid;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;
}
.scheme-name { font-size: clamp(0.9rem, 3vw, 1.2rem); }
.scheme-dots { display: flex; gap: 4px; }
.scheme-dots span { width: 12px; height: 12px; border-radius: 50%; }

/* Password strength */
.strength { display: flex; align-items: center; gap: 0.6rem; }
.strength-bar { flex: 1; height: 6px; border-radius: 3px; background: var(--paper-2); overflow: hidden; }
.strength-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.level-0, .level-1 { background: var(--clay); }
.level-2 { background: var(--gold); }
.level-3 { background: var(--moss); }
.err-hint { margin: -0.4rem 0 0; color: var(--clay); font-size: 0.75rem; }

.err {
  margin: 0; padding: 0.6rem 0.8rem; border-radius: 10px;
  background: rgba(169, 96, 63, 0.14); color: var(--clay);
  font-style: normal; font-family: var(--font-label); font-size: 0.9rem;
}

.nav-btns { display: flex; justify-content: space-between; gap: 1rem; }
.nav-btns .btn { min-width: 120px; text-align: center; }

/* Success */
.success {
  display: flex; flex-direction: column; align-items: center; gap: 1.4rem;
  text-align: center; padding: 1rem 0;
}
.success h2 { font-size: 3rem; color: var(--moss); }
.success .lead { color: var(--brown); max-width: 360px; }
.link-box {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem;
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
  width: 100%; word-break: break-all;
}
.link-box code { flex: 1; font-size: 0.85rem; font-family: var(--font-label); font-style: normal; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; }
.qr-wrap {
  background: var(--card); border-radius: 16px; padding: 1.4rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  box-shadow: 0 8px 20px rgba(58,44,29,0.14);
}
.qr-name { font-size: 1.6rem; color: var(--moss); }
.success-actions { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; max-width: 320px; }
.success-actions .btn { text-align: center; text-decoration: none; }
</style>
