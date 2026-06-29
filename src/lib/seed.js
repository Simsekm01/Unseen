import { hasSupabase } from './supabase.js'
import { idb } from './db.js'

const SEED_KEY = 'unseen-seeded'

export async function seedLocalDefaults() {
  if (hasSupabase) return
  if (localStorage.getItem(SEED_KEY)) return

  try {
    const existingAdmin = await idb.getAdminByUsername('admin')
    if (!existingAdmin) {
      await idb.putAdmin({
        id: 'seed-admin-001',
        username: 'admin',
        email: 'admin@unseen.local',
        password: 'admin123',
        createdAt: Date.now(),
      })
    }

    const existingWedding = await idb.getWeddingBySlug('kaycee-mustafa')
    if (!existingWedding) {
      await idb.putWedding({
        id: 'seed-wedding-001',
        slug: 'kaycee-mustafa',
        name: 'Kaycee & Mustafa',
        couple_a: 'Kaycee',
        couple_b: 'Mustafa',
        date: '2026-09-02',
        shoot_start: null,
        shoot_end: null,
        reveal_at: '2026-09-03T00:00:00',
        voting_enabled: true,
        voting_ends_at: '2026-09-06T00:00:00',
        max_shots: 36,
        filter_id: 'vintage',
        color_scheme: 'herbst',
        localPassword: 'liebe2026',
        owner_id: 'seed-admin-001',
        createdAt: Date.now(),
      })
    }

    localStorage.setItem(SEED_KEY, '1')
  } catch {
    // IndexedDB may not be available in some contexts
  }
}
