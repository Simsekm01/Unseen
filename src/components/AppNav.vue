<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="nav">
    <RouterLink to="/shoot" class="tab"><span class="ic">◉</span><span>Kamera</span></RouterLink>
    <RouterLink to="/roll" class="tab"><span class="ic">❏</span><span>Album</span></RouterLink>
    <RouterLink to="/gallery" class="tab"><span class="ic">❖</span><span>Galerie</span></RouterLink>
    <RouterLink to="/games" class="tab"><span class="ic">♛</span><span>Spiele</span></RouterLink>
  </nav>
</template>

<style scoped>
.nav { position: sticky; bottom: 0; display: grid; grid-template-columns: repeat(4, 1fr);
  background: rgba(239, 230, 211, 0.92); backdrop-filter: blur(8px); border-top: 1px solid var(--line);
  padding: 0.4rem 0.3rem calc(0.4rem + env(safe-area-inset-bottom)); }
.tab { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0.5rem;
  text-decoration: none; color: var(--brown); font-family: var(--font-label); font-style: normal;
  font-size: 0.66rem; letter-spacing: 0.06em; border-radius: 12px; }
.tab .ic { font-size: 1.1rem; }
.tab.router-link-active { color: var(--moss); }
</style>
