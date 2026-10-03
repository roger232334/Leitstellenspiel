import test from 'node:test'
import assert from 'node:assert/strict'
import { computed, reactive } from 'vue'
import { pruefeEinsatzBedarf, bedarfNormalisieren, berechneVerfuegbareRessourcen } from '../src/data/einsatzBedarf.js'
import { bedarfsTestEinsatz } from '../src/data/bedarfsTestEinsaetze.js'
import { standardbeladungFuer } from '../src/data/ausruestung/fahrzeugStandardbeladungen.js'

const hlf = (id, einsatzId = 10, status = 3) => ({ id, einsatzId, status, typ: 'HLF20', beladung: standardbeladungFuer({ typ: 'HLF20' }) })
const brand = () => ({ ...bedarfsTestEinsatz('brand', 10), bedarf: {
  ressourcen: { wasserLiter: 3200, atemschutzgeraete: 6 }, ausruestung: ['beleuchtung', 'schneid-spreizwerkzeug'],
} })

test('Ein Fahrzeug hat Fehlbedarf; zwei individuelle Fahrzeuge ergänzen sich', () => {
  const einsatz = brand(), a = hlf(1), b = hlf(2)
  b.beladung.ausruestung.beleuchtung = false
  b.beladung.ausruestung.schneidSpreizwerkzeug = false
  const allein = pruefeEinsatzBedarf(einsatz, [a])
  assert.deepEqual(allein.ressourcen.wasserLiter, { benoetigt: 3200, vorhanden: 1600, fehlt: 1600, erfuellt: false })
  assert.equal(allein.ressourcen.atemschutzgeraete.fehlt, 2)
  assert.equal(allein.ausruestung.schneidSpreizwerkzeug.erfuellt, true)
  assert.equal(allein.erfuellt, false)
  assert.equal(pruefeEinsatzBedarf(einsatz, [a, b]).erfuellt, true)
  assert.equal(pruefeEinsatzBedarf(einsatz, [a, a, { ...a }]).ressourcen.wasserLiter.vorhanden, 1600)
  assert.equal(berechneVerfuegbareRessourcen([a, b]).ressourcen.atemschutzgeraete, 8)
})

test('Nur reale Zuordnung und Status 3/4 zählen; Vorschläge, andere Einsätze und Transport nicht', () => {
  const einsatz = brand()
  einsatz.fahrzeuge = [1, 2, 3, 4, 5, 6]
  const flotte = [hlf(1, null, 2), hlf(2, 99, 4), hlf(3, 10, 7), hlf(4, 10, 8), hlf(5, 10, 6), hlf(6, 10, 1)]
  assert.equal(pruefeEinsatzBedarf(einsatz, flotte).ressourcen.wasserLiter.vorhanden, 0)
  flotte.push(hlf(7, 10, 3), hlf(8, 10, 4))
  assert.equal(pruefeEinsatzBedarf(einsatz, flotte).ressourcen.wasserLiter.vorhanden, 3200)
  assert.equal(pruefeEinsatzBedarf(einsatz, flotte, { nurAmOrt: true }).ressourcen.wasserLiter.vorhanden, 1600)
})

test('Hauptbedarf zählt eigene und Untereinsatzfahrzeuge; eigener Unterbedarf bleibt lokal', () => {
  const haupt = brand(), kind = { id: 11, typ: 'unter', parentId: 10 }
  const fremd = { id: 12, typ: 'unter', parentId: 99 }
  const einsaetze = [haupt, kind, fremd], flotte = [hlf(1, 10), hlf(2, 11), hlf(3, 12)]
  assert.equal(pruefeEinsatzBedarf(haupt, flotte, { einsaetze }).ressourcen.wasserLiter.vorhanden, 3200)
  assert.deepEqual(pruefeEinsatzBedarf(kind, flotte, { einsaetze }), pruefeEinsatzBedarf(haupt, flotte, { einsaetze }))
  kind.bedarf = { ressourcen: { wasserLiter: 2000 } }
  const lokal = pruefeEinsatzBedarf(kind, flotte, { einsaetze })
  assert.equal(lokal.einsatzId, 11)
  assert.equal(lokal.ressourcen.wasserLiter.fehlt, 400)
})

