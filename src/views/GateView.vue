<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { activeWedding } from '../config.js'
import { storage } from '../lib/storage.js'
import { useSession } from '../stores/session.js'

const router = useRouter()
const route = useRoute()
const session = useSession()
const slug = route.params.slug

const step = ref('pw')
const password = ref('')
const name = ref('')
const extra = ref('')
const error = ref('')
const busy = ref(false)

async function checkPassword() {
  error.value = ''
  busy.value = true
  try {
    const ok = await storage.verifyPassword(password.value)
    if (ok) step.value = 'name'
    else error.value = 'Das Passwort ist falsch. Es steht auf eurer Tischkarte.'
  } catch {
    error.value = 'Verbindung fehlgeschlagen. Bitte nochmal.'
  } finally {
    busy.value = false
  }
}

async function submitName() {
  if (name.value.trim().length < 2) {
    error.value = 'Bitte gib deinen Namen ein.'
    return
  }
  error.value = ''
  busy.value = true
  try {
    if (await storage.nameExists(name.value)) {
      step.value = 'distinguish'
      busy.value = false
      return
    }
    await join(name.value.trim())
  } catch {
    error.value = 'Beitritt fehlgeschlagen. Bitte nochmal.'
    busy.value = false
  }
}

async function submitDistinguished() {
  if (extra.value.trim().length < 1) {
    error.value = 'Bitte gib noch etwas dazu an (z.B. Nachname).'
    return
  }
  busy.value = true
  const full = `${name.value.trim()} ${extra.value.trim()}`
  try {
    if (await storage.nameExists(full)) {
      error.value = 'Diesen Namen gibt es auch schon — bitte etwas anderes.'
      busy.value = false
      return
    }
    await join(full)
  } catch {
    error.value = 'Beitritt fehlgeschlagen. Bitte nochmal.'
    busy.value = false
  }
}

async function join(finalName) {
  await session.join(finalName)
  router.replace(`/${slug}/shoot`)
}

function formatDate() {
  if (!activeWedding.date) return ''
  return activeWedding.date.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <main class="gate">
    <div class="top">
      <p class="eyebrow">Die Hochzeit von</p>
      <h1 class="names script">{{ activeWedding.coupleA }} &amp; {{ activeWedding.coupleB }}</h1>
      <p class="date stamp">{{ formatDate() }}</p>
    </div>

    <div class="card">
      <template v-if="step === 'pw'">
        <p class="lead">{{ activeWedding.maxShots }} Aufnahmen für dich. Fang die schönsten Momente ein — entwickelt werden alle Bilder nach der Feier.</p>
        <input class="field" v-model="password" type="password" placeholder="Passwort" autocomplete="off" @keyup.enter="checkPassword" />
        <button class="btn" :disabled="busy || !password" @click="checkPassword">Weiter</button>
      </template>

      <template v-else-if="step === 'name'">
        <p class="lead">Wie heißt du? Deine Fotos kommen später in dein eigenes Album.</p>
        <input class="field" v-model="name" type="text" placeholder="Dein Name" autocomplete="name" @keyup.enter="submitName" />
        <button class="btn" :disabled="busy" @click="submitName">Kamera öffnen</button>
      </template>

      <template v-else>
        <p class="lead">
          <strong>{{ name }}</strong> gibt es schon. Gib bitte noch etwas dazu, damit dein Album eindeutig ist.
        </p>
        <input class="field" v-model="extra" type="text" placeholder="z.B. Nachname oder Tischnummer" @keyup.enter="submitDistinguished" />
        <button class="btn" :disabled="busy" @click="submitDistinguished">Weiter als „{{ name }} {{ extra }}"</button>
      </template>

      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </main>
</template>

<style scoped>
.gate {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  gap: 2rem; padding: 2rem 1.5rem; max-width: 460px; margin: 0 auto; width: 100%;
}
.top { text-align: center; }
.names { font-size: clamp(3rem, 16vw, 4.6rem); color: var(--moss); margin: 0.6rem 0 0.4rem; }
.date { display: block; font-size: 0.9rem; }
.card {
  display: flex; flex-direction: column; gap: 1rem;
  background: rgba(244, 236, 220, 0.86); backdrop-filter: blur(6px);
  border: 1px solid var(--line); border-radius: 18px; padding: 1.6rem;
  box-shadow: 0 12px 30px rgba(58, 44, 29, 0.12);
}
.lead { margin: 0 0 0.2rem; color: var(--brown); line-height: 1.45; font-size: 1.12rem; }
.lead strong { color: var(--ink); }
.err {
  margin: 0; padding: 0.6rem 0.8rem; border-radius: 10px;
  background: rgba(169, 96, 63, 0.14); color: var(--clay);
  font-style: normal; font-family: var(--font-label); font-size: 0.9rem;
}
</style>
