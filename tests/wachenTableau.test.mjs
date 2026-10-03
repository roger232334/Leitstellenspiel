import { test } from 'node:test'
import assert from 'node:assert/strict'
import { neueSeite, neueWache, standardWachen, wachenLaden, fahrzeugInWache, wacheVerschieben, wachenRasterAendern } from '../src/data/wachenTableau.js'
const fahrzeuge = [{ id: 1, bereich: 'RD' }, { id: 2, bereich: 'RD' }, { id: 3, bereich: 'FW' }]

test('Seiten und benannte Wachen bleiben nach Speichern und Laden erhalten', () => {
  const daten = standardWachen(fahrzeuge)
  const s = neueSeite('Eigene Seite')
  s.wachen.push(neueWache('Wache Nord', 2, 1))
  daten.seiten.push(s)
  daten.aktiveSeiteId = s.id
  fahrzeugInWache(s, 1, s.wachen[0].id)
  const geladen = wachenLaden(JSON.stringify(daten), null, fahrzeuge)
  assert.deepEqual(geladen, daten)
  assert.equal(geladen.seiten[0].wachen[0].fahrzeugIds.length, 2)
  assert.equal(geladen.seiten[2].wachen[0].fahrzeugIds[0], 1, 'Dasselbe Fahrzeug darf auf mehreren Seiten erscheinen')
})

test('Fahrzeuge verschieben und innerhalb der Wache sortieren erzeugt keine Duplikate', () => {
  const s = neueSeite()
  const a = neueWache('A', 0, 0), b = neueWache('B', 1, 0)
  s.wachen.push(a, b)
  fahrzeugInWache(s, 1, a.id)
  fahrzeugInWache(s, 2, a.id)
  fahrzeugInWache(s, 1, b.id)
  assert.deepEqual(a.fahrzeugIds, [2])
  assert.deepEqual(b.fahrzeugIds, [1])
  fahrzeugInWache(s, 1, a.id, 2)
  assert.deepEqual(a.fahrzeugIds, [1, 2])
  fahrzeugInWache(s, 1, a.id)
  assert.deepEqual(a.fahrzeugIds, [2, 1])
  assert.equal(fahrzeugInWache(s, 1, 'fehlend'), false)
  assert.deepEqual(a.fahrzeugIds, [2, 1])
})

test('Wachen tauschen Rasterplätze und können beim Verkleinern nicht verschwinden', () => {
  const s = neueSeite()
  const a = neueWache('A', 0, 0), b = neueWache('B', 3, 2)
  a.fahrzeugIds.push(1)
  s.wachen.push(a, b)
  assert.equal(wacheVerschieben(s, a.id, 3, 2), true)
  assert.deepEqual([b.spalte, b.zeile], [0, 0])
  assert.deepEqual(a.fahrzeugIds, [1])
  assert.equal(wachenRasterAendern(s, 2, 2), false)
  assert.equal(wacheVerschieben(s, a.id, -1, 0), false)
  assert.equal(wachenRasterAendern(s, 5, 5), true)
})

test('Vorheriges Fahrzeugraster wird ohne Verlust in Wachen migriert', () => {
  const vorher = { version: 1, aktiveSeiteId: 'rd', seiten: [{ id: 'rd', name: 'RD', spalten: 8, zeilen: 8,
    positionen: [{ fahrzeugId: 1, spalte: 4, zeile: 3 }, { fahrzeugId: 2, spalte: 1, zeile: 2 }] }] }
  const nachher = wachenLaden(null, JSON.stringify(vorher), fahrzeuge)
  assert.equal(nachher.version, 2)
  assert.equal(nachher.seiten[0].name, 'RD')
  assert.deepEqual(nachher.seiten[0].wachen.map(w => [w.spalte, w.zeile, w.fahrzeugIds]), [[4, 3, [1]], [1, 2, [2]]])
})

test('Ungültiger Speicher wird erkannt; nicht mehr vorhandene Fahrzeuge werden ausgeblendet', () => {
  assert.throws(() => wachenLaden('{', null, fahrzeuge))
  const daten = standardWachen(fahrzeuge)
  assert.deepEqual(wachenLaden(JSON.stringify(daten), null, []).seiten[0].wachen[0].fahrzeugIds, [])
  daten.seiten[0].wachen.push({ ...neueWache('Doppelt', 1, 0), fahrzeugIds: [1] })
  assert.throws(() => wachenLaden(JSON.stringify(daten), null, fahrzeuge), /Doppelte/)
})