test('Unbekannter Bedarf ist nicht erfüllt; leerer Bedarf ist explizit erfüllt', () => {
  assert.equal(pruefeEinsatzBedarf({ id: 10 }, []).erfuellt, null)
  assert.equal(pruefeEinsatzBedarf({ id: 10 }, []).definiert, false)
  assert.equal(pruefeEinsatzBedarf({ id: 10, bedarf: {} }, []).erfuellt, true)
  assert.equal(pruefeEinsatzBedarf(brand(), []).erfuellt, false)
  assert.equal(pruefeEinsatzBedarf(brand(), [{ id: 1, einsatzId: 10, status: 4 }]).ressourcen.wasserLiter.vorhanden, 0)
  assert.equal(pruefeEinsatzBedarf(brand(), [hlf(1)]).ressourcen.wasserLiter.vorhanden, 1600)
})

test('Fähigkeiten nutzen bestehende Regeln auf dem konkreten Fahrzeug', () => {
  const einsatz = { id: 10, bedarf: { faehigkeiten: ['beleuchtung', 'notarzt'] } }
  const a = hlf(1), b = hlf(2)
  a.beladung.ausruestung.stromerzeuger = false
  b.beladung.ausruestung.beleuchtung = false
  b.hatNotarzt = true
  const lage = pruefeEinsatzBedarf(einsatz, [a, b])
  assert.equal(lage.faehigkeiten.beleuchtung.erfuellt, false)
  assert.equal(lage.faehigkeiten.notarzt.erfuellt, true)
  a.beladung.ausruestung.stromerzeuger = true
  assert.equal(pruefeEinsatzBedarf(einsatz, [a, b]).erfuellt, true)
})

test('Reaktive Änderungen an Zuordnung, Status, Bedarf und Beladung werden ohne Cache ausgewertet', () => {
  const einsatz = reactive(brand()), flotte = reactive([hlf(1, null, 2), hlf(2, null, 2)])
  const lage = computed(() => pruefeEinsatzBedarf(einsatz, flotte))
  assert.equal(lage.value.ressourcen.wasserLiter.fehlt, 3200)
  Object.assign(flotte[0], { einsatzId: 10, status: 3 })
  assert.equal(lage.value.ressourcen.wasserLiter.fehlt, 1600)
  Object.assign(flotte[1], { einsatzId: 10, status: 4 })
  assert.equal(lage.value.erfuellt, true)
  flotte[0].beladung.ressourcen.wasserLiter = 600
  assert.equal(lage.value.ressourcen.wasserLiter.fehlt, 1000)
  einsatz.bedarf.ressourcen.wasserLiter = 2200
  assert.equal(lage.value.erfuellt, true)
  flotte[0].einsatzId = null
  assert.equal(lage.value.ressourcen.wasserLiter.fehlt, 600)
  flotte.splice(1, 1)
  assert.equal(lage.value.ressourcen.wasserLiter.vorhanden, 0)
})

test('Ungültige Anforderungen werden abgewiesen, Aliase vereinheitlicht', () => {
  for (const bedarf of [[], false, { ressourcen: [] }, { ressourcen: { wasserLiter: -1 } },
    { ressourcen: { wasserLiter: '3200' } }, { ressourcen: { falsch: 2 } },
    { ausruestung: 'boot' }, { ausruestung: ['falsch'] }, { faehigkeiten: ['falsch'] }]) {
    assert.throws(() => bedarfNormalisieren(bedarf))
  }
  assert.deepEqual(bedarfNormalisieren({ ausruestung: ['schneid-spreizwerkzeug', 'schneidSpreizwerkzeug'] }).ausruestung, ['schneidSpreizwerkzeug'])
})

test('Testeinsätze erzeugen frische, markierte Daten und verändern keine Fahrzeugbestände', () => {
  const a = bedarfsTestEinsatz('brand', 1), b = bedarfsTestEinsatz('brand', 2)
  a.bedarf.ressourcen.wasserLiter = 10
  assert.equal(b.bedarf.ressourcen.wasserLiter, 3200)
  assert.match(a.meldung, /TEST/)
  assert.equal(bedarfsTestEinsatz('thl', 3).bedarf.ausruestung.includes('schneidSpreizwerkzeug'), true)
  assert.throws(() => bedarfsTestEinsatz('falsch', 4))
})
