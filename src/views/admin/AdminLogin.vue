<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdmin } from '../../stores/admin.js'
import { storage } from '../../lib/storage.js'

const router = useRouter()
const admin = useAdmin()

if (admin.loggedIn) router.replace('/admin')

const mode = ref('login')
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

const usernameAvailable = ref(null)
let debounceTimer = null

watch(username, (val) => {
  usernameAvailable.value = null
  if (mode.value !== 'register' || val.trim().length < 3) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    try {
      usernameAvailable.value = await storage.checkUsernameAvailable(val.trim())
    } catch {}
  }, 400)
})

async function login() {
  error.value = ''
  busy.value = true
  try {
    await admin.login(username.value.trim(), password.value)
    router.replace('/admin')
  } catch {
    error.value = 'Ungültiger Benutzername oder Passwort.'
  } finally {
    busy.value = false
  }
}

async function register() {
  if (username.value.trim().length < 3) {
    error.value = 'Benutzername muss mindestens 3 Zeichen haben.'
    return
  }
  if (!email.value.includes('@')) {
    error.value = 'Bitte gib eine gültige E-Mail an.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Passwort muss mindestens 6 Zeichen haben.'
    return
  }
  error.value = ''
  busy.value = true
  try {
    await admin.register(username.value.trim(), email.value.trim(), password.value)
    router.replace('/admin')
  } catch (e) {
    error.value = e.message || 'Registrierung fehlgeschlagen.'
  } finally {
    busy.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}
</script>

<template>
  <main class="admin-login">
    <div class="top">
      <RouterLink to="/" class="back stamp">← Unseen</RouterLink>
      <h1 class="script title">Admin</h1>
    </div>

    <div class="card">
      <h2 class="eyebrow">{{ mode === 'login' ? 'Anmelden' : 'Registrieren' }}</h2>

      <div class="field-group">
        <input class="field" v-model="username" type="text" placeholder="Benutzername"
          autocomplete="username" @keyup.enter="mode === 'login' ? login() : register()" />
        <p v-if="mode === 'register' && username.length >= 3" class="hint"
          :class="{ ok: usernameAvailable === true, taken: usernameAvailable === false }">
          {{ usernameAvailable === null ? 'Prüfe …' : usernameAvailable ? 'Verfügbar ✓' : 'Bereits vergeben ✗' }}
        </p>
      </div>

      <input v-if="mode === 'register'" class="field" v-model="email" type="email"
        placeholder="E-Mail" autocomplete="email" />

      <input class="field" v-model="password" type="password" placeholder="Passwort"
        autocomplete="current-password" @keyup.enter="mode === 'login' ? login() : register()" />

      <button class="btn" :disabled="busy" @click="mode === 'login' ? login() : register()">
        {{ mode === 'login' ? 'Anmelden' : 'Konto erstellen' }}
      </button>

      <p v-if="error" class="err">{{ error }}</p>

      <button class="toggle stamp" @click="toggleMode">
        {{ mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Anmelden' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.admin-login {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  gap: 1.6rem; padding: 2rem 1.5rem; max-width: 440px; margin: 0 auto; width: 100%;
}
.top { text-align: center; }
.back { display: inline-block; text-decoration: none; font-size: 0.75rem; margin-bottom: 0.6rem; }
.title { font-size: 3rem; color: var(--moss); }
.card {
  display: flex; flex-direction: column; gap: 1rem;
  background: rgba(244, 236, 220, 0.86); backdrop-filter: blur(6px);
  border: 1px solid var(--line); border-radius: 18px; padding: 1.6rem;
  box-shadow: 0 12px 30px rgba(58, 44, 29, 0.12);
}
.field-group { display: flex; flex-direction: column; gap: 0.3rem; }
.hint { margin: 0; font-family: var(--font-label); font-style: normal; font-size: 0.78rem; }
.hint.ok { color: var(--moss); }
.hint.taken { color: var(--clay); }
.err {
  margin: 0; padding: 0.6rem 0.8rem; border-radius: 10px;
  background: rgba(169, 96, 63, 0.14); color: var(--clay);
  font-style: normal; font-family: var(--font-label); font-size: 0.9rem;
}
.toggle {
  background: none; border: none; font-size: 0.78rem; cursor: pointer;
  text-align: center; padding: 0.4rem;
}
</style>
