<script setup>
import { ref, provide, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storage } from '../lib/storage.js'
import { setActiveWedding, activeWedding } from '../config.js'
import { applyColorScheme, resetColorScheme } from '../lib/colorSchemes.js'
import { useSession } from '../stores/session.js'

const route = useRoute()
const session = useSession()
const loading = ref(true)
const error = ref(null)

provide('wedding', activeWedding)

async function loadWedding(slug) {
  loading.value = true
  error.value = null
  try {
    const cfg = await storage.loadWeddingBySlug(slug)
    if (!cfg) {
      error.value = 'Hochzeit nicht gefunden.'
      loading.value = false
      return
    }
    setActiveWedding(cfg)
    applyColorScheme(activeWedding.colorScheme)
    session.restoreForWedding(slug)
  } catch (e) {
    error.value = 'Fehler beim Laden der Hochzeit.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, (slug) => {
  if (slug) loadWedding(slug)
}, { immediate: true })

onUnmounted(() => {
  resetColorScheme()
})
</script>

<template>
  <div v-if="loading" class="shell-loading">
    <p class="eyebrow">Wird geladen …</p>
  </div>
  <div v-else-if="error" class="shell-error">
    <h2 class="script">Oops</h2>
    <p>{{ error }}</p>
    <RouterLink to="/" class="btn btn-ghost">Zur Startseite</RouterLink>
  </div>
  <RouterView v-else />
</template>

<style scoped>
.shell-loading, .shell-error {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem; padding: 2rem; text-align: center;
}
.shell-error h2 { font-size: 2.4rem; color: var(--moss); }
.shell-error p { color: var(--brown); font-size: 1.1rem; }
</style>
