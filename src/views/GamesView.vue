<script setup>
import { useRouter } from 'vue-router'
import { GAMES } from '../config.js'

const router = useRouter()
const now = new Date()
const isOpen = (g) => now >= g.unlocksAt
const opensLabel = (g) =>
  g.unlocksAt.toLocaleString('de-AT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })

function go(g) { if (isOpen(g)) router.push(g.route) }
</script>

<template>
  <main class="games">
    <header class="head">
      <p class="eyebrow">Zum Mitmachen</p>
      <h2 class="script">Spiele</h2>
    </header>

    <ul class="list">
      <li v-for="g in GAMES" :key="g.id" class="game" :class="{ locked: !isOpen(g) }" @click="go(g)">
        <div class="body">
          <h3>{{ g.title }}</h3>
          <p>{{ g.blurb }}</p>
        </div>
        <div class="state stamp">
          <template v-if="isOpen(g)">Spielen →</template>
          <template v-else>🔒 ab {{ opensLabel(g) }}</template>
        </div>
      </li>
    </ul>

    <p class="hint">Weitere Spiele folgen.</p>
  </main>
</template>

<style scoped>
.games { flex: 1; padding: 1.4rem 1.2rem 2rem; max-width: 560px; margin: 0 auto; width: 100%; }
.head { text-align: center; margin-bottom: 1.4rem; }
.head h2 { font-size: 2.6rem; color: var(--moss); margin-top: 0.1rem; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
.game { background: rgba(244,236,220,0.88); border: 1px solid var(--line); border-radius: 16px;
  padding: 1.1rem 1.2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  cursor: pointer; box-shadow: 0 6px 16px rgba(58,44,29,0.1); transition: transform 0.12s ease; }
.game:active { transform: scale(0.99); }
.game.locked { cursor: default; opacity: 0.92; }
.game h3 { font-size: 1.6rem; color: var(--ink); }
.game p { margin: 0.15rem 0 0; color: var(--brown); }
.state { font-size: 0.7rem; text-align: right; flex: none; color: var(--moss); }
.game.locked .state { color: var(--brown); }
.hint { text-align: center; margin-top: 1.4rem; color: var(--brown); opacity: 0.7; font-size: 0.95rem; }
</style>
