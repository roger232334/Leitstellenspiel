import { fahrzeugFunkgruppeId } from './funk.js'

export const sprechwunschPrioritaeten = ['normal', 'dringend']

// Bündelung betrifft nur die Darstellung, nicht die einzelnen offenen Hinweise.
export function hinweiseGruppieren(hinweise) {
  const gruppen = new Map()
  for (const hinweis of hinweise) {
    const key = hinweis.typ === 'sprechwunsch' ? `sprech:${hinweis.funkgruppeId}:${hinweis.prioritaet}` : `typ:${hinweis.typ}`
    if (!gruppen.has(key)) gruppen.set(key, {
      id: key, titel: hinweis.typ === 'sprechwunsch' ? hinweis.funkgruppe : hinweisTypen[hinweis.typ] || hinweisTypen.ereignis,
      dringend: false, hinweise: [],
    })
    const gruppe = gruppen.get(key)
    gruppe.hinweise.push(hinweis)
    if (hinweis.prioritaet === 'dringend') gruppe.dringend = true
  }
  return [...gruppen.values()]
}
export const hinweisTypen = {
  sprechwunsch: 'Sprechwunsch',
  weitergeleiteter_einsatz: 'Weitergeleiteter Einsatz',
  polizeieinsatz: 'Polizeieinsatz',
  brandmeldeanlage: 'Brandmeldeanlage',
  ereignis: 'Weiteres Ereignis',
}

export function hinweisHinzufuegen(warteschlange, { typ = 'ereignis', titel, text = '', erstelltAm, test = false, einsatzId = null, fahrzeugId = null, funkrufname, funkgruppeId, funkgruppe, prioritaet = 'normal' }) {
  if (!Object.hasOwn(hinweisTypen, typ)) throw new Error('Unbekannter Hinweistyp.')
  if (typeof titel !== 'string' || !titel.trim() || typeof text !== 'string' || !Number.isFinite(erstelltAm)) throw new Error('Ein Hinweis benötigt Titel, Text und Simulationszeit.')
  const hinweis = { id: crypto.randomUUID(), typ, titel: titel.trim(), text: text.trim(), erstelltAm, test: test === true, einsatzId, fahrzeugId }
  if (typ === 'sprechwunsch') {
    if (!Number.isSafeInteger(fahrzeugId) || fahrzeugId < 1 || !funkrufname?.trim() || !funkgruppe?.trim() || !funkgruppeId?.trim()) throw new Error('Ein Sprechwunsch benötigt Fahrzeug, Funkrufnamen und Funkgruppe.')
    if (!sprechwunschPrioritaeten.includes(prioritaet)) throw new Error('Ungültige Sprechwunschpriorität.')
    Object.assign(hinweis, { funkrufname: funkrufname.trim(), funkgruppeId, funkgruppe: funkgruppe.trim(), prioritaet })
  }
  warteschlange.push(hinweis)
  return hinweis
}

export function sprechwunschHinzufuegen(warteschlange, fahrzeug, prioritaet, zeit) {
  return hinweisHinzufuegen(warteschlange, {
    typ: 'sprechwunsch', titel: 'Sprechwunsch', erstelltAm: zeit,
    fahrzeugId: fahrzeug?.id, funkrufname: fahrzeug?.funkrufnameLang || fahrzeug?.funkrufname,
    funkgruppe: fahrzeug?.funkgruppe, funkgruppeId: fahrzeugFunkgruppeId(fahrzeug),
    einsatzId: fahrzeug?.einsatzId ?? null, prioritaet,
  })
}

export function hinweisEntfernen(warteschlange, id) {
  const index = warteschlange.findIndex(h => h.id === id)
  if (index < 0) return false
  warteschlange.splice(index, 1)
  return true
}

export function sprechwunschAnnehmen(warteschlange, id, fahrzeuge, funk) {
  const hinweis = warteschlange.find(h => h.id === id)
  if (!hinweis) return false
  if (hinweis.typ !== 'sprechwunsch') throw new Error('Dieser Hinweis ist kein Sprechwunsch.')
  const fahrzeug = fahrzeuge.find(f => f.id === hinweis.fahrzeugId)
  if (!fahrzeug) throw new Error('Das Fahrzeug ist nicht mehr vorhanden. Der Sprechwunsch bleibt offen.')
  if (fahrzeugFunkgruppeId(fahrzeug) !== hinweis.funkgruppeId) throw new Error('Die Funkgruppe des Fahrzeugs hat sich geändert. Bitte den Sprechwunsch prüfen.')
  if (funk.vorbereiteteMeldung) throw new Error('Bitte zuerst die bereits angenommene Meldung senden.')
  funk.aktiveGruppeId = hinweis.funkgruppeId
  funk.teilnehmerId = fahrzeug.id
  if (hinweis.meldetext) funk.vorbereiteteMeldung = {
    id: hinweis.id, fahrzeugId: fahrzeug.id, gruppeId: hinweis.funkgruppeId,
    einsatzId: hinweis.einsatzId, text: hinweis.meldetext,
    phasenEreignis: hinweis.phasenEreignis,
  }
  hinweisEntfernen(warteschlange, id)
  return true
}

export function testHinweiseErstellen(zeit) {
  const liste = []
  for (const [typ, titel, text] of [
    ['ereignis', 'Allgemeiner Testhinweis', 'Beispiel für ein weiteres Leitstellenereignis.'],
    ['weitergeleiteter_einsatz', 'Einsatzübernahme prüfen', 'Beispiel für einen weitergeleiteten Einsatz.'],
    ['polizeieinsatz', 'Unterstützung angefragt', 'Beispiel für eine Polizeianforderung.'],
    ['brandmeldeanlage', 'BMA – Testobjekt', 'Beispiel für eine automatische Brandmeldung.'],
  ]) hinweisHinzufuegen(liste, { typ, titel, text, erstelltAm: zeit, test: true })
  return liste
}
