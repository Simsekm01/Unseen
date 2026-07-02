import { createRouter, createWebHashHistory } from 'vue-router'
import { useSession } from '../stores/session.js'

import GateView from '../views/GateView.vue'
import ShootView from '../views/ShootView.vue'
import RollView from '../views/RollView.vue'
import GalleryView from '../views/GalleryView.vue'
import GamesView from '../views/GamesView.vue'
import VoteGame from '../views/VoteGame.vue'
import HostView from '../views/HostView.vue'

const g = { requiresGuest: true }
const routes = [
  { path: '/', name: 'gate', component: GateView, meta: { bare: true } },
  { path: '/shoot', component: ShootView, meta: g },
  { path: '/roll', component: RollView, meta: g },
  { path: '/gallery', component: GalleryView, meta: g },
  { path: '/games', component: GamesView, meta: g },
  { path: '/games/vote', component: VoteGame, meta: g },
  { path: '/host', component: HostView, meta: { bare: true } },
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to) => {
  const session = useSession()
  if (to.meta.requiresGuest && !session.joined) return { path: '/' }
  if (to.path === '/' && session.joined) return { path: '/shoot' }
  return true
})

export default router
