// storage.js — eine API, zwei Backends (lokal / Supabase).
import { EVENT } from '../config.js'
import { idb } from './db.js'
import { supabase, hasSupabase } from './supabase.js'

const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2))

const norm = (s) => s.trim().toLowerCase()

// ---------------------------------------------------------------- LOKAL
const localAdapter = {
  mode: 'local',

  async verifyPassword(pw) {
    return pw.trim() === EVENT.localPassword
  },

  async nameExists(name) {
    const guests = await idb.allGuests()
    return guests.some((g) => norm(g.name) === norm(name))
  },

  async joinAsGuest(name) {
    const guest = { id: uid(), name: name.trim(), createdAt: Date.now() }
    await idb.putGuest(guest)
    return guest
  },

  async savePhoto({ guestId, guestName, blob }) {
    const rec = { id: uid(), guestId, guestName, blob, takenAt: Date.now() }
    await idb.putPhoto(rec)
    return { id: rec.id, takenAt: rec.takenAt }
  },

  async listMyPhotos(guestId) {
    const rows = await idb.photosByGuest(guestId)
    return rows
      .sort((a, b) => a.takenAt - b.takenAt)
      .map((r) => ({ id: r.id, takenAt: r.takenAt, url: URL.createObjectURL(r.blob) }))
  },

  // Album-Vorschau (auch vor Reveal): Name + Cover + Anzahl
  async listAlbums() {
    const rows = await idb.allPhotos()
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
    const rows = await idb.allPhotos()
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
    return rows.map((r) => r.photoId)
  },
  async addVote(guestId, photoId) {
    await idb.putVote({ id: `${guestId}__${photoId}`, guestId, photoId, createdAt: Date.now() })
  },
  async removeVote(guestId, photoId) {
    await idb.delVote(`${guestId}__${photoId}`)
  },
  async voteCounts() {
    const rows = await idb.allVotes()
    const m = {}
    for (const r of rows) m[r.photoId] = (m[r.photoId] || 0) + 1
    return m
  },
}

// ------------------------------------------------------------- SUPABASE
const BUCKET = 'photos'
const supabaseAdapter = {
  mode: 'supabase',

  async verifyPassword(pw) {
    const { data, error } = await supabase.rpc('verify_event_password', {
      p_event_id: EVENT.id, p_password: pw.trim(),
    })
    if (error) throw error
    return data === true
  },

  async nameExists(name) {
    const { data, error } = await supabase
      .from('guests').select('id').eq('event_id', EVENT.id).ilike('name', name.trim()).limit(1)
    if (error) throw error
    return (data?.length || 0) > 0
  },

  async joinAsGuest(name) {
    const { data, error } = await supabase
      .from('guests').insert({ event_id: EVENT.id, name: name.trim() }).select('id, name').single()
    if (error) throw error
    return { id: data.id, name: data.name }
  },

  async savePhoto({ guestId, guestName, blob }) {
    const id = uid()
    const safe = guestName.replace(/[^\p{L}\p{N}_-]+/gu, '_')
    const path = `${EVENT.id}/${safe}/${id}.jpg`
    const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (up.error) throw up.error
    const { error } = await supabase.from('photos')
      .insert({ id, event_id: EVENT.id, guest_id: guestId, guest_name: guestName, storage_path: path })
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
    const { data, error } = await supabase.rpc('list_albums', { p_event_id: EVENT.id })
    if (error) throw error
    return (data || []).map((a) => ({ guestName: a.guest_name, count: a.count, cover: this._url(a.cover_path) }))
  },

  async listByGuest() {
    const { data, error } = await supabase
      .from('photos').select('id, guest_name, storage_path, created_at').eq('event_id', EVENT.id).order('created_at')
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

  async myVotes(guestId) {
    const { data, error } = await supabase.from('votes').select('photo_id').eq('guest_id', guestId)
    if (error) throw error
    return data.map((r) => r.photo_id)
  },
  async addVote(guestId, photoId) {
    const { error } = await supabase.from('votes').insert({ event_id: EVENT.id, guest_id: guestId, photo_id: photoId })
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
