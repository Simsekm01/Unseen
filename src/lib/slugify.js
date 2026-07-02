const UMLAUT_MAP = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUT_MAP[c])
    .replace(/&/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function uniqueSlug(name, isAvailable) {
  const base = slugify(name)
  if (await isAvailable(base)) return base
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`
    if (await isAvailable(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}
