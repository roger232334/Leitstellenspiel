import { gebietsTreffer } from '../data/gebiet.js'
import { lokalSuchen } from './lokaleOrtssuche.js'
const endpoint = import.meta.env?.VITE_AUTOCOMPLETE_URL || 'https://photon.komoot.io/api/'
const cache = new Map()

export function photonTreffer(feature) {
  const p = feature.properties || {}
  const ortsebene = ['city', 'town', 'village', 'municipality'].includes(p.osm_value) || p.type === 'city'
  const ortsteilsebene = ['suburb', 'quarter', 'neighbourhood', 'hamlet'].includes(p.osm_value) || ['district', 'locality'].includes(p.type)
  const strasse = p.street || (p.osm_key === 'highway' || p.type === 'street' ? p.name : '') || ''
  const ort = p.city || (ortsebene ? p.name : '') || ''
  const ortsteil = p.district || (ortsteilsebene ? p.name : '') || ''
  return {
    id: `${p.osm_type}-${p.osm_id}-${p.name}`,
    label: p.name || strasse || ort,
    detail: [...new Set([strasse, p.housenumber, ortsteil, p.postcode, ort, p.state].filter(Boolean))].join(', '),
    strasse, hausnummer: p.housenumber || '', ort, ortsteil,
    lat: feature.geometry?.coordinates?.[1], lng: feature.geometry?.coordinates?.[0],
    land: p.countrycode || p.country || '', bundesland: p.state || '', kreis: p.county || '', gemeinde: ort,
  }
}

export async function adressVorschlaege(text, feld, ort = '', signal, { onlineFallback = false } = {}) {
  if (text.trim().length < 3) return []
  signal?.throwIfAborted()
  const lokal = lokalSuchen(text, { feld, ort })
  if (lokal.length || !onlineFallback) return lokal
  const q = feld === 'strasse' ? [text.trim(), ort.trim()].filter(Boolean).join(', ') : text.trim()
  const key = `${feld}|${q.toLocaleLowerCase('de')}`
  if (cache.has(key)) return gebietsTreffer(cache.get(key))
  const params = new URLSearchParams({ q, lang: 'de', limit: '8', countrycode: 'DE' })
  for (const layer of feld === 'strasse' ? ['street', 'house'] : ['city', 'district', 'locality']) params.append('layer', layer)
  const response = await fetch(`${endpoint}?${params}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('Adressvorschläge nicht erreichbar')
  const data = await response.json()
  if (!Array.isArray(data.features)) throw new Error('Ungültige Adressvorschläge')
  const result = data.features.map(photonTreffer).filter(e => feld === 'strasse' ? e.strasse : e.ort || e.ortsteil)
  if (cache.size >= 100) cache.delete(cache.keys().next().value)
  cache.set(key, result)
  return gebietsTreffer(result)
}
