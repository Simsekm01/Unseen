<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from './components/AppNav.vue'

const route = useRoute()
const showNav = computed(() => !route.meta.bare && route.params.slug)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <AppNav v-if="showNav" />
</template>
