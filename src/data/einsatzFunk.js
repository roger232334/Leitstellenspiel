import { untereinsaetzeZu } from './einsatzHierarchie.js'
import { fahrzeugFunkgruppeId, funkgruppenAusFahrzeugen, funkspruchErzeugen } from './funk.js'
import { sprechwunschHinzufuegen, sprechwunschPrioritaeten, sprechwunschAnnehmen } from './leitstellenHinweise.js'

export function sprechwunschFreigeben(id, hinweise, fahrzeuge, funk, einsaetze, kommunikation, zeit) {
  const hinweis = hinweise.find(h => h.id === id)
  if (!hinweis) return false
  const gruppen = funkgruppenAusFahrzeugen(fahrzeuge)
  const gruppeId = hinweis.funkgruppeId
  const fahrzeug = fahrzeuge.find(f => f.id === hinweis.fahrzeugId)
  // Beiträge vor der Annahme prüfen, damit ein Fehler den offenen Hinweis erhält.
  const aufforderung = funkspruchErzeugen({ gruppeId, gruppen, text: `${hinweis.funkrufname}, hier Leitstelle, kommen.`, zeit })
  const antwort = hinweis.meldetext && fahrzeug ? funkspruchErzeugen({ gruppeId, gruppen, fahrzeug, text: hinweis.meldetext, zeit }) : null
  if (!sprechwunschAnnehmen(hinweise, id, fahrzeuge, funk)) return false
  kommunikation.push(aufforderung)
  if (antwort) {
    kommunikation.push(antwort)
    funkLageBekanntgeben(funk.vorbereiteteMeldung, einsaetze)
    funk.vorbereiteteMeldung = null
  }
  return true
}

const funkEreignisse = new Set(['erstesFahrzeugEingetroffen', 'erkundungAbgeschlossen', 'einsatzAbschluss'])

// Erst der tatsächlich gesendete Erkundungsbericht macht die bestehende Lage bekannt.
export function funkLageBekanntgeben(meldung, einsaetze) {
  if (meldung?.phasenEreignis !== 'erkundungAbgeschlossen') return
  const einsatz = einsaetze.find(e => e.id === meldung.einsatzId)
  if (!einsatz?.szenario?.lageDurchFunk || !einsatz.szenario.erkundet) return
  for (const teil of [einsatz, ...untereinsaetzeZu(einsaetze, einsatz)]) {
    if (teil.szenario) teil.szenario.lageBekannt = true
  }
}

// Ereignisadapter: erzeugt ausschließlich einen Hinweis, niemals Kommunikation.
export function phasenSprechwunschErzeugen(event, einsaetze, fahrzeuge, hinweise) {
  if (!funkEreignisse.has(event.typ)) return null
  const einsatz = einsaetze.find(e => e.id === event.einsatzId)
  const meldung = einsatz?.szenario?.funkmeldungen?.[event.typ]
  if (typeof meldung?.text !== 'string' || !meldung.text.trim()) return null
  const prioritaet = meldung.prioritaet ?? 'normal'
  if (!sprechwunschPrioritaeten.includes(prioritaet)) return null
  const schluessel = `${event.typ}:${event.zeit}`
  if (einsatz.funkEreignisse?.includes(schluessel)) return null
  const ids = new Set([einsatz.id, ...untereinsaetzeZu(einsaetze, einsatz).map(e => e.id)])
  const kandidaten = fahrzeuge.filter(f => ids.has(f.einsatzId) && f.status === 4
    && (f.fahrt?.eingetroffenAm ?? event.zeit) <= event.zeit && fahrzeugFunkgruppeId(f)
    && (f.funkrufnameLang || f.funkrufname)?.trim())
    .sort((a, b) => (a.fahrt?.eingetroffenAm ?? event.zeit) - (b.fahrt?.eingetroffenAm ?? event.zeit) || a.id - b.id)
  const fahrzeug = kandidaten[0]
  if (!fahrzeug) return null
  const hinweis = sprechwunschHinzufuegen(hinweise, fahrzeug, prioritaet, event.zeit)
  hinweis.einsatzId = einsatz.id
  hinweis.meldetext = meldung.text.trim()
  hinweis.phasenEreignis = event.typ
  einsatz.funkEreignisse ??= []
  einsatz.funkEreignisse.push(schluessel)
  return hinweis
}
