import test from 'node:test'
import assert from 'node:assert/strict'
import { phasenSprechwunschErzeugen } from '../src/data/einsatzFunk.js'
import { generiereEinsatz } from '../src/data/einsaetze/einsatzGenerator.js'
import { einsatzKatalog } from '../src/data/einsaetze/einsatzKatalog.js'
import { einsatzAlarmiert, fahrzeugAlarmieren, fahrzeugeFortschreiben, lebenszyklenFortschreiben } from '../src/data/einsatzLebenszyklus.js'
import { sprechwunschAnnehmen } from '../src/data/leitstellenHinweise.js'

test('Lebenszyklus erzeugt genau drei Sprechwünsche mit Szenariotext, auch bei großem Zeitschritt', () => {
  for (const schritte of [[360000, 540000, 1890000, 2160000], [3000000]]) {
    const e = { ...generiereEinsatz('zimmerbrand', { zufall: () => 0.7 }), id: 1, typ: 'haupt', status: 'offen', fahrzeuge: [1] }
    // Feste Phasendauer für beide Arten der Zeitfortschreibung.
    delete e.zeitplanung
    const f = { id: 1, funkrufname: 'Florian Test 40/1', funkgruppe: 'FW', status: 2 }
    const hinweise = [], events = []
    const hook = event => { events.push(event); phasenSprechwunschErzeugen(event, [e], [f], hinweise) }
    einsatzAlarmiert([e], e, 0, hook)
    fahrzeugAlarmieren(f, 1, 0)
    assert.equal(hinweise.length, 0)
    for (const zeit of schritte) {
      fahrzeugeFortschreiben([f], zeit)
      lebenszyklenFortschreiben([e], [f], zeit, hook)
    }
    assert.deepEqual(hinweise.map(h => h.phasenEreignis), ['erstesFahrzeugEingetroffen', 'erkundungAbgeschlossen', 'einsatzAbschluss'])
    for (const h of hinweise) {
      assert.equal(h.meldetext, e.szenario.funkmeldungen[h.phasenEreignis].text)
      assert.equal(h.fahrzeugId, 1)
      assert.equal(h.einsatzId, 1)
    }
    hinweise.splice(0)
    assert.equal(phasenSprechwunschErzeugen({ typ: 'unbekannt', einsatzId: 1, zeit: 0 }, [e], [f], hinweise), null)
    const wiederholung = events.find(ev => ev.typ === 'erkundungAbgeschlossen')
    assert.equal(phasenSprechwunschErzeugen(wiederholung, [e], [f], hinweise), null)
    assert.equal(hinweise.length, 0)
  }
})

test('Nur zugeordnete, zum Ereignis eingetroffene Funkfahrzeuge zählen; Untereinsätze zählen mit', () => {
  const e = { id: 1, szenario: { funkmeldungen: { erkundungAbgeschlossen: { text: 'Lage bestätigt.', prioritaet: 'dringend' } } } }
  const kind = { id: 2, parentId: 1, typ: 'unter' }
  const basis = { funkrufname: 'Test', funkgruppe: 'FW', einsatzId: 2, status: 4 }
  const fahrzeuge = [
    { ...basis, id: 1, einsatzId: 99 }, { ...basis, id: 2, status: 3 },
    { ...basis, id: 3, funkgruppe: '' }, { ...basis, id: 4, fahrt: { eingetroffenAm: 200 } },
    { ...basis, id: 5, fahrt: { eingetroffenAm: 50 } },
  ]
  const event = { typ: 'erkundungAbgeschlossen', einsatzId: 1, zeit: 100 }
  assert.equal(phasenSprechwunschErzeugen(event, [e, kind], fahrzeuge.slice(0, 4), []), null)
  const liste = []
  const h = phasenSprechwunschErzeugen(event, [e, kind], fahrzeuge, liste)
  assert.equal(h.fahrzeugId, 5)
  assert.equal(h.einsatzId, 1)
  assert.equal(h.prioritaet, 'dringend')
  assert.equal(phasenSprechwunschErzeugen(event, [e, kind], fahrzeuge, liste), null)
  assert.equal(liste.length, 1)
  assert.equal(phasenSprechwunschErzeugen(event, [{ id: 1 }], fahrzeuge, []), null)
})

test('Meldetexte sind unabhängige Szenariokopien; Annahme bereitet Sprache vor und schützt ungesendete Meldungen', () => {
  const vorher = JSON.stringify(einsatzKatalog)
  const e = { ...generiereEinsatz('zimmerbrand', { zufall: () => 0.9 }), id: 1 }
  const f = { id: 1, funkrufname: 'Test', funkgruppe: 'FW', einsatzId: 1, status: 4 }
  const liste = [], funk = {}
  const a = phasenSprechwunschErzeugen({ typ: 'erkundungAbgeschlossen', einsatzId: 1, zeit: 100 }, [e], [f], liste)
  const b = phasenSprechwunschErzeugen({ typ: 'einsatzAbschluss', einsatzId: 1, zeit: 200 }, [e], [f], liste)
  assert.equal(a.prioritaet, 'dringend')
  sprechwunschAnnehmen(liste, a.id, [f], funk)
  assert.equal(funk.vorbereiteteMeldung.text, a.meldetext)
  assert.deepEqual(liste, [b])
  assert.throws(() => sprechwunschAnnehmen(liste, b.id, [f], funk), /zuerst/)
  assert.equal(funk.vorbereiteteMeldung.id, a.id)
  e.szenario.funkmeldungen.erkundungAbgeschlossen.text = 'Verändert'
  assert.equal(JSON.stringify(einsatzKatalog), vorher)
})
