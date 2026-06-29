import { applyVintage, applyLiveVintage } from './vintage.js'
import { applyBW, applyLiveBW } from './filters/bw.js'
import { applyFade, applyLiveFade } from './filters/fade.js'

export const FILTERS = {
  vintage: { label: 'Vintage', apply: applyVintage, live: applyLiveVintage },
  bw:      { label: 'Schwarz-Weiß', apply: applyBW, live: applyLiveBW },
  fade:    { label: 'Fade', apply: applyFade, live: applyLiveFade },
}

export function getFilter(id) {
  return FILTERS[id] || FILTERS.vintage
}
