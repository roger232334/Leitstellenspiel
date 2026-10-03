import { beladungenSummieren, fahrzeugHatFaehigkeit } from './ausruestung/beladung.js'
import { katalogEintrag, faehigkeitsRegeln } from './ausruestung/ausruestungsKatalog.js'
import { haupteinsatzZu, untereinsaetzeZu } from './einsatzHierarchie.js'

// AAO-Vorschläge sind ausdrücklich keine tatsächlich gebundenen Einsatzmittel.
export function bedarfsKontext(einsatz, einsaetze = []) {
  const haupt = haupteinsatzZu(einsaetze, einsatz)
  const traeger = einsatz?.bedarf != null ? einsatz : haupt?.bedarf != null ? haupt : einsatz
  return {
    einsatz: traeger,
    einsatzIds: traeger ? [traeger.id, ...untereinsaetzeZu(einsaetze, traeger).map(e => e.id)] : [],
  }
}

export function bedarfsFahrzeuge(einsatz, fahrzeuge, { einsaetze = [], nurAmOrt = false } = {}) {
  const ids = new Set(bedarfsKontext(einsatz, einsaetze).einsatzIds)
  return fahrzeuge.filter(f => f.einsatzId != null && ids.has(f.einsatzId)
    && (f.status === 4 || (!nurAmOrt && f.status === 3)))
}

// Reine Aggregation einer bereits ausgewählten Fahrzeugmenge, ohne Statusfilter.
export function berechneVerfuegbareRessourcen(fahrzeuge) {
  return beladungenSummieren(fahrzeuge)
}

export function bedarfNormalisieren(bedarf) {
  if (!bedarf || typeof bedarf !== 'object' || Array.isArray(bedarf)) throw new Error('Ungültiger Einsatzbedarf.')
  const mengen = bedarf.ressourcen ?? {}
  if (typeof mengen !== 'object' || Array.isArray(mengen)) throw new Error('Ungültige Ressourcenanforderungen.')
  const ressourcen = {}, ausruestung = [], faehigkeiten = []
  for (const [id, menge] of Object.entries(mengen)) {
    const eintrag = katalogEintrag(id)
    if (!eintrag || eintrag.typ !== 'number' || !Number.isSafeInteger(menge) || menge < 0) throw new Error(`Ungültige Ressourcenanforderung: ${id}`)
    // Alias und Speicher-ID beschreiben dieselbe Anforderung, nicht zwei Mengen.
    ressourcen[eintrag.id] = Math.max(ressourcen[eintrag.id] ?? 0, menge)
  }
  if (!Array.isArray(bedarf.ausruestung ?? [])) throw new Error('Ausrüstungsanforderungen müssen eine Liste sein.')
  for (const id of bedarf.ausruestung ?? []) {
    const eintrag = katalogEintrag(id)
    if (!eintrag || eintrag.typ !== 'boolean') throw new Error(`Unbekannte Ausrüstungsanforderung: ${id}`)
    if (!ausruestung.includes(eintrag.id)) ausruestung.push(eintrag.id)
  }
  if (!Array.isArray(bedarf.faehigkeiten ?? [])) throw new Error('Fähigkeitsanforderungen müssen eine Liste sein.')
  for (const id of bedarf.faehigkeiten ?? []) {
    if (!faehigkeitsRegeln.some(r => r.id === id)) throw new Error(`Unbekannte Fähigkeitsanforderung: ${id}`)
    if (!faehigkeiten.includes(id)) faehigkeiten.push(id)
  }
  return { ressourcen, ausruestung, faehigkeiten }
}

export function pruefeEinsatzBedarf(einsatz, fahrzeuge, optionen = {}) {
  const kontext = bedarfsKontext(einsatz, optionen.einsaetze)
  const grundlage = { einsatzId: kontext.einsatz?.id ?? null, ressourcen: {}, ausruestung: {}, faehigkeiten: {} }
  // Unbekannter Bedarf ist nicht dasselbe wie ein bekannter, leerer Bedarf.
  if (kontext.einsatz?.bedarf == null || kontext.einsatz.szenario?.lageBekannt === false) return { ...grundlage, definiert: false, erfuellt: null }
  const bedarf = bedarfNormalisieren(kontext.einsatz.bedarf)
  const gebunden = bedarfsFahrzeuge(einsatz, fahrzeuge, optionen)
  const summe = berechneVerfuegbareRessourcen(gebunden)
  for (const [id, benoetigt] of Object.entries(bedarf.ressourcen)) {
    const vorhanden = summe.ressourcen[id]
    const fehlt = Math.max(0, benoetigt - vorhanden)
    grundlage.ressourcen[id] = { benoetigt, vorhanden, fehlt, erfuellt: fehlt === 0 }
  }
  for (const id of bedarf.ausruestung) {
    const vorhanden = summe.ausruestung[id]
    grundlage.ausruestung[id] = { benoetigt: true, vorhanden, erfuellt: vorhanden }
  }
  for (const id of bedarf.faehigkeiten) {
    const vorhanden = gebunden.some(f => fahrzeugHatFaehigkeit(f, id))
    grundlage.faehigkeiten[id] = { benoetigt: true, vorhanden, erfuellt: vorhanden }
  }
  return { ...grundlage, definiert: true,
    erfuellt: ['ressourcen', 'ausruestung', 'faehigkeiten'].every(feld => Object.values(grundlage[feld]).every(e => e.erfuellt)) }
}
