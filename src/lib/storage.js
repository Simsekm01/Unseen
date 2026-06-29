import { activeWedding, DEFAULTS } from '../config.js'
import { idb } from './db.js'
import { supabase, hasSupabase } from './supabase.js'

const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2))

const norm = (s) => s.trim().toLowerCase()

// ---------------------------------------------------------------- LOKAL
const localAdapter = {
  mode: 'local',

  // ---- Wedding-Lookup ----
  async loadWeddingBySlug(slug) {
    return idb.getWeddingBySlug(slug)
  },

  async createWedding(data) {
    const wedding = { id: uid(), ...data, createdAt: Date.now() }
    await idb.putWedding(wedding)
    return wedding
  },

  async listMyWeddings(adminId) {
    const all = await idb.allWeddings()
    return all.filter((w) => w.owner_id === adminId)
  },

  async checkSlugAvailable(slug) {
    const existing = await idb.getWeddingBySlug(slug)
    return !existing
  },

  async getWeddingStats(weddingId) {
    const guests = await idb.guestsByWedding(weddingId)
    const photos = await idb.photosByWedding(weddingId)
    return { guestCount: guests.length, photoCount: photos.length }
  },

  // ---- Admin Auth ----
  async adminRegister(username, email, password) {
    const existing = await idb.getAdminByUsername(username.toLowerCase())
    if (existing) throw new Error('Username bereits vergeben')
    const admin = { id: uid(), username: username.toLowerCase(), email, password, createdAt: Date.now() }
    await idb.putAdmin(admin)
    return { id: admin.id, username: admin.username, email: admin.email }
  },

  async adminLogin(username, password) {
    const admin = await idb.getAdminByUsername(username.toLowerCase())
    if (!admin || admin.password !== password) return null
    return { id: admin.id, username: admin.username, email: admin.email }
  },

  async checkUsernameAvailable(username) {
    const existing = await idb.getAdminByUsername(username.toLowerCase())
    return !existing
  },

  // ---- Guest Flow ----
  async verifyPassword(pw) {
    return pw.trim() === (activeWedding.localPassword || 'liebe2026')
  },

  async nameExists(name) {
    const guests = await idb.guestsByWedding(activeWedding.id)
    return guests.some((g) => norm(g.name) === norm(name))
  },

  async joinAsGuest(name) {
    const guest = { id: uid(), weddingId: activeWedding.id, name: name.trim(), createdAt: Date.now() }
    await idb.putGuest(guest)
    return guest
  },

  async savePhoto({ guestId, guestName, blob }) {
    const rec = { id: uid(), weddingId: activeWedding.id, guestId, guestName, blob, takenAt: Date.now() }
    await idb.putPhoto(rec)
    return { id: rec.id, takenAt: rec.takenAt }
  },

  async listMyPhotos(guestId) {
    const rows = await idb.photosByGuest(guestId)
    return rows
      .filter((r) => r.weddingId === activeWedding.id)
      .sort((a, b) => a.takenAt - b.takenAt)
      .map((r) => ({ id: r.id, takenAt: r.takenAt, url: URL.createObjectURL(r.blob) }))
  },

  async listAlbums() {
    const rows = await idb.photosByWedding(activeWedding.id)
    const map = new Map()
    for (const r of rows.sort((a, b) => a.takenAt - b.takenAt)) {
      if (!map.has(r.guestName)) map.set(r.guestName, { guestName: r.guestName, cover: r.blob, count: 0 })
      map.get(r.guestName).count++
    }
    return [...map.values()]
      .map((a) => ({ guestName: a.guestName, count: a.count, cover: URL.createObjectURL(a.cover) }))
      .sort((a, b) => a.guestName.localeCompare(b.guestName))
  },

  async listByGuest() {
    const rows = await idb.photosByWedding(activeWedding.id)
    const map = new Map()
    for (const r of rows) {
      if (!map.has(r.guestName)) map.set(r.guestName, [])
      map.get(r.guestName).push({ id: r.id, takenAt: r.takenAt, url: URL.createObjectURL(r.blob) })
    }
    return [...map.entries()]
      .map(([guestName, photos]) => ({ guestName, photos: photos.sort((a, b) => a.takenAt - b.takenAt) }))
      .sort((a, b) => a.guestName.localeCompare(b.guestName))
  },

  // ---- Voting ----
  async myVotes(guestId) {
    const rows = await idb.votesByGuest(guestId)
    return rows.filter((r) => r.weddingId === activeWedding.id).map((r) => r.photoId)
  },
  async addVote(guestId, photoId) {
    await idb.putVote({ id: `${guestId}__${photoId}`, weddingId: activeWedding.id, guestId, photoId, createdAt: Date.now() })
  },
  async removeVote(guestId, photoId) {
    await idb.delVote(`${guestId}__${photoId}`)
  },
  async voteCounts() {
    const rows = await idb.votesByWedding(activeWedding.id)
    const m = {}
    for (const r of rows) m[r.photoId] = (m[r.photoId] || 0) + 1
    return m
  },
}

