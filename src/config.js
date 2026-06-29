import { reactive } from 'vue'

export const DEFAULTS = {
  maxShots: 36,
  captureWidth: 2000,
  jpegQuality: 0.92,
  votesPerGuest: 3,
  filterId: 'vintage',
  colorScheme: 'herbst',
}

export const activeWedding = reactive({
  id: null,
  slug: null,
  name: null,
  coupleA: null,
  coupleB: null,
  date: null,
  shootStart: null,
  shootEnd: null,
  revealAt: null,
  votingEnabled: false,
  votingEndsAt: null,
  maxShots: DEFAULTS.maxShots,
  filterId: DEFAULTS.filterId,
  colorScheme: DEFAULTS.colorScheme,
  localPassword: 'liebe2026',
})

export function setActiveWedding(cfg) {
  Object.assign(activeWedding, {
    id: cfg.id,
    slug: cfg.slug,
    name: cfg.name,
    coupleA: cfg.couple_a ?? cfg.coupleA,
    coupleB: cfg.couple_b ?? cfg.coupleB,
    date: cfg.date ? new Date(cfg.date) : null,
    shootStart: cfg.shoot_start ? new Date(cfg.shoot_start) : null,
    shootEnd: cfg.shoot_end ? new Date(cfg.shoot_end) : null,
    revealAt: cfg.reveal_at ? new Date(cfg.reveal_at) : null,
    votingEnabled: cfg.voting_enabled ?? cfg.votingEnabled ?? false,
    votingEndsAt: cfg.voting_ends_at ? new Date(cfg.voting_ends_at) : null,
    maxShots: cfg.max_shots ?? cfg.maxShots ?? DEFAULTS.maxShots,
    filterId: cfg.filter_id ?? cfg.filterId ?? DEFAULTS.filterId,
    colorScheme: cfg.color_scheme ?? cfg.colorScheme ?? DEFAULTS.colorScheme,
    localPassword: cfg.localPassword ?? cfg.password ?? 'liebe2026',
  })
}

export function dateStamp(d) {
  const target = d || activeWedding.date || new Date()
  const dd = String(target.getDate()).padStart(2, '0')
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  const yy = String(target.getFullYear()).slice(2)
  return `${dd} · ${mm} · ${yy}`
}

export function isRevealed(now = new Date()) {
  return activeWedding.revealAt ? now >= activeWedding.revealAt : false
}

export function isShootingOpen(now = new Date()) {
  if (!activeWedding.shootStart && !activeWedding.shootEnd) return true
  if (activeWedding.shootStart && now < activeWedding.shootStart) return false
  if (activeWedding.shootEnd && now > activeWedding.shootEnd) return false
  return true
}

export function isVotingOpen(now = new Date()) {
  if (!activeWedding.votingEnabled) return false
  if (!isRevealed(now)) return false
  if (activeWedding.votingEndsAt && now > activeWedding.votingEndsAt) return false
  return true
}

export function shootStartLabel() {
  if (!activeWedding.shootStart) return null
  return activeWedding.shootStart.toLocaleString('de-AT', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function revealLabel() {
  if (!activeWedding.revealAt) return ''
  return activeWedding.revealAt.toLocaleString('de-AT', {
    day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}
