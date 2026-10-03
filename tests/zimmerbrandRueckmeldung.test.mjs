import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generiereEinsatz } from '../src/data/einsaetze/einsatzGenerator.js'
import { einsatzAlarmiert, fahrzeugAlarmieren, fahrzeugeFortschreiben, lebenszyklenFortschreiben } from '../src/data/einsatzLebenszyklus.js'
import { phasenSprechwunschErzeugen, funkLageBekanntgeben } from '../src/data/einsatzFunk.js'
import { sprechwunschAnnehmen } from '../src/data/leitstellenHinweise.js'
import { funkgruppenAusFahrzeugen, funkspruchErzeugen } from '../src/data/funk.js'
import { pruefeEinsatzBedarf } from '../src/data/einsatzBedarf.js'

const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const code = source.slice(source.indexOf('function funkgruppeAuswaehlen('), source.indexOf('const telefonGespraech'))

for (const [zufall, lageId, meldetext] of [
  [0, 'angebranntes-essen', 'Kein offenes Feuer, lediglich angebranntes Essen.'],
  [0.2, 'kleinbrand-zimmer', 'Kleinbrand im Zimmer bestätigt. Wir beginnen mit der Brandbekämpfung.'],
  [0.6, 'zimmer-vollbrand', 'Zimmerbrand bestätigt.'],
  [0.85, 'person-vermisst', 'Zimmerbrand bestätigt, eine Person wird vermisst.'],
  [0.95, 'brandausbreitung', 'Feuer hat sich weiter ausgebreitet.'],
]) test(`${lageId}: Lage und unveränderter Bedarf werden erst mit gesendetem Erkundungsbericht bekannt`, () => {
  const werte = [zufall, 0, 0.99, 0.99, 0.5]
  const e = { ...generiereEinsatz('zimmerbrand', { zufall: () => werte.shift() }), id: 1 }
  const kind = { id: 2, parentId: 1, typ: 'unter', szenario: structuredClone(e.szenario) }
  const einsaetze = [e, kind], bedarf = structuredClone(e.bedarf)
  const f = { id: 1, funkrufname: 'Florian Test', funkgruppe: 'FW', status: 2 }, fahrzeuge = [f]
  const hinweise = [], funk = { aktiveGruppeId: null, teilnehmerId: null }
  const k = { funk: { value: funk }, funkgruppen: { value: funkgruppenAusFahrzeugen(fahrzeuge) },
    fahrzeuge: { value: fahrzeuge }, einsaetze: { value: einsaetze }, gespraech: { value: [] },
    simulationsZeit: { value: 360000 }, funkspruchErzeugen, funkLageBekanntgeben }
  const api = new Function('k', `with(k) { ${code}; return { funkspruchSenden } }`)(k)
  const hook = event => phasenSprechwunschErzeugen(event, einsaetze, fahrzeuge, hinweise)
  const verborgen = () => {
    assert.equal(e.szenario.lageBekannt, false)
    assert.equal(kind.szenario.lageBekannt, false)
    assert.equal(pruefeEinsatzBedarf(kind, fahrzeuge, { einsaetze }).definiert, false)
  }
  const senden = h => api.funkspruchSenden({ gruppeId: funk.aktiveGruppeId, fahrzeugId: 1, meldungId: h.id }, r => assert.deepEqual(r, {}))
  assert.equal(e.szenario.lageVarianteId, lageId)
  einsatzAlarmiert(einsaetze, e, 0, hook)
  fahrzeugAlarmieren(f, 2, 0)
  fahrzeugeFortschreiben(fahrzeuge, 360000)
  lebenszyklenFortschreiben(einsaetze, fahrzeuge, 360000, hook)
  verborgen()
  const ankunft = hinweise[0]
  sprechwunschAnnehmen(hinweise, ankunft.id, fahrzeuge, funk)
  senden(ankunft)
  verborgen()
  const zeit = 360000 + e.zeitplanung.phasenSekunden.erkundung * 1000
  k.simulationsZeit.value = zeit
  lebenszyklenFortschreiben(einsaetze, fahrzeuge, zeit, hook)
  assert.equal(e.szenario.erkundet, true)
  verborgen()
  const h = hinweise[0]
  assert.equal(h.meldetext, meldetext)
  assert.equal(h.text, '', 'Hinweiskasten enthält keine Lageinformation')
  sprechwunschAnnehmen(hinweise, h.id, fahrzeuge, funk)
  verborgen()
  assert.equal(k.gespraech.value.length, 1, 'Annahme alleine erzeugt keine Rückmeldung')
  api.funkspruchSenden({ gruppeId: funk.aktiveGruppeId, fahrzeugId: 1, meldungId: 'veraltet' }, r => assert.ok(r.fehler))
  verborgen()
  senden(h)
  assert.equal(k.gespraech.value[1].kanal, 'funk')
  assert.equal(k.gespraech.value[1].text, meldetext)
  assert.equal(e.szenario.lageBekannt, true)
  assert.equal(kind.szenario.lageBekannt, true)
  assert.equal(pruefeEinsatzBedarf(kind, fahrzeuge, { einsaetze }).definiert, true)
  assert.equal(e.szenario.lageVarianteId, lageId)
  assert.deepEqual(e.bedarf, bedarf)
})
