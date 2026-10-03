import test from 'node:test'
import assert from 'node:assert/strict'
import { simulationsUhr, simulationsGeschwindigkeiten } from '../src/services/simulationsZeit.js'
import { zeitplanungErstellen, einsatzAlarmiert, fahrzeugAlarmieren, fahrzeugRouteUebernehmen, fahrzeugeFortschreiben, lebenszyklenFortschreiben } from '../src/data/einsatzLebenszyklus.js'
import { generiereEinsatz } from '../src/data/einsaetze/einsatzGenerator.js'

function setup() {
  const e = { id: 1, typ: 'haupt', status: 'offen', fahrzeuge: [1], szenario: { lageBekannt: false } }
  const f = { id: 1, typ: 'HLF', status: 2, einsatzId: null }
  const einsaetze = [e], fahrzeuge = [f], events = []
  const hook = event => events.push(event)
  einsatzAlarmiert(einsaetze, e, 0, hook)
  fahrzeugAlarmieren(f, e.id, 0)
  const tick = zeit => { fahrzeugeFortschreiben(fahrzeuge, zeit); lebenszyklenFortschreiben(einsaetze, fahrzeuge, zeit, hook) }
  return { e, f, einsaetze, fahrzeuge, events, hook, tick }
}

test('Zentrale Uhr skaliert alle Faktoren und wechselt ohne Sprung', () => {
  for (const faktor of simulationsGeschwindigkeiten) {
    const uhr = simulationsUhr(10000, 0)
    uhr.geschwindigkeit(faktor, 0)
    assert.equal(uhr.tick(1000).zeit, 10000 + faktor * 1000)
  }
  const uhr = simulationsUhr(0, 0)
  assert.equal(uhr.geschwindigkeit(10, 2000).zeit, 2000)
  assert.equal(uhr.tick(3000).zeit, 12000)
  assert.equal(uhr.geschwindigkeit(2, 3500).zeit, 17000)
  assert.equal(uhr.tick(4000).zeit, 18000)
  assert.equal(uhr.tick(3900).zeit, 18000)
  assert.throws(() => uhr.geschwindigkeit(3, 4000))
})

test('Dauer wird einmal gezogen und auf positive Phasen verteilt; Altbestand erhält 30 Minuten', () => {
  assert.equal(zeitplanungErstellen().dauerSekunden, 1800)
  for (const zufall of [0, 0.5, 0.99999]) {
    const p = zeitplanungErstellen({ basisMinuten: 30, schwankungMinuten: 10 }, () => zufall)
    assert.ok(p.dauerSekunden >= 1200 && p.dauerSekunden <= 2400)
    assert.equal(Object.values(p.phasenSekunden).reduce((a, b) => a + b), p.dauerSekunden)
  }
  const e = generiereEinsatz('zimmerbrand', { zufall: () => 0.5 })
  assert.equal(e.zeitplanung.dauerSekunden, 1500)
  assert.deepEqual(JSON.parse(JSON.stringify(e)).zeitplanung, e.zeitplanung)
  assert.throws(() => zeitplanungErstellen({ basisMinuten: 1, schwankungMinuten: 2 }))
})

test('Fahrzeug bleibt bis Ende gebunden; Erkundung deckt Lage auf; Hooks entstehen nur einmal', () => {
  const { e, f, tick, events } = setup()
  tick(59000); assert.equal(e.lebenszyklus.phase, 'alarmiert')
  tick(60000); assert.equal(e.lebenszyklus.phase, 'anfahrt')
  tick(360000); assert.equal(f.status, 4); assert.equal(e.lebenszyklus.phase, 'erkundung')
  tick(400000); assert.equal(f.einsatzId, 1); assert.equal(f.status, 4)
  tick(540000); assert.equal(e.lebenszyklus.phase, 'massnahmen'); assert.equal(e.szenario.lageBekannt, true)
  tick(1889999); assert.equal(e.lebenszyklus.phase, 'massnahmen')
  tick(1890000); assert.equal(e.lebenszyklus.phase, 'abschluss'); assert.equal(f.status, 4)
  tick(2160000); assert.equal(e.lebenszyklus.phase, 'beendet'); assert.equal(f.einsatzId, null); assert.equal(f.status, 2)
  assert.equal(e.status, 'abgeschlossen')
  assert.deepEqual(events.map(e => e.typ), ['einsatzAlarmiert', 'anfahrtGestartet', 'erstesFahrzeugEingetroffen', 'erkundungGestartet', 'erkundungAbgeschlossen', 'massnahmenGestartet', 'einsatzAbschluss', 'einsatzBeendet'])
  tick(9999999); assert.equal(events.length, 8)
})

test('Späte Fahrzeuge und Nachalarmierung setzen die gemeinsame Phase nicht zurück', () => {
  const { e, f, tick, einsaetze, fahrzeuge, hook } = setup()
  const kind = { id: 2, typ: 'unter', parentId: 1, status: 'offen', fahrzeuge: [2] }
  einsaetze.push(kind)
  tick(600000)
  const zweites = { id: 2, typ: 'RTW' }; fahrzeuge.push(zweites)
  einsatzAlarmiert(einsaetze, kind, 600000, hook); fahrzeugAlarmieren(zweites, 2, 600000)
  tick(960000)
  assert.equal(e.lebenszyklus.arbeitsbeginn, 360000)
  assert.equal(zweites.status, 4)
  tick(2160000)
  assert.equal(f.einsatzId, null); assert.equal(zweites.einsatzId, null)
  assert.equal(zweites.status, 1); assert.equal(kind.status, 'abgeschlossen')
})

test('Großer Zeitschritt überspringt keine Phasen und liefert gleiche Endzeit', () => {
  const a = setup(), b = setup()
  a.tick(3000000)
  for (let t = 0; t <= 3000000; t += 250) b.tick(t)
  assert.deepEqual(a.events, b.events)
  assert.equal(a.e.lebenszyklus.beendetAm, b.e.lebenszyklus.beendetAm)
})

test('Routingdauer bleibt erhalten; Ankunft, Ausrückzeit und späte Netzantworten sind sicher', () => {
  const { f, tick } = setup(), fahrt = f.fahrt
  const route = { dauerSekunden: 600, punkte: [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }] }
  assert.equal(fahrzeugRouteUebernehmen(f, fahrt, route), true)
  tick(100000); assert.equal(f.status, 3)
  tick(660000); assert.equal(f.status, 4); assert.deepEqual(f.position, { lat: 2, lng: 2 })
  assert.equal(fahrzeugRouteUebernehmen(f, fahrt, route), false)
  tick(3000000)
  assert.equal(fahrzeugRouteUebernehmen(f, fahrt, route), false)
})

test('Ohne geeignetes eingetroffenes Fahrzeug läuft keine Erkundung', () => {
  const { e, f, tick } = setup()
  e.erkundungsFaehigkeit = 'notarzt'
  tick(360000)
  assert.equal(e.lebenszyklus.arbeitsbeginn, null)
  f.hatNotarzt = true
  tick(400000)
  assert.equal(e.lebenszyklus.phase, 'erkundung')
})
