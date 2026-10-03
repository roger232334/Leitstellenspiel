import { osmStammdaten } from './osmStammdaten.js'
export const GEBIET_KEY = 'leitstellensimulator-gebiet-v1'
export const GEBIET_KONFIG_KEY = 'leitstellensimulator-gebiet-konfig-v1'
export const gebietsKreise = [
  { id: 'stadt-regensburg', name: 'Stadt Regensburg', aliases: ['Regensburg', 'Kreisfreie Stadt Regensburg'] },
  { id: 'landkreis-regensburg', name: 'Landkreis Regensburg', aliases: [] },
  { id: 'landkreis-cham', name: 'Landkreis Cham', aliases: [] },
  { id: 'landkreis-neumarkt', name: 'Landkreis Neumarkt in der Oberpfalz', aliases: ['Landkreis Neumarkt i.d.OPf.', 'Landkreis Neumarkt in der Oberpfalz'] },
]
const norm = s => String(s ?? '').normalize('NFC').trim().toLocaleLowerCase('de')
const leer = () => ({ version: 1, ortschaften: [], adressen: [] })
const istPosition = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
function geometryPruefen(g) {
  if (g == null) return null
  if (!['Polygon', 'MultiPolygon'].includes(g.type) || !Array.isArray(g.coordinates) || !g.coordinates.length) throw new Error('Grenzen müssen GeoJSON Polygon/MultiPolygon (WGS84) sein.')
  for (const polygon of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
    if (!Array.isArray(polygon) || !polygon.length) throw new Error('Leeres Grenzpolygon.')
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4 || ring.some(p => !Array.isArray(p) || !istPosition({ lng: p[0], lat: p[1] })) || ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) throw new Error('Ungültiger oder nicht geschlossener Polygonring.')
    }
  }
  return JSON.parse(JSON.stringify(g))
}
export function gebietPruefen(daten) {
  if (daten?.version !== 1 || !Array.isArray(daten.ortschaften) || !Array.isArray(daten.adressen)) throw new Error('Erwartet: version: 1, ortschaften: [], adressen: [].')
  const ids = new Set()
  const ortschaften = daten.ortschaften.map(o => {
    if (!o || typeof o.id !== 'string' || !o.id.trim() || ids.has(o.id)) throw new Error('Fehlende oder doppelte Ortschafts-ID.')
    ids.add(o.id)
    if (!gebietsKreise.some(k => k.id === o.kreisId) || o.bundesland !== 'Bayern' || typeof o.gemeinde !== 'string' || !o.gemeinde.trim() || typeof o.ortsteil !== 'string' || !o.ortsteil.trim()) throw new Error('Ortschaft benötigt zulässigen Kreis, Bayern, Gemeinde und Ortsteil.')
    if (typeof o.aktiv !== 'boolean' || !Number.isFinite(o.einsatzaufkommenFaktor) || o.einsatzaufkommenFaktor < 0 || o.einsatzaufkommenFaktor > 1000) throw new Error('Aktiv muss Ja/Nein sein; Faktor muss zwischen 0 und 1000 liegen.')
    if (o.position != null && !istPosition(o.position)) throw new Error('Ungültiger WGS84-Mittelpunkt.')
    if (o.aliases != null && (!Array.isArray(o.aliases) || o.aliases.some(a => typeof a !== 'string'))) throw new Error('Aliase müssen Texte sein.')
    return { id: o.id, bundesland: 'Bayern', kreisId: o.kreisId, gemeinde: o.gemeinde.trim(), ortsteil: o.ortsteil.trim(), postleitzahl: String(o.postleitzahl ?? ''),
      aktiv: o.aktiv, einsatzaufkommenFaktor: o.einsatzaufkommenFaktor, aliases: o.aliases ?? [],
      verwaltungsId: String(o.verwaltungsId ?? ''), position: o.position ?? null, geometry: geometryPruefen(o.geometry) }
  })
  const ortIndex = new Map(ortschaften.map(o => [o.id, o]))
  const adressIds = new Set()
  const adressen = daten.adressen.map(a => {
    if (!a || typeof a.id !== 'string' || !a.id || adressIds.has(a.id) || !ids.has(a.gebietId) || typeof a.strasse !== 'string' || !a.strasse.trim() || !istPosition(a.position)) throw new Error('Adresse benötigt eindeutige ID, gültige gebietId, Straße und WGS84-Position.')
    adressIds.add(a.id)
    const ort = ortIndex.get(a.gebietId)
    if (ort.geometry && !punktInGeometrie(a.position, ort.geometry)) throw new Error(`Adresse ${a.id} liegt außerhalb ihrer Ortschaft.`)
    return { id: a.id, gebietId: a.gebietId, strasse: a.strasse.trim(), hausnummer: String(a.hausnummer ?? ''), position: { ...a.position } }
  })
  return { version: 1, ortschaften, adressen }
}
let ladeCache
export function gebietLaden(speicher = globalThis.localStorage) {
  const raw = speicher?.getItem(GEBIET_KEY), konfigRaw = speicher?.getItem(GEBIET_KONFIG_KEY)
  const basis = osmStammdaten()
  if (ladeCache?.speicher === speicher && ladeCache?.raw === raw && ladeCache?.konfigRaw === konfigRaw && ladeCache?.basis === basis) return ladeCache.result
  const manuell = raw == null ? leer() : gebietPruefen(JSON.parse(raw))
  const konfig = JSON.parse(konfigRaw || '{}')
  const overrides = konfig.ortschaften || {}
  // Old/manual JSON stays readable; OSM base never goes into localStorage.
  const orte = new Map(manuell.ortschaften.map(o => [o.id, o]))
  for (const o of basis?.ortschaften || []) {
    const alt = overrides[o.id] || orte.get(o.id)
    orte.set(o.id, { ...o, aktiv: typeof alt?.aktiv === 'boolean' ? alt.aktiv : true,
      einsatzaufkommenFaktor: Number.isFinite(alt?.einsatzaufkommenFaktor) && alt.einsatzaufkommenFaktor >= 0 && alt.einsatzaufkommenFaktor <= 1000 ? alt.einsatzaufkommenFaktor : 1 })
  }
  const adressen = basis ? [...basis.adressen, ...manuell.adressen.filter(a => !basis.orteIndex.has(a.gebietId))] : manuell.adressen
  const result = { version: 1, ortschaften: [...orte.values()], adressen, ...(basis ? { strassen: basis.strassen } : {}) }
  ladeCache = { speicher, raw, konfigRaw, basis, result }
  return result
}
export function gebietSpeichern(daten, speicher = globalThis.localStorage) {
  const basis = osmStammdaten()
  if (!basis) {
    const result = gebietPruefen(daten)
    speicher.setItem(GEBIET_KEY, JSON.stringify(result))
    return result
  }
  const alt = JSON.parse(speicher.getItem(GEBIET_KONFIG_KEY) || '{}')
  const overrides = { ...alt.ortschaften }
  for (const o of daten.ortschaften) {
    if (typeof o.aktiv !== 'boolean' || !Number.isFinite(o.einsatzaufkommenFaktor) || o.einsatzaufkommenFaktor < 0 || o.einsatzaufkommenFaktor > 1000) throw new Error('Aktiv muss Ja/Nein sein; Faktor muss zwischen 0 und 1000 liegen.')
    if (basis.orteIndex.has(o.id)) overrides[o.id] = { aktiv: o.aktiv, einsatzaufkommenFaktor: o.einsatzaufkommenFaktor }
  }
  const manuell = gebietPruefen({ version: 1, ortschaften: daten.ortschaften.filter(o => !basis.orteIndex.has(o.id)), adressen: daten.adressen.filter(a => !basis.orteIndex.has(a.gebietId)) })
  // Config write first: quota failures must never erase existing base/manual records.
  speicher.setItem(GEBIET_KONFIG_KEY, JSON.stringify({ version: 1, ortschaften: overrides }))
  speicher.setItem(GEBIET_KEY, JSON.stringify(manuell))
  return gebietLaden(speicher)
}
export function gebietImportVorbereiten(importDaten, bestand) {
  if (importDaten?.version !== 1 || !Array.isArray(importDaten.ortschaften) || !Array.isArray(importDaten.adressen)) throw new Error('Import benötigt version: 1, ortschaften und adressen.')
  for (const feld of ['ortschaften', 'adressen']) {
    if (new Set(importDaten[feld].map(e => e?.id)).size !== importDaten[feld].length) throw new Error('Doppelte IDs in der Importdatei.')
  }
  const zusammen = feld => [...new Map([...bestand[feld], ...importDaten[feld]].map(e => [e?.id, e])).values()]
  const result = gebietPruefen({ version: 1, ortschaften: zusammen('ortschaften'), adressen: zusammen('adressen') })
  for (const o of result.ortschaften) {
    const alt = bestand.ortschaften.find(a => a.id === o.id)
    if (alt) { o.aktiv = alt.aktiv; o.einsatzaufkommenFaktor = alt.einsatzaufkommenFaktor }
  }
  return result
}
function inRing(p, ring) {
  let innen = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i], [xj, yj] = ring[j]
    if (Math.abs((p.lng - x) * (yj - y) - (p.lat - y) * (xj - x)) < 1e-10 && p.lng >= Math.min(x, xj) && p.lng <= Math.max(x, xj) && p.lat >= Math.min(y, yj) && p.lat <= Math.max(y, yj)) return true
    if ((y > p.lat) !== (yj > p.lat) && p.lng < (xj - x) * (p.lat - y) / (yj - y) + x) innen = !innen
  }
  return innen
}
export function punktInGeometrie(p, g) {
  if (!istPosition(p) || !g) return false
  return (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some(poly => inRing(p, poly[0]) && !poly.slice(1).some(r => inRing(p, r)))
}
// Einziger Zulässigkeitsentscheid für Suche, manuelle Positionen und POIs.
export function gebietsPruefung(input, daten = gebietLaden()) {
  if (!daten.ortschaften.length) return { erlaubt: false, grund: 'Gebietsdaten fehlen. Bitte im Adminbereich importieren.' }
  const p = input.position ?? (input.lat != null ? { lat: input.lat, lng: input.lng } : null)
  if (p && !istPosition(p)) return { erlaubt: false, grund: 'Ungültige WGS84-Koordinaten.' }
  let kandidaten
  const basis = osmStammdaten()
  const grenzen = o => o.geometry || basis?.gemeindenIndex.get(o.gemeindeId)?.geometry
  if (input.gebietId) {
    kandidaten = daten.ortschaften.filter(o => o.id === input.gebietId && (!p || !grenzen(o) || punktInGeometrie(p, grenzen(o))))
  } else {
    if (p && basis) {
      const gemeinden = basis.gemeinden.filter(g => punktInGeometrie(p, g.geometry))
      if (gemeinden.length === 1) {
        const orte = daten.ortschaften.filter(o => o.gemeindeId === gemeinden[0].id && o.position)
        const abstand = o => ((o.position.lng - p.lng) * 0.66) ** 2 + (o.position.lat - p.lat) ** 2
        const ort = orte.reduce((a, b) => !a || abstand(b) < abstand(a) ? b : a, null)
        if (ort) return { erlaubt: ort.aktiv, ort, grund: ort.aktiv ? '' : 'Diese Ortschaft ist deaktiviert.' }
      }
    }
    const geometrisch = p ? daten.ortschaften.filter(o => punktInGeometrie(p, o.geometry)) : []
    kandidaten = geometrisch.length ? geometrisch : daten.ortschaften.filter(o => {
      if (p && grenzen(o)) return false
      const kreis = gebietsKreise.find(k => k.id === o.kreisId)
      const a = input.adresse ?? input
      const kreisPasst = [kreis.name, ...kreis.aliases].some(n => norm(n) === norm(input.kreis))
      return ['de', 'deutschland', 'germany'].includes(norm(input.land)) && norm(input.bundesland) === 'bayern' && kreisPasst &&
        norm(a.gemeinde || a.ort) === norm(o.gemeinde) && [o.ortsteil, ...(o.aliases ?? [])].some(n => norm(n) === norm(a.ortsteil || a.ort))
    })
  }
  if (kandidaten.length !== 1) return { erlaubt: false, grund: kandidaten.length > 1 ? 'Gebietszuordnung ist mehrdeutig.' : 'Außerhalb des Leitstellengebiets oder nicht eindeutig zuordenbar.' }
  const ort = kandidaten[0]
  return { erlaubt: ort.aktiv, ort, grund: ort.aktiv ? '' : 'Diese Ortschaft ist deaktiviert.' }
}
export const istAdresseImLeitstellengebiet = (adresse, daten) => gebietsPruefung(adresse, daten).erlaubt
export const aktiveOrtschaften = daten => daten.ortschaften.filter(o => o.aktiv)
const adressGruppen = new WeakMap()
function adressenNachOrt(daten) {
  if (!adressGruppen.has(daten.adressen)) {
    const gruppen = new Map()
    for (const a of daten.adressen) {
      if (!a.strasse) continue // Preserve incomplete OSM records, but don't invent a dispatch address.
      if (!gruppen.has(a.gebietId)) gruppen.set(a.gebietId, [])
      gruppen.get(a.gebietId).push(a)
    }
    const ohneAdressen = new Set((daten.strassen || []).map(s => s.gebietId).filter(id => !gruppen.has(id)))
    for (const s of daten.strassen || []) {
      if (!ohneAdressen.has(s.gebietId)) continue
      if (!gruppen.has(s.gebietId)) gruppen.set(s.gebietId, [])
      gruppen.get(s.gebietId).push({ ...s, strasse: s.name, hausnummer: '', quelle: 'osm-strasse' })
    }
    adressGruppen.set(daten.adressen, gruppen)
  }
  return adressGruppen.get(daten.adressen)
}
export function waehleZufaelligeOrtschaft(daten, zufall = Math.random, nurMitAdresse = false) {
  const gruppen = nurMitAdresse ? adressenNachOrt(daten) : null
  const kandidaten = aktiveOrtschaften(daten).filter(o => o.einsatzaufkommenFaktor > 0 && (!nurMitAdresse || gruppen.has(o.id)))
  const summe = kandidaten.reduce((s, o) => s + o.einsatzaufkommenFaktor, 0)
  if (!summe) return null
  const wert = zufall()
  if (!Number.isFinite(wert) || wert < 0 || wert >= 1) throw new Error('Ungültiger Zufallswert.')
  let rest = wert * summe
  return kandidaten.find(o => (rest -= o.einsatzaufkommenFaktor) < 0) ?? kandidaten.at(-1)
}
export function zufaelligeGebietsAdresse(daten = gebietLaden(), zufall = Math.random) {
  const ort = waehleZufaelligeOrtschaft(daten, zufall, true)
  if (!ort) return null
  const adressen = adressenNachOrt(daten).get(ort.id)
  const wert = zufall()
  if (!Number.isFinite(wert) || wert < 0 || wert >= 1) throw new Error('Ungültiger Zufallswert.')
  const adresse = adressen[Math.floor(wert * adressen.length)]
  return { ...adresse, ort: ort.gemeinde, ortsteil: ort.ortsteil, gemeinde: ort.gemeinde, postleitzahl: adresse.postleitzahl || ort.postleitzahl }
}
export function gebietsTreffer(treffer) {
  const daten = gebietLaden()
  return treffer.flatMap(t => { const p = gebietsPruefung(t, daten); return p.erlaubt ? [{ ...t, gebietId: p.ort.id }] : [] })
}
export function objektAutomatischZulaessig(objekt, daten = gebietLaden()) {
  const p = gebietsPruefung(objekt, daten)
  return objekt.aktiv && p.erlaubt && p.ort.einsatzaufkommenFaktor > 0
}
