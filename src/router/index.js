<<<<<<< HEAD
import { createRouter, createWebHashHistory } from 'vue-router'
import { useSession } from '../stores/session.js'

=======
import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '../stores/session.js'
import { useAdmin } from '../stores/admin.js'

import LandingView from '../views/LandingView.vue'
import WeddingShell from '../views/WeddingShell.vue'
>>>>>>> cef553901371bf220774623f8c092096541acc20
import GateView from '../views/GateView.vue'
import ShootView from '../views/ShootView.vue'
import RollView from '../views/RollView.vue'
import GalleryView from '../views/GalleryView.vue'
<<<<<<< HEAD
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
=======
import VoteGame from '../views/VoteGame.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminNewWedding from '../views/admin/AdminNewWedding.vue'
import AdminWeddingDetail from '../views/admin/AdminWeddingDetail.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingView, meta: { bare: true } },

  // Admin-Bereich
  { path: '/admin/login', name: 'admin-login', component: AdminLogin, meta: { bare: true, admin: true } },
  { path: '/admin', name: 'admin-dashboard', component: AdminDashboard, meta: { bare: true, admin: true, requiresAdmin: true } },
  { path: '/admin/new', name: 'admin-new', component: AdminNewWedding, meta: { bare: true, admin: true, requiresAdmin: true } },
  { path: '/admin/wedding/:id', name: 'admin-detail', component: AdminWeddingDetail, meta: { bare: true, admin: true, requiresAdmin: true } },

  // Hochzeits-Routen (slug-basiert)
  {
    path: '/:slug',
    component: WeddingShell,
    children: [
      { path: '', name: 'gate', component: GateView, meta: { bare: true } },
      { path: 'shoot', name: 'shoot', component: ShootView, meta: { requiresGuest: true } },
      { path: 'roll', name: 'roll', component: RollView, meta: { requiresGuest: true } },
      { path: 'gallery', name: 'gallery', component: GalleryView, meta: { requiresGuest: true } },
      { path: 'voting', name: 'voting', component: VoteGame, meta: { requiresGuest: true } },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  // Admin-Guard
  if (to.meta.requiresAdmin) {
    const admin = useAdmin()
    if (!admin.loggedIn) return { name: 'admin-login' }
  }

  // Guest-Guard
  if (to.meta.requiresGuest) {
    const session = useSession()
    const slug = to.params.slug
    if (!session.joined || session.weddingSlug !== slug) {
      return { name: 'gate', params: { slug } }
    }
  }

>>>>>>> cef553901371bf220774623f8c092096541acc20
  return true
})

export default router
