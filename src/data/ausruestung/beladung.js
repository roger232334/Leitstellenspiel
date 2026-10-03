import { ausruestungsKatalog, ausruestungsId, katalogEintrag, faehigkeitsRegeln } from './ausruestungsKatalog.js'
import { leereBeladung, standardbeladungFuer } from './fahrzeugStandardbeladungen.js'

export function beladungNormalisieren(fahrzeug) {
  // Nur vollständig fehlende Beladung migrieren. Explizite Nullmengen/Nein bleiben erhalten.
  if (fahrzeug.beladung === undefined) return standardbeladungFuer(fahrzeug)
  const input = fahrzeug.beladung
  if (!input || input.version !== 1) throw new Error('Ungültige Beladungsversion.')
  const output = leereBeladung()
  for (const feld of ['ressourcen', 'ausruestung']) {
    const werte = input[feld] ?? {}
    if (typeof werte !== 'object' || Array.isArray(werte)) throw new Error('Ungültige Beladungsdaten.')
    for (const [id, wert] of Object.entries(werte)) {
      const e = katalogEintrag(id)
      if (!e || !(e.id in output[feld]) || e.id !== id) throw new Error(`Unbekanntes Beladungsfeld: ${id}`)
      if (e.typ === 'number' ? !Number.isSafeInteger(wert) || wert < e.min : typeof wert !== 'boolean') throw new Error(`${e.name}: bitte ${e.typ === 'number' ? 'eine nichtnegative ganze Zahl' : 'Ja oder Nein'} angeben.`)
      output[feld][id] = wert
    }
  }
  return output
}
export function fahrzeugHatAusruestung(fahrzeug, id) {
  const e = katalogEintrag(id)
  if (!e || e.typ !== 'boolean') return false
  try { return beladungNormalisieren(fahrzeug).ausruestung[e.id] === true } catch { return false }
}
export function fahrzeugRessource(fahrzeug, id) {
  const e = katalogEintrag(id)
  if (!e || e.typ !== 'number') return 0
  try { return beladungNormalisieren(fahrzeug).ressourcen[e.id] } catch { return 0 }
}
export function fahrzeugHatFaehigkeit(fahrzeug, id) {
  const regel = faehigkeitsRegeln.find(r => r.id === id)
  return !!regel && (regel.merkmal ? fahrzeug[regel.merkmal] === true : regel.ausruestung.every(a => fahrzeugHatAusruestung(fahrzeug, a)))
}
export function beladungenSummieren(fahrzeuge) {
  const summe = leereBeladung(), ids = new Set(), objekte = new Set()
  for (const f of fahrzeuge) {
    if (objekte.has(f) || (f.id != null && ids.has(f.id))) continue
    objekte.add(f); if (f.id != null) ids.add(f.id)
    let beladung
    try { beladung = beladungNormalisieren(f) } catch { beladung = leereBeladung() }
    for (const e of ausruestungsKatalog) {
      if (e.typ === 'number') summe.ressourcen[e.id] += beladung.ressourcen[e.id]
      else summe.ausruestung[e.id] ||= beladung.ausruestung[e.id]
    }
  }
  return summe
}
export function einsatzFehlbedarf(bedarf, fahrzeuge) {
  const vorhanden = beladungenSummieren(fahrzeuge), ressourcen = {}, ausruestung = []
  for (const [id, menge] of Object.entries(bedarf.ressourcen || {})) {
    const e = katalogEintrag(id)
    if (!e || e.typ !== 'number' || !Number.isSafeInteger(menge) || menge < 0) throw new Error(`Ungültige Ressourcenanforderung: ${id}`)
    const rest = Math.max(0, menge - vorhanden.ressourcen[e.id])
    if (rest) ressourcen[e.id] = rest
  }
  for (const id of bedarf.ausruestung || []) {
    const e = katalogEintrag(id)
    if (!e || e.typ !== 'boolean') throw new Error(`Unbekannte Ausrüstungsanforderung: ${id}`)
    if (!vorhanden.ausruestung[e.id] && !ausruestung.includes(ausruestungsId(id))) ausruestung.push(e.id)
  }
  return { ressourcen, ausruestung, erfuellt: !Object.keys(ressourcen).length && !ausruestung.length }
}
