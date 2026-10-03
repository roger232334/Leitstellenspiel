import test from 'node:test'
import assert from 'node:assert/strict'
import { ausruestungsKatalog, ausruestungsKategorien } from '../src/data/ausruestung/ausruestungsKatalog.js'
import { leereBeladung, standardbeladungFuer } from '../src/data/ausruestung/fahrzeugStandardbeladungen.js'
import { beladungNormalisieren, fahrzeugRessource, fahrzeugHatAusruestung, fahrzeugHatFaehigkeit, beladungenSummieren, einsatzFehlbedarf } from '../src/data/ausruestung/beladung.js'
import { fahrzeugDatenLaden, fahrzeugDatenSpeichern, fahrzeugeFuerSchicht } from '../src/data/fahrzeugVerwaltung.js'

const hlf = id => ({ id, typ: 'HLF20', fahrzeugArtId: '40-HLF20', funkrufname: `Florian Test 40/${id}`, bereich: 'FW', startStatus: 2 })
test('Katalog enthält eindeutige IDs und gültige Kategorien', () => {
  assert.equal(new Set(ausruestungsKatalog.map(e => e.id)).size, ausruestungsKatalog.length)
  for (const e of ausruestungsKatalog) assert.ok(ausruestungsKategorien.some(k => k.id === e.kategorie))
})
test('Altbestand erhält unabhängige Vorlagen; unbekannte Typen starten leer', () => {
  const a = beladungNormalisieren(hlf(1)), b = beladungNormalisieren(hlf(2))
  assert.equal(a.ressourcen.wasserLiter, 1600)
  a.ressourcen.wasserLiter = 900; a.ausruestung.kettensaege = false
  assert.equal(b.ressourcen.wasserLiter, 1600)
  assert.equal(b.ausruestung.kettensaege, true)
  assert.equal(standardbeladungFuer(hlf(1)).ressourcen.wasserLiter, 1600)
  assert.deepEqual(beladungNormalisieren({ typ: 'Unbekannt' }), leereBeladung())
  assert.equal(fahrzeugRessource({}, 'wasserLiter'), 0)
  assert.equal(fahrzeugHatAusruestung({}, 'kettensaege'), false)
})
test('Individuelle Beladung wird gespeichert und bleibt in Schichtkopien isoliert', () => {
  let text
  const speicher = { setItem: (_, wert) => { text = wert }, getItem: () => text }
  const a = { ...hlf(1), beladung: standardbeladungFuer(hlf(1)) }, b = { ...hlf(2), beladung: standardbeladungFuer(hlf(2)) }
  a.beladung.ressourcen.wasserLiter = 0
  a.beladung.ausruestung.schneidSpreizwerkzeug = false
  b.beladung.ressourcen.wasserLiter = 2000
  fahrzeugDatenSpeichern({ version: 1, naechsteId: 3, fahrzeuge: [a, b] }, speicher)
  const daten = fahrzeugDatenLaden(speicher), live = fahrzeugeFuerSchicht(daten, Date.now())
  assert.equal(live[0].beladung.ressourcen.wasserLiter, 0)
  assert.equal(live[0].beladung.ausruestung.schneidSpreizwerkzeug, false)
  assert.equal(live[1].beladung.ressourcen.wasserLiter, 2000)
  live[1].beladung.ressourcen.wasserLiter = 50
  live[0].beladung.ausruestung.boot = true
  assert.equal(daten.fahrzeuge[1].beladung.ressourcen.wasserLiter, 2000)
  assert.equal(daten.fahrzeuge[0].beladung.ausruestung.boot, false)
  assert.deepEqual(beladungNormalisieren({ ...hlf(3), beladung: { version: 1 } }), leereBeladung())
})
test('Ungültige Mengen, Wahrheitswerte und unbekannte Felder werden beim Speichern abgelehnt', () => {
  for (const wert of [-1, 1.5, NaN, Infinity, '', '1600', Number.MAX_SAFE_INTEGER + 1]) {
    const b = leereBeladung(); b.ressourcen.wasserLiter = wert
    assert.throws(() => beladungNormalisieren({ beladung: b }))
  }
  const b = leereBeladung(); b.ausruestung.boot = 'false'
  assert.throws(() => beladungNormalisieren({ beladung: b }))
  assert.throws(() => beladungNormalisieren({ beladung: { version: 2 } }))
  assert.throws(() => beladungNormalisieren({ beladung: { version: 1, ausruestung: { tippfehler: true } } }))
  assert.equal(fahrzeugRessource({ beladung: b }, 'wasserLiter'), 0)
})
test('Fähigkeiten folgen der individuellen Ausrüstung und vorhandenen Merkmalen', () => {
  const f = { ...hlf(1), beladung: standardbeladungFuer(hlf(1)), hatNotarzt: false, istFirstResponder: true }
  assert.equal(fahrzeugHatAusruestung(f, 'schneid-spreizwerkzeug'), true)
  assert.equal(fahrzeugHatFaehigkeit(f, 'technische-rettung'), true)
  f.beladung.ausruestung.schneidSpreizwerkzeug = false
  assert.equal(fahrzeugHatFaehigkeit(f, 'technische-rettung'), false)
  assert.equal(fahrzeugHatFaehigkeit(f, 'beleuchtung'), true)
  f.beladung.ausruestung.stromerzeuger = false
  assert.equal(fahrzeugHatFaehigkeit(f, 'beleuchtung'), false)
  assert.equal(fahrzeugHatFaehigkeit(f, 'notarzt'), false)
  assert.equal(fahrzeugHatFaehigkeit(f, 'medizinische-erstversorgung'), true)
  assert.equal(fahrzeugHatFaehigkeit({ typ: 'RTW' }, 'patiententransport'), true)
  assert.equal(fahrzeugHatFaehigkeit(f, 'unbekannt'), false)
})
test('Zwei reale Fahrzeuge erfüllen gemeinsamen Bedarf; doppelte IDs zählen nicht doppelt', () => {
  const bedarf = { ressourcen: { wasserLiter: 3200, atemschutzgeraete: 6 }, ausruestung: ['beleuchtung', 'schneid-spreizwerkzeug'] }
  const a = hlf(1), b = hlf(2)
  assert.deepEqual(einsatzFehlbedarf(bedarf, [a]), { ressourcen: { wasserLiter: 1600, atemschutzgeraete: 2 }, ausruestung: [], erfuellt: false })
  assert.equal(einsatzFehlbedarf(bedarf, [a, b]).erfuellt, true)
  assert.equal(beladungenSummieren([a, a, { ...a }]).ressourcen.wasserLiter, 1600)
  assert.deepEqual(einsatzFehlbedarf({ ausruestung: ['boot'] }, [a]).ausruestung, ['boot'])
  assert.throws(() => einsatzFehlbedarf({ ressourcen: { falsch: 5 } }, [a]))
  assert.throws(() => einsatzFehlbedarf({ ausruestung: ['falsch'] }, [a]))
})
