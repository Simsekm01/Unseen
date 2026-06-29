<script setup>
import { computed } from 'vue'

const props = defineProps({
  left: { type: Number, required: true },
  total: { type: Number, required: true },
})

const radius = 22
const circumference = 2 * Math.PI * radius
const fraction = computed(() => props.left / props.total)
const offset = computed(() => circumference * (1 - fraction.value))
const low = computed(() => props.left <= 3 && props.left > 0)
</script>

<template>
  <div class="arc-counter" :class="{ low, empty: left === 0 }">
    <svg viewBox="0 0 56 56" class="arc-svg">
      <circle cx="28" cy="28" :r="radius" class="track" />
      <circle cx="28" cy="28" :r="radius" class="fill"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset" />
    </svg>
    <span class="num">{{ left }}</span>
  </div>
</template>

<style scoped>
.arc-counter {
  position: relative;
  width: 56px; height: 56px;
  display: grid; place-items: center;
}

.arc-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}

.track {
  fill: none;
  stroke: var(--line);
  stroke-width: 3.5;
}

.fill {
  fill: none;
  stroke: var(--gold);
  stroke-width: 3.5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.num {
  font-family: var(--font-label);
  font-style: normal;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--ink);
  line-height: 1;
  z-index: 1;
}

.low .fill { stroke: var(--clay); }
.low .num { color: var(--clay); }
.low { animation: pulse 1.2s ease-in-out infinite; }

.empty .fill { stroke: var(--line); }
.empty .num { opacity: 0.4; }
.empty { animation: none; }

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
</style>
