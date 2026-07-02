// Zentrale Konfiguration des Events.

export const EVENT = {
  id: import.meta.env.VITE_EVENT_ID || 'kaycee-mustafa',

  coupleA: 'Kaycee',
  coupleB: 'Mustafa',

  weddingDate: new Date('2026-09-02T00:00:00'),

  // Galerie & Spiele oeffnen um 00:00 am 3.9.
  revealAt: new Date('2026-09-03T00:00:00'),

  maxShots: 36,

  // Foto-Qualitaet
  captureWidth: 2000, // Aufloesung der Langseite in px
  jpegQuality: 0.92,

  // Voting
  votesPerGuest: 3,

  // Lokaler Modus: gemeinsames Event-Passwort
  localPassword: 'liebe2026',
}

// Spiele-Registry — hier spaeter neue Spiele anhaengen.
export const GAMES = [
  {
    id: 'vote',
    title: 'Bestes Bild',
    blurb: 'Stimme fuer deine drei Lieblingsfotos.',
    route: '/games/vote',
    unlocksAt: EVENT.revealAt,
  },
]

export function dateStamp(d = EVENT.weddingDate) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${dd} · ${mm} · ${yy}`
}

export function isRevealed(now = new Date()) {
  return now >= EVENT.revealAt
}

export function revealLabel() {
  return EVENT.revealAt.toLocaleString('de-AT', {
    day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}
