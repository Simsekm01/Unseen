export const COLOR_SCHEMES = {
  herbst: {
    label: 'Herbst',
    primary: '#5d6b43',
    secondary: '#6f4f30',
    accent: '#b58a45',
    bg: '#efe6d3',
    card: '#f4ecdc',
  },
  elegant: {
    label: 'Elegant',
    primary: '#2c3e50',
    secondary: '#8e6c3e',
    accent: '#c9b07a',
    bg: '#f0ece4',
    card: '#faf7f2',
  },
  romantik: {
    label: 'Romantik',
    primary: '#8b3a52',
    secondary: '#c4857a',
    accent: '#e8c4b8',
    bg: '#fdf0ee',
    card: '#fff7f5',
  },
  modern: {
    label: 'Modern',
    primary: '#1a1a2e',
    secondary: '#4a4a6a',
    accent: '#e94560',
    bg: '#f5f5f5',
    card: '#ffffff',
  },
  sommer: {
    label: 'Sommer',
    primary: '#2d6a4f',
    secondary: '#74c69d',
    accent: '#f4a261',
    bg: '#f0faf5',
    card: '#ffffff',
  },
}

function darken(hex, amount = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = 1 - amount
  return `#${Math.round(r * f).toString(16).padStart(2, '0')}${Math.round(g * f).toString(16).padStart(2, '0')}${Math.round(b * f).toString(16).padStart(2, '0')}`
}

function lighten(hex, amount = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = amount
  return `#${Math.round(r + (255 - r) * f).toString(16).padStart(2, '0')}${Math.round(g + (255 - g) * f).toString(16).padStart(2, '0')}${Math.round(b + (255 - b) * f).toString(16).padStart(2, '0')}`
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function applyColorScheme(schemeId) {
  const scheme = COLOR_SCHEMES[schemeId] || COLOR_SCHEMES.herbst
  const root = document.documentElement

  root.style.setProperty('--moss', scheme.primary)
  root.style.setProperty('--olive', lighten(scheme.primary, 0.1))
  root.style.setProperty('--brown', scheme.secondary)
  root.style.setProperty('--gold', scheme.accent)
  root.style.setProperty('--paper', scheme.bg)
  root.style.setProperty('--card', scheme.card)
  root.style.setProperty('--ink', darken(scheme.primary, 0.15))
  root.style.setProperty('--paper-2', darken(scheme.bg, 0.05))
  root.style.setProperty('--clay', darken(scheme.accent, 0.2))
  root.style.setProperty('--line', hexToRgba(darken(scheme.primary, 0.1), 0.16))

  document.body.style.background = `linear-gradient(${hexToRgba(scheme.bg, 0.78)}, ${hexToRgba(scheme.bg, 0.9)}), url('/background.jpg'), url('/background.svg')`
  document.body.style.backgroundColor = darken(scheme.bg, 0.05)
}

export function resetColorScheme() {
  applyColorScheme('herbst')
}
