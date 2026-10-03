import test from 'node:test'
import assert from 'node:assert/strict'
import { fachdienste } from '../src/data/fachdienste.js'
import { fahrzeugDatenSpeichern, fahrzeugDatenLaden, fahrzeugeFuerSchicht } from '../src/data/fahrzeugVerwaltung.js'
import { standardWachen, wachenLaden } from '../src/data/wachenTableau.js'
import { standardTableau } from '../src/data/fahrzeugTableau.js'

test('Alle Fachdienste bleiben nach Speichern, Laden und Schichtstart erhalten', () => {
  const fahrzeuge = fachdienste.map((d, i) => ({ id: i + 1, funkrufname: `Fahrzeug ${i}`, typ: 'MZF', bereich: d.id, startStatus: 2 }))
  let text
  const speicher = { getItem: () => text, setItem: (_, wert) => { text = wert } }
  fahrzeugDatenSpeichern({ version: 1, naechsteId: 100, fahrzeuge }, speicher)
  const live = fahrzeugeFuerSchicht(fahrzeugDatenLaden(speicher), Date.now())
  assert.deepEqual(live.map(f => f.bereich), fachdienste.map(d => d.id))
  const tableau = standardWachen(live)
  for (const [i, dienst] of fachdienste.entries()) {
    assert.deepEqual(tableau.seiten.find(s => s.name === dienst.name).wachen[0].fahrzeugIds, [i + 1])
    assert.deepEqual(standardTableau(live).seiten.find(s => s.name === dienst.name).positionen.map(p => p.fahrzeugId), [i + 1])
  }
  assert.deepEqual(wachenLaden(JSON.stringify(tableau), null, live), tableau)
})

test('Unbekannte Zuordnung landet nicht im Rettungsdienst; bestehende Anordnung bleibt erhalten', () => {
  const fahrzeuge = [{ id: 1, bereich: 'BR' }, { id: 2, bereich: 'unbekannt' }]
  const tableau = standardWachen(fahrzeuge)
  assert.deepEqual(tableau.seiten[0].wachen[0].fahrzeugIds, [])
  assert.deepEqual(tableau.seiten.find(s => s.name === 'Sonstige').wachen[0].fahrzeugIds, [2])
  tableau.seiten[0].name = 'Meine eigene Seite'
  assert.equal(wachenLaden(JSON.stringify(tableau), null, fahrzeuge).seiten[0].name, 'Meine eigene Seite')
})
