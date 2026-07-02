// db.js — IndexedDB-Wrapper fuer den LOKALEN Modus.
const DB_NAME = 'km-disposable'
const DB_VERSION = 2

let dbPromise = null

function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' })
        s.createIndex('guestId', 'guestId', { unique: false })
      }
      if (!db.objectStoreNames.contains('guests')) {
        db.createObjectStore('guests', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('votes')) {
        const v = db.createObjectStore('votes', { keyPath: 'id' })
        v.createIndex('guestId', 'guestId', { unique: false })
        v.createIndex('photoId', 'photoId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function getAll(store, index, key) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const os = db.transaction(store).objectStore(store)
        const src = index ? os.index(index) : os
        const req = key !== undefined ? src.getAll(key) : src.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}
function put(store, value) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, 'readwrite')
        t.objectStore(store).put(value)
        t.oncomplete = () => resolve(value)
        t.onerror = () => reject(t.error)
      }),
  )
}
function del(store, key) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, 'readwrite')
        t.objectStore(store).delete(key)
        t.oncomplete = () => resolve()
        t.onerror = () => reject(t.error)
      }),
  )
}

export const idb = {
  putGuest: (g) => put('guests', g),
  allGuests: () => getAll('guests'),
  putPhoto: (p) => put('photos', p),
  allPhotos: () => getAll('photos'),
  photosByGuest: (guestId) => getAll('photos', 'guestId', guestId),
  putVote: (v) => put('votes', v),
  delVote: (id) => del('votes', id),
  allVotes: () => getAll('votes'),
  votesByGuest: (guestId) => getAll('votes', 'guestId', guestId),
}
