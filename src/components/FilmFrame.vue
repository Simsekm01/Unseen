<script setup>
defineProps({
  src: { type: String, required: true },
  index: { type: Number, default: null },
})
</script>

<template>
  <figure class="ff">
<<<<<<< HEAD
    <div class="frame"><img :src="src" loading="lazy" alt="" /></div>
=======
    <div class="frame"><img :src="src" loading="lazy" decoding="async" alt="" /></div>
>>>>>>> cef553901371bf220774623f8c092096541acc20
    <figcaption v-if="index !== null" class="num stamp">№ {{ String(index).padStart(2, '0') }}</figcaption>
  </figure>
</template>

<style scoped>
.ff { margin: 0; }
.frame { transform: rotate(-0.6deg); }
.num { text-align: center; font-size: 0.62rem; margin-top: 5px; color: var(--brown); }
</style>
