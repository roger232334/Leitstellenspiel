import test from 'node:test'
import assert from 'node:assert/strict'
import { schichtStartzeit, notrufWartezeit } from '../src/data/schicht.js'

test('Schichtbeginn übernimmt Datum und Uhrzeit und lehnt ungültige Werte ab', () => {
  const start = new Date(schichtStartzeit('2027-12-31', '23:59'))
  assert.equal(start.getFullYear(), 2027)
  assert.equal(start.getMonth(), 11)
  assert.equal(start.getDate(), 31)
  assert.equal(start.getHours(), 23)
  assert.equal(start.getMinutes(), 59)
  assert.ok(Number.isNaN(schichtStartzeit('2027-02-30', '12:00')))
  assert.ok(Number.isNaN(schichtStartzeit('2027-02-20', '25:00')))
  assert.ok(Number.isNaN(schichtStartzeit('', '')))
})

test('Reduzierte Einsatzfrequenz verlängert die Wartezeiten proportional', () => {
  for (const frequenz of [100, 75, 50, 25]) {
    assert.equal(notrufWartezeit(frequenz, 0), 20 * 100 / frequenz)
    assert.equal(notrufWartezeit(frequenz, 0.999), 60 * 100 / frequenz)
  }
  assert.throws(() => notrufWartezeit(0))
})
