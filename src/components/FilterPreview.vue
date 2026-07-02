<script setup>
import { ref, onMounted, watch } from 'vue'
import { FILTERS } from '../lib/filters.js'

const props = defineProps({
  filterId: { type: String, required: true },
  size: { type: Number, default: 120 },
})

const canvasRef = ref(null)

function drawDummyFrame(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#c4a882')
  grad.addColorStop(0.3, '#8faa7b')
  grad.addColorStop(0.6, '#d4a574')
  grad.addColorStop(1, '#7a9ab5')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,240,220,0.3)'
  ctx.beginPath()
  ctx.ellipse(w * 0.6, h * 0.4, w * 0.25, h * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = props.size
  const h = Math.round(w * 1.4)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  drawDummyFrame(ctx, w, h)

  const filter = FILTERS[props.filterId]
  if (filter?.live) {
    filter.live(ctx, w, h)
  }
}

onMounted(render)
watch(() => props.filterId, render)
</script>

<template>
  <canvas ref="canvasRef" class="filter-preview" :style="{ width: size + 'px', height: Math.round(size * 1.4) + 'px' }" />
</template>

<style scoped>
.filter-preview {
  border-radius: 8px;
  display: block;
}
</style>
