<script setup>
defineProps({
  left: { type: Number, required: true },
  total: { type: Number, required: true },
})
</script>

<template>
  <div class="counter">
    <span class="digits">{{ left }}</span>
    <span class="of stamp">/ {{ total }}</span>
  </div>
</template>

<style scoped>
.counter { display: inline-flex; align-items: baseline; gap: 0.35rem;
  background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 0.3rem 0.9rem; }
.digits { font-family: var(--font-serif); font-style: italic; font-weight: 600; font-size: 1.8rem; color: var(--clay); line-height: 1; }
.of { font-size: 0.72rem; }
</style>
