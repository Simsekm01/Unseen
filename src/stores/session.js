import { defineStore } from 'pinia'
import { EVENT } from '../config.js'
import { storage } from '../lib/storage.js'

const KEY = 'km-session'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export const useSession = defineStore('session', {
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
  },
  actions: {
    persist() {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          guestId: this.guestId,
          guestName: this.guestName,
          shotsTaken: this.shotsTaken,
        }),
      )
    },
    async join(name) {
      const guest = await storage.joinAsGuest(name)
      this.guestId = guest.id
      this.guestName = guest.name
      this.shotsTaken = 0
      this.persist()
    },
    countShot() {
      this.shotsTaken += 1
      this.persist()
    },
    leave() {
      this.guestId = null
      this.guestName = null
      this.shotsTaken = 0
      localStorage.removeItem(KEY)
    },
  },
})
