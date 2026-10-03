import test from 'node:test'
import assert from 'node:assert/strict'
import { fahrzeugArten, fahrzeugArtZu, simulationsTyp } from '../src/data/fahrzeugArten.js'
import { fahrzeugPruefen, fahrzeugeFuerSchicht } from '../src/data/fahrzeugVerwaltung.js'

test('Alle neun Fahrzeuganlagen sind enthalten, Varianten und Kennzahlen bleiben unterscheidbar', () => {
  for (let i = 1; i <= 9; i++) assert.ok(fahrzeugArten.some(a => a.anlage === `2.${i}`))
  assert.equal(new Set(fahrzeugArten.map(a => a.id)).size, fahrzeugArten.length)
  assert.equal(fahrzeugArtZu('40-HLF20').kennzahl, '40')
  assert.equal(fahrzeugArtZu('42-HLF10').kennzahl, '42')
  assert.match(fahrzeugArtZu('20-TLF16/25-RS').name, /mit Rettungssatz/)
  assert.equal(fahrzeugArtZu('21-TLF16/25').kennzahl, '21')
  assert.ok(fahrzeugArtZu('71-RTW-SEG'))
  assert.ok(fahrzeugArtZu('95-ATV WR'))
})

test('Gewählte Variante überlebt Validierung und Schichtstart, bestehende AAO-Klasse bleibt nutzbar', () => {
  const f = fahrzeugPruefen({ id: 1, funkrufname: 'Florian Test 40/1', typ: 'HLF', fahrzeugArtId: '40-HLF20', bereich: 'FW', startStatus: 2 })
  const live = fahrzeugeFuerSchicht({ version: 1, naechsteId: 2, fahrzeuge: [f] }, Date.now())[0]
  assert.equal(live.typ, 'HLF20')
  assert.equal(live.fahrzeugArtId, '40-HLF20')
  assert.equal(simulationsTyp(live), 'HLF')
  assert.equal(simulationsTyp({ typ: 'HLF' }), 'HLF')
  assert.equal(simulationsTyp({ typ: 'S-RTW', fahrzeugArtId: '71-S-RTW' }), 'RTW')
  assert.throws(() => fahrzeugPruefen({ ...f, fahrzeugArtId: 'falsch' }))
})
