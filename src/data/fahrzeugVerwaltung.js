import { standardFahrzeuge } from './standardFahrzeuge.js'
import { fahrzeugArtZu } from './fahrzeugArten.js'
import { fachdienste } from './fachdienste.js'
import { beladungNormalisieren } from './ausruestung/beladung.js'
import { objektDatenLaden } from './objektVerwaltung.js'
export const FAHRZEUGE_KEY = 'leitstellensimulator-fahrzeuge-v1'
export function fahrzeugAufKarteSichtbar(fahrzeug) {
  return fahrzeug.hatGps !== false && !!fahrzeug.position &&
    Number.isFinite(fahrzeug.position.lat) && Number.isFinite(fahrzeug.position.lng)
}
export function fahrzeugPruefen(f, bestand = []) {
  const funkgruppe = (f.funkgruppe ?? '').trim()
  const wacheName = f.wacheName ?? ''
  const wacheId = f.wacheId ?? null
  if (funkgruppe.length > 100) throw new Error('Die Funkgruppe darf höchstens 100 Zeichen lang sein.')
  if (typeof wacheName !== 'string') throw new Error('Ungültiger Wachenname.')
  if (wacheId !== null && typeof wacheId !== 'string' && !Number.isSafeInteger(wacheId)) throw new Error('Ungültige Wachenreferenz.')
  for (const feld of ['hatNotarzt', 'hatGps', 'istFirstResponder', 'istEhrenamtlich']) {
    if (f[feld] !== undefined && typeof f[feld] !== 'boolean') throw new Error('Fahrzeugmerkmale müssen Ja/Nein-Werte sein.')
  }
  // Ältere Datensätze besitzen nur funkrufname. Keine Kurzform erraten.
  const funkrufnameLang = (f.funkrufnameLang ?? f.funkrufname ?? '').trim()
  const funkrufnameKurz = (f.funkrufnameKurz ?? '').trim()
  const art = fahrzeugArtZu(f.fahrzeugArtId)
  if (f.fahrzeugArtId && !art) throw new Error('Unbekannter Fahrzeugtyp aus der Richtlinie.')
  if (!funkrufnameLang || !f.typ?.trim()) throw new Error('Langer Funkrufname und Fahrzeugtyp sind erforderlich.')
  if (funkrufnameLang.length > 100 || funkrufnameKurz.length > 100) throw new Error('Funkrufnamen dürfen höchstens 100 Zeichen lang sein.')
  if (bestand.some(e => e.id !== f.id && (e.funkrufnameLang ?? e.funkrufname ?? '').trim().toLocaleLowerCase('de') === funkrufnameLang.toLocaleLowerCase('de'))) throw new Error('Dieser lange Funkrufname ist bereits vergeben.')
  if (!fachdienste.some(dienst => dienst.id === f.bereich) || ![1, 2, 6].includes(Number(f.startStatus))) throw new Error('Fachdienst oder Startstatus ist ungültig.')
  const lat = f.position?.lat, lng = f.position?.lng
  if (f.position && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) throw new Error('Bitte gültige Koordinaten eingeben (Breite −90 bis 90, Länge −180 bis 180).')
  return { id: f.id, funkrufname: funkrufnameLang, funkrufnameLang, funkrufnameKurz, typ: art ? art.kurz.toUpperCase() : f.typ.trim().toUpperCase(), ...(art ? { fahrzeugArtId: art.id } : {}), bereich: f.bereich,
    funkgruppe, wacheName, wacheId,
    beladung: beladungNormalisieren(f),
    hatNotarzt: f.hatNotarzt ?? ['NEF', 'NAW'].includes(f.typ.trim().toUpperCase()),
    hatGps: f.hatGps ?? true, istFirstResponder: f.istFirstResponder ?? false, istEhrenamtlich: f.istEhrenamtlich ?? false,
    startStatus: Number(f.startStatus), position: f.position ? { lat, lng } : null }
}
export function fahrzeugDatenPruefen(daten) {
  if (daten?.version !== 1 || !Array.isArray(daten.fahrzeuge) || !Number.isSafeInteger(daten.naechsteId) || daten.naechsteId < 1) throw new Error('Ungültiger Fahrzeugdatenbestand.')
  const ids = new Set()
  const fahrzeuge = daten.fahrzeuge.map(f => {
    if (!f || !Number.isSafeInteger(f.id) || f.id < 1 || f.id >= daten.naechsteId || ids.has(f.id)) throw new Error('Ungültige Fahrzeug-ID.')
    ids.add(f.id)
    return fahrzeugPruefen(f, daten.fahrzeuge)
  })
  return { version: 1, naechsteId: daten.naechsteId, fahrzeuge }
}
export function fahrzeugDatenLaden(speicher = localStorage) {
  const text = speicher.getItem(FAHRZEUGE_KEY)
  if (text !== null) return fahrzeugDatenPruefen(JSON.parse(text))
  return fahrzeugDatenPruefen({ version: 1, naechsteId: 6, fahrzeuge: standardFahrzeuge.map(f => ({ ...f, startStatus: f.status })) })
}
export function fahrzeugDatenSpeichern(daten, speicher = localStorage) {
  const geprueft = fahrzeugDatenPruefen(daten)
  speicher.setItem(FAHRZEUGE_KEY, JSON.stringify(geprueft))
  return geprueft
}
export function fahrzeugMitObjektWache(f, objekte, streng = false) {
  if (f.wacheId == null) return { ...f }
  const wache = objekte.find(o => o.id === f.wacheId)
  if (!wache || !wache.aktiv) {
    if (streng) throw new Error('Die gewählte Wache fehlt oder ist deaktiviert. Bitte eine aktive Wache auswählen oder die Zuordnung entfernen.')
    return { ...f, position: null }
  }
  return { ...f, wacheName: wache.name, position: wache.position ? { ...wache.position } : null }
}
export function fahrzeugeFuerSchicht(daten, start, objekte = globalThis.localStorage ? objektDatenLaden().objekte : []) {
  const zeit = new Date(start).toLocaleTimeString('de-DE')
  return fahrzeugDatenPruefen(daten).fahrzeuge.map(stamm => {
    const f = fahrzeugMitObjektWache(stamm, objekte)
    return { ...f, position: f.position ? { ...f.position } : null,
    status: f.startStatus, statusZeiten: { [f.startStatus]: zeit }, einsatzId: null,
    naechsterStatusIn: 0, route: [], routeSchritt: 0, routeSchritte: 0 }
  })
}
