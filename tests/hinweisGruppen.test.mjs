import test from 'node:test'
import assert from 'node:assert/strict'
import { hinweiseGruppieren, sprechwunschHinzufuegen, hinweisHinzufuegen } from '../src/data/leitstellenHinweise.js'
import { sprechwunschFreigeben } from '../src/data/einsatzFunk.js'

test('Sprechwünsche werden nach Funkgruppe und Priorität getrennt, gleiche Prioritäten bleiben gebündelt', () => {
  const liste = []
  const f = { id: 1, funkrufname: 'Test', funkgruppe: 'FW' }
  sprechwunschHinzufuegen(liste, f, 'normal', 1)
  const dringend = sprechwunschHinzufuegen(liste, { ...f, id: 2 }, 'dringend', 2)
  sprechwunschHinzufuegen(liste, { ...f, id: 4 }, 'normal', 2)
  sprechwunschHinzufuegen(liste, { ...f, id: 3, funkgruppe: 'RD' }, 'normal', 3)
  for (let i = 0; i < 2; i++) hinweisHinzufuegen(liste, { typ: 'polizeieinsatz', titel: `Polizei ${i}`, erstelltAm: i })
  const gruppen = hinweiseGruppieren(liste)
  assert.equal(gruppen.length, 4)
  assert.equal(gruppen[0].titel, 'FW')
  assert.equal(gruppen[0].dringend, false)
  assert.equal(gruppen[0].hinweise.length, 2)
  assert.equal(gruppen[1].titel, 'FW')
  assert.equal(gruppen[1].dringend, true)
  assert.deepEqual(gruppen[1].hinweise, [dringend])
  assert.notEqual(gruppen[0].id, gruppen[1].id)
  assert.equal(gruppen[3].hinweise.length, 2)
  assert.equal(liste.length, 6)
  liste.splice(liste.indexOf(dringend), 1)
  assert.equal(hinweiseGruppieren(liste)[0].dringend, false)
  assert.equal(hinweiseGruppieren(liste).length, 3)
  assert.equal(hinweiseGruppieren(liste)[0].id, gruppen[0].id)
})

test('Freigabe betrifft nur ausgewählten Wunsch und gibt Lage erst durch gesprochenen Bericht frei', () => {
  const liste = [], funk = {}, verlauf = []
  const fahrzeuge = [{ id: 1, funkrufname: 'Florian 1', funkgruppe: 'FW' }, { id: 2, funkrufname: 'Florian 2', funkgruppe: 'FW' }]
  const e = { id: 10, szenario: { erkundet: true, lageDurchFunk: true, lageBekannt: false } }
  const a = sprechwunschHinzufuegen(liste, fahrzeuge[0], 'normal', 1)
  const b = sprechwunschHinzufuegen(liste, fahrzeuge[1], 'dringend', 2)
  Object.assign(b, { meldetext: 'Zimmerbrand bestätigt.', einsatzId: 10, phasenEreignis: 'erkundungAbgeschlossen' })
  assert.throws(() => sprechwunschFreigeben(b.id, liste, [], funk, [e], verlauf, 3))
  assert.equal(liste.length, 2)
  assert.equal(verlauf.length, 0)
  assert.equal(e.szenario.lageBekannt, false)
  sprechwunschFreigeben(b.id, liste, fahrzeuge, funk, [e], verlauf, 3)
  assert.deepEqual(liste, [a])
  assert.equal(verlauf[0].absender, 'Leitstelle')
  assert.match(verlauf[0].text, /Florian 2/)
  assert.equal(verlauf[1].text, b.meldetext)
  assert.equal(e.szenario.lageBekannt, true)
  assert.equal(funk.teilnehmerId, 2)
  sprechwunschFreigeben(a.id, liste, fahrzeuge, funk, [e], verlauf, 4)
  assert.equal(verlauf.length, 3, 'Ohne hinterlegten Text wird keine Fahrzeugantwort erfunden')
  assert.equal(liste.length, 0)
})
