import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sprechwunschHinzufuegen, sprechwunschAnnehmen } from '../src/data/leitstellenHinweise.js'
import { funkgruppenAusFahrzeugen, funkspruchErzeugen } from '../src/data/funk.js'
import { kommunikationsBeitrag } from '../src/data/kommunikation.js'
import { funkLageBekanntgeben, sprechwunschFreigeben } from '../src/data/einsatzFunk.js'

test('Annahme wählt Gruppe und Teilnehmer; doppelte Annahme entfernt keinen anderen Wunsch', () => {
  const liste = [], f = { id: 1, funkrufname: 'Test', funkgruppe: 'FW' }, funk = { aktiveGruppeId: null, teilnehmerId: null }
  const a = sprechwunschHinzufuegen(liste, f, 'normal', 1)
  const b = sprechwunschHinzufuegen(liste, f, 'dringend', 2)
  assert.equal(sprechwunschAnnehmen(liste, a.id, [f], funk), true)
  assert.deepEqual(funk, { aktiveGruppeId: a.funkgruppeId, teilnehmerId: 1 })
  assert.deepEqual(liste, [b])
  assert.equal(sprechwunschAnnehmen(liste, a.id, [f], funk), false)
})

test('Fehlgeschlagene Annahme lässt Auswahl und Wunsch unverändert', () => {
  const liste = [], f = { id: 1, funkrufname: 'Test', funkgruppe: 'FW' }, funk = { aktiveGruppeId: 'bisher', teilnehmerId: 9 }
  const h = sprechwunschHinzufuegen(liste, f, 'normal', 1)
  assert.throws(() => sprechwunschAnnehmen(liste, h.id, [], funk))
  f.funkgruppe = 'Andere Gruppe'
  assert.throws(() => sprechwunschAnnehmen(liste, h.id, [f], funk))
  assert.deepEqual(funk, { aktiveGruppeId: 'bisher', teilnehmerId: 9 })
  assert.deepEqual(liste, [h])
})

test('App-Annahme und anschließendes Senden erhalten laufendes Telefonat und Telefonbeiträge', () => {
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const annahme = source.slice(source.indexOf('function sprechwunschUebernehmen('), source.indexOf('function funkteilnehmerAuswaehlen('))
  const senden = source.slice(source.indexOf('function funkgruppeAuswaehlen('), source.indexOf('const telefonGespraech'))
  const fahrzeuge = [{ id: 1, funkrufname: 'Florian Test 40/1', funkgruppe: 'FW' }]
  const telefon = kommunikationsBeitrag({ kanal: 'telefon', rolle: 'anrufer', text: 'Hallo', zeit: 100 })
  const k = { leitstellenHinweise: { value: [] }, funk: { value: { aktiveGruppeId: null, teilnehmerId: null } },
    fahrzeuge: { value: fahrzeuge }, funkgruppen: { value: funkgruppenAusFahrzeugen(fahrzeuge) },
    gespraech: { value: [telefon] }, simulationsZeit: { value: 200 }, notrufDialog: { value: true },
    sprechwunschAnnehmen, sprechwunschFreigeben, funkspruchErzeugen, funkLageBekanntgeben, einsaetze: { value: [] }, modulOeffnen: id => { assert.equal(id, 'notruf') } }
  const h = sprechwunschHinzufuegen(k.leitstellenHinweise.value, fahrzeuge[0], 'normal', 123)
  h.meldetext = 'Zimmerbrand bestätigt.'
  const api = new Function('k', `with(k) { ${annahme} ${senden}; return { sprechwunschUebernehmen, funkspruchSenden } }`)(k)
  api.sprechwunschUebernehmen(h.id, r => assert.deepEqual(r, {}))
  assert.equal(k.leitstellenHinweise.value.length, 0)
  assert.equal(k.gespraech.value[0], telefon)
  assert.deepEqual(k.gespraech.value.map(e => e.kanal), ['telefon', 'funk', 'funk'])
  assert.equal(k.gespraech.value[1].absender, 'Leitstelle')
  assert.equal(k.gespraech.value[2].text, h.meldetext)
  assert.equal(k.gespraech.value[2].fahrzeugId, 1)
  assert.equal(k.funk.value.vorbereiteteMeldung, null)
  api.sprechwunschUebernehmen(h.id, r => assert.deepEqual(r, {}))
  assert.equal(k.gespraech.value.length, 3)
  api.funkspruchSenden({ gruppeId: k.funk.value.aktiveGruppeId, fahrzeugId: null, text: 'Verstanden, hier Leitstelle.' }, r => assert.deepEqual(r, {}))
  assert.equal(k.gespraech.value[3].absender, 'Leitstelle')
  assert.equal(k.notrufDialog.value, true)
})
