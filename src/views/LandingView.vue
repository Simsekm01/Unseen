<script setup>
</script>

<template>
  <main class="landing">
    <div class="hero">
      <h1 class="script brand">Unseen</h1>
      <p class="subtitle">Deine Hochzeit. 36 Aufnahmen. Echte Momente.</p>
    </div>

    <p class="features stamp">Filmfilter · Einweg-Feeling · Alle Bilder nach der Feier</p>

    <RouterLink to="/admin" class="btn cta">Hochzeit erstellen</RouterLink>

    <footer class="foot stamp">Unseen · Hochzeitskamera</footer>
  </main>
</template>

<style scoped>
.landing {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 3rem 1.5rem; max-width: 520px;
  margin: 0 auto; width: 100%; gap: 2.2rem; min-height: 100dvh;
}

.hero { text-align: center; }

.brand {
  font-size: clamp(5rem, 22vw, 7.5rem);
  color: var(--moss);
  margin: 0;
  line-height: 0.9;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--brown);
  line-height: 1.5;
  margin: 1rem 0 0;
  max-width: 340px;
}

.features {
  font-size: 0.72rem;
  text-align: center;
  margin: 0;
  opacity: 0.8;
}

.cta {
  text-align: center;
  text-decoration: none;
  width: 100%;
  max-width: 300px;
  font-size: 1.05rem;
  padding: 1.1rem 2rem;
}

.foot {
  position: absolute;
  bottom: calc(1.4rem + env(safe-area-inset-bottom));
  font-size: 0.62rem;
  opacity: 0.5;
}
</style>
