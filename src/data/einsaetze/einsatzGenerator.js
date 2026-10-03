import { einsatzKatalog } from './einsatzKatalog.js'
import { stichwortKatalog } from '../stichwortKatalog.js'
import { katalogStichwoerter } from '../einsatzStichwoerter.js'
import { bedarfNormalisieren } from '../einsatzBedarf.js'
import { zeitplanungErstellen } from '../einsatzLebenszyklus.js'

function zufallswert(zufall) {
  const wert = zufall()
  if (!Number.isFinite(wert) || wert < 0 || wert >= 1) throw new Error('Zufallswert muss zwischen 0 (inklusive) und 1 (exklusive) liegen.')
  return wert
}

export function gewichteteAuswahl(eintraege, zufall = Math.random) {
  if (!eintraege.length || eintraege.some(e => !Number.isFinite(e.gewicht ?? 1) || (e.gewicht ?? 1) < 0)) throw new Error('Ungültige Variantengewichte.')
  const summe = eintraege.reduce((s, e) => s + (e.gewicht ?? 1), 0)
  if (!Number.isFinite(summe) || summe <= 0) throw new Error('Mindestens ein Gewicht muss positiv sein.')
  let rest = zufallswert(zufall) * summe
  for (const e of eintraege) {
    rest -= e.gewicht ?? 1
    if (rest < 0) return e
  }
  return eintraege.findLast(e => (e.gewicht ?? 1) > 0)
}

function finde(liste, id) {
  const eintraege = liste.filter(e => e.id === id)
  if (eintraege.length !== 1) throw new Error(`Fehlende oder doppelte Katalog-ID: ${id}`)
  return eintraege[0]
}

function addiereBedarf(basis, zusatz) {
  const b = bedarfNormalisieren(basis), z = bedarfNormalisieren(zusatz)
  for (const [id, menge] of Object.entries(z.ressourcen)) b.ressourcen[id] = (b.ressourcen[id] ?? 0) + menge
  b.ausruestung = [...new Set([...b.ausruestung, ...z.ausruestung])]
  b.faehigkeiten = [...new Set([...b.faehigkeiten, ...z.faehigkeiten])]
  return bedarfNormalisieren(b)
}

// Liefert ein frisches Einsatzobjekt. Laufzeit-ID und Ort setzt der Aufrufer.
// Zufall und Katalog sind für reproduzierbare Tests bzw. weitere Einsatzbereiche austauschbar.
export function generiereEinsatz(einsatzartId, { zufall = Math.random, katalog = einsatzKatalog } = {}) {
  const art = finde(katalog.einsatzArten, einsatzartId)
  finde(katalog.grundtypen, art.grundtyp)
  const meldebild = finde(stichwortKatalog, art.meldebildId)
  const lagen = art.lageVarianten.map(id => finde(katalog.lageVarianten, id))
  const anrufe = art.notrufVarianten.map(id => finde(katalog.notrufVarianten, id))
  for (const lage of lagen) {
    bedarfNormalisieren(lage.bedarf)
    for (const eskalation of lage.eskalationen ?? []) finde(lagen, eskalation.zielLageVarianteId)
  }
  for (const anruf of anrufe) for (const id of anruf.lageVarianten ?? []) finde(lagen, id)
  const lage = gewichteteAuswahl(lagen, zufall)
  // Keine sichtbaren Flammen bei angebranntem Essen: Einschränkung ist reine Katalogdatenlogik.
  const anruf = gewichteteAuswahl(anrufe.filter(a => !a.lageVarianten || a.lageVarianten.includes(lage.id)), zufall)
  let bedarf = bedarfNormalisieren(lage.bedarf)
  const ausgewaehlt = []
  const ids = new Set()
  for (const regel of art.modifikatoren ?? []) {
    if (ids.has(regel.id)) throw new Error(`Doppelter Modifikator: ${regel.id}`)
    ids.add(regel.id)
    const mod = finde(katalog.modifikatoren, regel.id)
    const p = regel.wahrscheinlichkeit
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new Error('Ungültige Modifikatorwahrscheinlichkeit.')
    bedarfNormalisieren(mod.bedarfZusatz ?? {})
    if (zufallswert(zufall) < p) {
      ausgewaehlt.push(structuredClone(mod))
      bedarf = addiereBedarf(bedarf, mod.bedarfZusatz ?? {})
    }
  }
  const zuordnung = katalogStichwoerter(meldebild)
  return {
    typ: 'haupt', parentId: null, bereich: null, status: 'offen', fahrzeuge: [], untereinsatzIds: [], autoSplitErfolgt: false,
    meldung: art.name, meldebildId: meldebild.id, schlagwort: meldebild.kennung,
    ...structuredClone(zuordnung),
    zeitplanung: zeitplanungErstellen(lage.dauer, zufall),
    szenario: { version: 1, einsatzartId: art.id, grundtypId: art.grundtyp,
      lageVarianteId: lage.id, lageName: lage.name, lageBekannt: false,
      lageDurchFunk: art.id === 'zimmerbrand',
      notrufVarianteId: anruf.id, notruf: structuredClone(anruf),
      funkmeldungen: structuredClone({ ...art.funkmeldungen, ...lage.funkmeldungen }),
      modifikatoren: ausgewaehlt, eskalationen: structuredClone(lage.eskalationen ?? []) },
    bedarf,
  }
}
