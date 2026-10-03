import test from 'node:test'
import assert from 'node:assert/strict'
import { hinweisHinzufuegen, hinweisEntfernen, testHinweiseErstellen, sprechwunschHinzufuegen } from '../src/data/leitstellenHinweise.js'
import { istSprachbeitrag } from '../src/data/kommunikation.js'

test('Sprechwünsche speichern Fahrzeug, Gruppe, Priorität, Einsatz und Zeit ohne Sprachbeitrag', () => {
  const liste = [], f = { id: 4, funkrufnameLang: 'Florian Regensburg 40/1', funkgruppe: 'FW_Regensburg', einsatzId: 1001 }
  const normal = sprechwunschHinzufuegen(liste, f, 'normal', 1000)
  const dringend = sprechwunschHinzufuegen(liste, f, 'dringend', 2000)
  assert.equal(normal.fahrzeugId, 4)
  assert.equal(normal.funkrufname, f.funkrufnameLang)
  assert.equal(normal.funkgruppe, 'FW_Regensburg')
  assert.equal(normal.funkgruppeId, 'funk:fw_regensburg')
  assert.equal(normal.einsatzId, 1001)
  assert.equal(normal.prioritaet, 'normal')
  assert.equal(dringend.prioritaet, 'dringend')
  assert.equal(dringend.erstelltAm, 2000)
  assert.ok(liste.every(h => !istSprachbeitrag(h) && !('kanal' in h)))
  f.funkgruppe = 'Andere Gruppe'; f.einsatzId = null
  assert.equal(normal.funkgruppe, 'FW_Regensburg')
  assert.equal(normal.einsatzId, 1001)
  assert.equal(sprechwunschHinzufuegen(liste, f, 'normal', 3000).einsatzId, null)
})

test('Unvollständige Sprechwünsche und unbekannte Prioritäten werden abgewiesen', () => {
  const liste = [], f = { id: 1, funkrufname: 'Test', funkgruppe: 'FW' }
  assert.throws(() => sprechwunschHinzufuegen(liste, f, 'sofort', 1))
  assert.throws(() => sprechwunschHinzufuegen(liste, { ...f, funkgruppe: '' }, 'normal', 1))
  assert.throws(() => sprechwunschHinzufuegen(liste, null, 'normal', 1))
  assert.throws(() => hinweisHinzufuegen(liste, { typ: 'sprechwunsch', titel: 'Unvollständig', erstelltAm: 1 }))
  assert.equal(liste.length, 0)
})

test('Hinweise bleiben in Einfügereihenfolge bestehen und lassen sich gezielt entfernen', () => {
  const liste = []
  const a = hinweisHinzufuegen(liste, { typ: 'ereignis', titel: 'Erster Hinweis', erstelltAm: 0 })
  const b = hinweisHinzufuegen(liste, { typ: 'polizeieinsatz', titel: 'Zweiter Hinweis', erstelltAm: 10000000, einsatzId: 10 })
  assert.deepEqual(liste.map(h => h.id), [a.id, b.id])
  assert.notEqual(a.id, b.id)
  assert.equal(hinweisEntfernen(liste, 'unbekannt'), false)
  assert.equal(liste.length, 2)
  assert.equal(hinweisEntfernen(liste, a.id), true)
  assert.deepEqual(liste, [b])
  assert.equal(hinweisEntfernen(liste, a.id), false)
  assert.equal(istSprachbeitrag(b), false)
})

test('Testhinweise sind explizit markiert, unabhängig und erzeugen keine Fahrzeug- oder Einsatzbindung', () => {
  const a = testHinweiseErstellen(1000), b = testHinweiseErstellen(2000)
  assert.equal(a.length, 4)
  assert.ok(a.every(h => h.test && h.erstelltAm === 1000 && h.einsatzId === null && h.fahrzeugId === null))
  assert.ok(a.every(h => !istSprachbeitrag(h)))
  a[0].titel = 'Geändert'
  assert.notEqual(a[0].titel, b[0].titel)
})

test('Ungültige Hinweise werden nicht in die Warteschlange aufgenommen', () => {
  const liste = []
  assert.throws(() => hinweisHinzufuegen(liste, { typ: 'unbekannt', titel: 'Test', erstelltAm: 1 }))
  assert.throws(() => hinweisHinzufuegen(liste, { titel: '', erstelltAm: 1 }))
  assert.throws(() => hinweisHinzufuegen(liste, { titel: 'Test', erstelltAm: NaN }))
  assert.equal(liste.length, 0)
})
