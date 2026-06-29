const DB_NAME = 'unseen-platform'
const DB_VERSION = 3

let dbPromise = null

function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('weddings')) {
        const ws = db.createObjectStore('weddings', { keyPath: 'id' })
        ws.createIndex('slug', 'slug', { unique: true })
      }
      if (!db.objectStoreNames.contains('admins')) {
        const as = db.createObjectStore('admins', { keyPath: 'id' })
        as.createIndex('username', 'username', { unique: true })
      }
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' })
        s.createIndex('guestId', 'guestId', { unique: false })
        s.createIndex('weddingId', 'weddingId', { unique: false })
      }
      if (!db.objectStoreNames.contains('guests')) {
        const gs = db.createObjectStore('guests', { keyPath: 'id' })
        gs.createIndex('weddingId', 'weddingId', { unique: false })
      }
      if (!db.objectStoreNames.contains('votes')) {
        const v = db.createObjectStore('votes', { keyPath: 'id' })
        v.createIndex('guestId', 'guestId', { unique: false })
        v.createIndex('photoId', 'photoId', { unique: false })
        v.createIndex('weddingId', 'weddingId', { unique: false })
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

function getOne(store, key) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const os = db.transaction(store).objectStore(store)
        const req = os.get(key)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      }),
  )
}

function getByIndex(store, index, key) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const os = db.transaction(store).objectStore(store)
        const req = os.index(index).get(key)
        req.onsuccess = () => resolve(req.result || null)
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
  // Weddings
  putWedding: (w) => put('weddings', w),
  getWedding: (id) => getOne('weddings', id),
  getWeddingBySlug: (slug) => getByIndex('weddings', 'slug', slug),
  allWeddings: () => getAll('weddings'),

  // Admins
  putAdmin: (a) => put('admins', a),
  getAdmin: (id) => getOne('admins', id),
  getAdminByUsername: (u) => getByIndex('admins', 'username', u),
  allAdmins: () => getAll('admins'),

  // Guests
  putGuest: (g) => put('guests', g),
  allGuests: () => getAll('guests'),
  guestsByWedding: (weddingId) => getAll('guests', 'weddingId', weddingId),

  // Photos
  putPhoto: (p) => put('photos', p),
  allPhotos: () => getAll('photos'),
  photosByGuest: (guestId) => getAll('photos', 'guestId', guestId),
  photosByWedding: (weddingId) => getAll('photos', 'weddingId', weddingId),

  // Votes
  putVote: (v) => put('votes', v),
  delVote: (id) => del('votes', id),
  allVotes: () => getAll('votes'),
  votesByGuest: (guestId) => getAll('votes', 'guestId', guestId),
  votesByWedding: (weddingId) => getAll('votes', 'weddingId', weddingId),
}
