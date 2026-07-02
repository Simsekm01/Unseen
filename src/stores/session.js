import { defineStore } from 'pinia'
<<<<<<< HEAD
import { EVENT } from '../config.js'
import { storage } from '../lib/storage.js'

const KEY = 'km-session'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
=======
import { activeWedding } from '../config.js'
import { storage } from '../lib/storage.js'

function storageKey(slug) {
  return slug ? `unseen-session-${slug}` : 'unseen-session'
}

function load(slug) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(slug))) || null
>>>>>>> cef553901371bf220774623f8c092096541acc20
  } catch {
    return null
  }
}

export const useSession = defineStore('session', {
<<<<<<< HEAD
  state: () => {
    const saved = load()
    return {
      guestId: saved?.guestId || null,
      guestName: saved?.guestName || null,
      shotsTaken: saved?.shotsTaken || 0,
    }
  },
  getters: {
    joined: (s) => Boolean(s.guestId),
    shotsLeft: (s) => Math.max(0, EVENT.maxShots - s.shotsTaken),
    rollEmpty: (s) => s.shotsTaken >= EVENT.maxShots,
=======
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
>>>>>>> cef553901371bf220774623f8c092096541acc20
  },
  actions: {
    persist() {
      localStorage.setItem(
<<<<<<< HEAD
        KEY,
=======
        storageKey(this.weddingSlug),
>>>>>>> cef553901371bf220774623f8c092096541acc20
        JSON.stringify({
          guestId: this.guestId,
          guestName: this.guestName,
          shotsTaken: this.shotsTaken,
<<<<<<< HEAD
        }),
      )
    },
=======
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
>>>>>>> cef553901371bf220774623f8c092096541acc20
    async join(name) {
      const guest = await storage.joinAsGuest(name)
      this.guestId = guest.id
      this.guestName = guest.name
      this.shotsTaken = 0
<<<<<<< HEAD
=======
      this.weddingSlug = activeWedding.slug
>>>>>>> cef553901371bf220774623f8c092096541acc20
      this.persist()
    },
    countShot() {
      this.shotsTaken += 1
      this.persist()
    },
    leave() {
<<<<<<< HEAD
      this.guestId = null
      this.guestName = null
      this.shotsTaken = 0
      localStorage.removeItem(KEY)
=======
      const key = storageKey(this.weddingSlug)
      this.guestId = null
      this.guestName = null
      this.shotsTaken = 0
      this.weddingSlug = null
      localStorage.removeItem(key)
>>>>>>> cef553901371bf220774623f8c092096541acc20
    },
  },
})
