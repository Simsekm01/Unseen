import { defineStore } from 'pinia'
import { activeWedding } from '../config.js'
import { storage } from '../lib/storage.js'

function storageKey(slug) {
  return slug ? `unseen-session-${slug}` : 'unseen-session'
}

function load(slug) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(slug))) || null
  } catch {
    return null
  }
}

export const useSession = defineStore('session', {
  state: () => ({
    guestId: null,
    guestName: null,
    shotsTaken: 0,
    weddingSlug: null,
  }),
  getters: {
    joined: (s) => Boolean(s.guestId),
    shotsLeft: (s) => Math.max(0, (activeWedding.maxShots || 36) - s.shotsTaken),
    rollEmpty: (s) => s.shotsTaken >= (activeWedding.maxShots || 36),
  },
  actions: {
    persist() {
      localStorage.setItem(
        storageKey(this.weddingSlug),
        JSON.stringify({
          guestId: this.guestId,
          guestName: this.guestName,
          shotsTaken: this.shotsTaken,
          weddingSlug: this.weddingSlug,
        }),
      )
    },
    restoreForWedding(slug) {
      const saved = load(slug)
      if (saved && saved.weddingSlug === slug) {
        this.guestId = saved.guestId
        this.guestName = saved.guestName
        this.shotsTaken = saved.shotsTaken || 0
        this.weddingSlug = slug
      }
    },
    async join(name) {
      const guest = await storage.joinAsGuest(name)
      this.guestId = guest.id
      this.guestName = guest.name
      this.shotsTaken = 0
      this.weddingSlug = activeWedding.slug
      this.persist()
    },
    countShot() {
      this.shotsTaken += 1
      this.persist()
    },
    leave() {
      const key = storageKey(this.weddingSlug)
      this.guestId = null
      this.guestName = null
      this.shotsTaken = 0
      this.weddingSlug = null
      localStorage.removeItem(key)
    },
  },
})