// ------------------------------------------------------------- SUPABASE
const BUCKET = 'photos'
const supabaseAdapter = {
  mode: 'supabase',

  // ---- Wedding-Lookup ----
  async loadWeddingBySlug(slug) {
    const { data, error } = await supabase
      .from('weddings_public')
      .select('id, slug, name, couple_a, couple_b, date, shoot_start, shoot_end, reveal_at, voting_enabled, voting_ends_at, max_shots, filter_id, color_scheme')
      .eq('slug', slug)
      .single()
    if (error) return null
    return data
  },

  async createWedding(data) {
    const { data: id, error } = await supabase.rpc('create_wedding', {
      p_slug: data.slug,
      p_name: data.name,
      p_couple_a: data.couple_a,
      p_couple_b: data.couple_b,
      p_date: data.date,
      p_shoot_start: data.shoot_start || null,
      p_shoot_end: data.shoot_end || null,
      p_reveal_at: data.reveal_at,
      p_voting_enabled: data.voting_enabled || false,
      p_voting_ends_at: data.voting_ends_at || null,
      p_max_shots: data.max_shots || DEFAULTS.maxShots,
      p_filter_id: data.filter_id || DEFAULTS.filterId,
      p_color_scheme: data.color_scheme || DEFAULTS.colorScheme,
      p_password: data.password,
      p_owner_id: data.owner_id,
    })
    if (error) throw error
    return { id, ...data }
  },

  async listMyWeddings(adminId) {
    const { data, error } = await supabase
      .from('wedding_admins')
      .select('wedding_id')
      .eq('admin_id', adminId)
    if (error) throw error
    if (!data.length) return []
    const ids = data.map((r) => r.wedding_id)
    const { data: weddings, error: e2 } = await supabase
      .from('weddings')
      .select('id, slug, name, couple_a, couple_b, date, max_shots, filter_id, color_scheme')
      .in('id', ids)
      .order('date', { ascending: false })
    if (e2) throw e2
    return weddings || []
  },

  async checkSlugAvailable(slug) {
    const { data, error } = await supabase.rpc('check_slug_available', { p_slug: slug })
    if (error) throw error
    return data === true
  },

  async getWeddingStats(weddingId) {
    const { count: guestCount } = await supabase
      .from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId)
    const { count: photoCount } = await supabase
      .from('photos').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId)
    return { guestCount: guestCount || 0, photoCount: photoCount || 0 }
  },

  // ---- Admin Auth ----
  async adminRegister(username, email, password) {
    const { data, error } = await supabase.rpc('admin_register', {
      p_username: username, p_email: email, p_password: password,
    })
    if (error) throw error
    return { id: data, username, email }
  },

  async adminLogin(username, password) {
    const { data, error } = await supabase.rpc('admin_login', {
      p_username: username, p_password: password,
    })
    if (error) throw error
    return data
  },

  async checkUsernameAvailable(username) {
    const { data, error } = await supabase.rpc('check_username_available', { p_username: username })
    if (error) throw error
    return data === true
  },

  // ---- Guest Flow ----
  async verifyPassword(pw) {
    const { data, error } = await supabase.rpc('verify_wedding_password', {
      p_wedding_id: activeWedding.id, p_password: pw.trim(),
    })
    if (error) throw error
    return data === true
  },

  async nameExists(name) {
    const { data, error } = await supabase
      .from('guests').select('id').eq('wedding_id', activeWedding.id).ilike('name', name.trim()).limit(1)
    if (error) throw error
    return (data?.length || 0) > 0
  },

  async joinAsGuest(name) {
    const { data, error } = await supabase
      .from('guests').insert({ wedding_id: activeWedding.id, name: name.trim() }).select('id, name').single()
    if (error) throw error
    return { id: data.id, name: data.name }
  },

  async savePhoto({ guestId, guestName, blob }) {
    const id = uid()
    const safe = guestName.replace(/[^\p{L}\p{N}_-]+/gu, '_')
    const path = `${activeWedding.id}/${safe}/${id}.jpg`
    const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (up.error) throw up.error
    const { error } = await supabase.from('photos')
      .insert({ id, wedding_id: activeWedding.id, guest_id: guestId, guest_name: guestName, storage_path: path })
    if (error) throw error
    return { id, takenAt: Date.now() }
  },

  _url(path) { return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl },

  async listMyPhotos(guestId) {
    const { data, error } = await supabase
      .from('photos').select('id, storage_path, created_at').eq('guest_id', guestId).order('created_at')
    if (error) throw error
    return data.map((r) => ({ id: r.id, takenAt: +new Date(r.created_at), url: this._url(r.storage_path) }))
  },

  async listAlbums() {
    const { data, error } = await supabase.rpc('list_albums', { p_wedding_id: activeWedding.id })
    if (error) throw error
    return (data || []).map((a) => ({ guestName: a.guest_name, count: a.count, cover: this._url(a.cover_path) }))
  },

  async listByGuest() {
    const { data, error } = await supabase
      .from('photos').select('id, guest_name, storage_path, created_at').eq('wedding_id', activeWedding.id).order('created_at')
    if (error) throw error
    const map = new Map()
    for (const r of data) {
      if (!map.has(r.guest_name)) map.set(r.guest_name, [])
      map.get(r.guest_name).push({ id: r.id, takenAt: +new Date(r.created_at), url: this._url(r.storage_path) })
    }
    return [...map.entries()]
      .map(([guestName, photos]) => ({ guestName, photos }))
      .sort((a, b) => a.guestName.localeCompare(b.guestName))
  },

  // ---- Voting ----
  async myVotes(guestId) {
    const { data, error } = await supabase.from('votes').select('photo_id').eq('guest_id', guestId)
    if (error) throw error
    return data.map((r) => r.photo_id)
  },
  async addVote(guestId, photoId) {
    const { error } = await supabase.from('votes').insert({ wedding_id: activeWedding.id, guest_id: guestId, photo_id: photoId })
    if (error) throw error
  },
  async removeVote(guestId, photoId) {
    const { error } = await supabase.from('votes').delete().eq('guest_id', guestId).eq('photo_id', photoId)
    if (error) throw error
  },
  async voteCounts() {
    const { data, error } = await supabase.from('vote_counts').select('photo_id, votes')
    if (error) throw error
    const m = {}
    for (const r of data) m[r.photo_id] = r.votes
    return m
  },
}

export const storage = hasSupabase ? supabaseAdapter : localAdapter
export const STORAGE_MODE = storage.mode
