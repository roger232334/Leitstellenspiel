import { gebietsTreffer } from '../data/gebiet.js'
import { lokalSuchen } from './lokaleOrtssuche.js'
const CACHE_KEY = 'leitstellensimulator-ortssuche-v3'
const endpoint = import.meta.env?.VITE_GEOCODING_URL || 'https://nominatim.openstreetmap.org/search'
let letzteAnfrage = 0
let warteschlange = Promise.resolve()
let cache = {}
try {
  const gespeichert = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  if (gespeichert && typeof gespeichert === 'object' && !Array.isArray(gespeichert)) cache = gespeichert
} catch { /* Der Cache ist optional. */ }

export function ortTrefferAufbereiten(treffer) {
  const adresse = treffer.address || {}
  const objekt = ['amenity', 'building', 'shop', 'tourism', 'leisure', 'office', 'historic'].includes(treffer.class)
  return {
    id: `${treffer.osm_type || ''}-${treffer.osm_id || treffer.place_id}`,
    displayName: treffer.display_name,
    objekt: objekt ? (treffer.name || adresse[treffer.type] || '') : '',
    strasse: adresse.road || adresse.pedestrian || adresse.residential || adresse.footway || '',
    hausnummer: adresse.house_number || '',
    ort: adresse.city || adresse.town || adresse.village || adresse.municipality || '',
    ortsteil: adresse.suburb || adresse.quarter || adresse.city_district || adresse.neighbourhood || adresse.hamlet || '',
    lat: Number(treffer.lat),
    lng: Number(treffer.lon),
    land: adresse.country_code || adresse.country || '', bundesland: adresse.state || '', kreis: adresse.county || '',
    gemeinde: adresse.city || adresse.town || adresse.village || adresse.municipality || '',
  }
}

// Nur ausdrücklich ausgelöste Suchen, keine Anfragen beim Tippen.
export function orteSuchen(text, { onlineFallback = false } = {}) {
  const suchtext = text.trim()
  if (!suchtext) return Promise.resolve([])
  const lokal = lokalSuchen(suchtext)
  if (lokal.length || !onlineFallback) return Promise.resolve(lokal)
  const key = `${endpoint}|${suchtext.toLocaleLowerCase('de')}`
  const anfrage = warteschlange.then(async () => {
    if (Array.isArray(cache[key])) return gebietsTreffer(cache[key])
    const pause = Math.max(0, 1100 - (Date.now() - letzteAnfrage))
    if (pause) await new Promise(resolve => setTimeout(resolve, pause))
    letzteAnfrage = Date.now()
    const parameter = new URLSearchParams({
      q: suchtext, format: 'jsonv2', addressdetails: '1', limit: '8',
      countrycodes: 'de', 'accept-language': 'de',
    })
    const response = await fetch(`${endpoint}?${parameter}`, {
      headers: { Accept: 'application/json' },
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error(`Ortssuche fehlgeschlagen: HTTP ${response.status}`)
    const daten = await response.json()
    if (!Array.isArray(daten)) throw new Error('Ungültige Antwort der Ortssuche')
    const ergebnisse = daten.map(ortTrefferAufbereiten)
      .filter(t => Number.isFinite(t.lat) && Number.isFinite(t.lng))
    cache[key] = ergebnisse
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* Cache ist optional. */ }
    return gebietsTreffer(ergebnisse)
  })
  warteschlange = anfrage.catch(() => {})
  return anfrage
}

export async function adresseGeocodieren(adresse) {
  return (await orteSuchen(adresse))[0] || null
}
