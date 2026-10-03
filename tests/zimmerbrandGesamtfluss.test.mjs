import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generiereEinsatz } from '../src/data/einsaetze/einsatzGenerator.js'
import { einsatzAlarmiert, fahrzeugAlarmieren, fahrzeugeFortschreiben, lebenszyklenFortschreiben } from '../src/data/einsatzLebenszyklus.js'
import { phasenSprechwunschErzeugen, sprechwunschFreigeben } from '../src/data/einsatzFunk.js'
import { hinweiseGruppieren, sprechwunschHinzufuegen } from '../src/data/leitstellenHinweise.js'
import { pruefeEinsatzBedarf } from '../src/data/einsatzBedarf.js'
import { standardbeladungFuer } from '../src/data/ausruestung/fahrzeugStandardbeladungen.js'
import { kommunikationsBeitrag, istSprachbeitrag } from '../src/data/kommunikation.js'
import { notrufSzenarien } from '../src/data/notrufSzenarien.js'
import { katalogFrage } from '../src/data/notruf/frageKatalog.js'
import { antwortAufFrage } from '../src/data/notruf/antwortLogik.js'

test('Gesamtfluss: aktives Telefon, Abfrage, gruppierte Sprechwünsche, Lagefreigabe, Nachalarmierung und reguläres Einsatzende', async () => {
  const zufall = [0.7, 0, 0.99, 0.99, 0.5]
  const einsatz = { ...generiereEinsatz('zimmerbrand', { zufall: () => zufall.shift() }), id: 1001 }
  const kind = { id: 1002, typ: 'unter', parentId: 1001, status: 'offen', fahrzeuge: [] }
  const einsaetze = [einsatz, kind], hinweise = [], funk = {}, chronik = []
  const fahrzeuge = [1, 2].map(id => ({ id, typ: 'HLF20', funkrufname: `Florian Test ${id}`, funkgruppe: 'FW_Test', status: 2, beladung: standardbeladungFuer({ typ: 'HLF20' }) }))
  const bedarf = structuredClone(einsatz.bedarf)
  const anruf = structuredClone(notrufSzenarien.find(s => s.id === 2))
  const verlauf = [kommunikationsBeitrag({ kanal: 'telefon', rolle: 'anrufer', text: anruf.startText, zeit: 0 })]
  const k = { notrufDialog: { value: true }, aktuellesSzenario: { value: anruf }, simulationsZeit: { value: 0 }, gespraech: { value: verlauf },
    kommunikationsBeitrag, katalogFrage, antwortAufFrage, scrollChatNachUnten: async () => {} }
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const fragenCode = source.slice(source.indexOf('async function telefonFrageSenden('), source.indexOf('async function einsatzAusNotrufErstellen('))
  const api = new Function('k', `with(k) { ${fragenCode}; return { frageAusKatalogSenden } }`)(k)
  const frage = () => api.frageAusKatalogSenden({ kategorie: 'medizin', frageId: 'atmung-genug-luft' })
  const hook = event => { chronik.push(event); phasenSprechwunschErzeugen(event, einsaetze, fahrzeuge, hinweise) }
  const tick = zeit => { k.simulationsZeit.value = zeit; fahrzeugeFortschreiben(fahrzeuge, zeit); lebenszyklenFortschreiben(einsaetze, fahrzeuge, zeit, hook) }
  const freigeben = h => sprechwunschFreigeben(h.id, hinweise, fahrzeuge, funk, einsaetze, verlauf, k.simulationsZeit.value)
  const lage = () => pruefeEinsatzBedarf(kind, fahrzeuge, { einsaetze })
  await frage()
  assert.match(verlauf.at(-1).text, /^Nein/)
  einsatzAlarmiert(einsaetze, einsatz, 0, hook)
  fahrzeugAlarmieren(fahrzeuge[0], einsatz.id, 0)
  tick(10000)
  assert.equal(fahrzeuge[0].einsatzId, einsatz.id)
  assert.equal(fahrzeuge[0].status, 3)
  assert.equal(lage().definiert, false)
  tick(360000)
  assert.equal(fahrzeuge[0].status, 4)
  assert.equal(einsatz.lebenszyklus.phase, 'erkundung')
  assert.equal(verlauf.length, 3, 'Interne Ankunft und Phasen schreiben keine Sprache')
  freigeben(hinweise[0])
  assert.equal(lage().definiert, false, 'Ankunftsmeldung verrät keine Lage')
  await frage()
  tick(540000)
  assert.equal(einsatz.szenario.erkundet, true)
  assert.equal(lage().definiert, false)
  const bericht = hinweise.find(h => h.phasenEreignis === 'erkundungAbgeschlossen')
  const dringend = sprechwunschHinzufuegen(hinweise, fahrzeuge[0], 'dringend', 540000)
  assert.deepEqual(hinweiseGruppieren(hinweise).map(g => g.dringend), [false, true])
  freigeben(dringend)
  assert.deepEqual(hinweise, [bericht])
  assert.equal(lage().definiert, false, 'Andere Sprechaufforderung verrät den Bericht nicht')
  freigeben(bericht)
  assert.equal(verlauf.at(-1).text, 'Zimmerbrand bestätigt.')
  assert.equal(einsatz.szenario.lageBekannt, true)
  assert.equal(lage().ressourcen.wasserLiter.fehlt, 1600)
  assert.equal(lage().ressourcen.atemschutzgeraete.fehlt, 2)
  await frage()
  fahrzeugAlarmieren(fahrzeuge[1], kind.id, 540000)
  assert.equal(lage().erfuellt, true)
  assert.equal(pruefeEinsatzBedarf(einsatz, fahrzeuge, { nurAmOrt: true }).erfuellt, false)
  tick(900000)
  assert.equal(pruefeEinsatzBedarf(einsatz, fahrzeuge, { einsaetze, nurAmOrt: true }).erfuellt, true)
  assert.equal(einsatz.lebenszyklus.arbeitsbeginn, 360000, 'Nachalarmierung startet Phasen nicht neu')
  tick(1890000)
  assert.equal(einsatz.lebenszyklus.phase, 'abschluss')
  freigeben(hinweise.find(h => h.phasenEreignis === 'einsatzAbschluss'))
  tick(2159999)
  assert.ok(fahrzeuge.every(f => f.status === 4 && f.einsatzId != null))
  tick(2160000)
  assert.equal(einsatz.lebenszyklus.phase, 'beendet')
  assert.ok(einsaetze.every(e => e.status === 'abgeschlossen'))
  assert.ok(fahrzeuge.every(f => f.status === 2 && f.einsatzId === null))
  assert.deepEqual(einsatz.bedarf, bedarf)
  assert.equal(einsatz.szenario.lageVarianteId, 'zimmer-vollbrand')
  assert.ok(verlauf.every(istSprachbeitrag))
  assert.ok(chronik.some(e => e.typ === 'einsatzBeendet'))
  assert.equal(k.notrufDialog.value, true)
  assert.equal(k.aktuellesSzenario.value, anruf)
  await frage()
  assert.match(verlauf.at(-1).text, /^Nein/)
  const anzahl = verlauf.length
  tick(3000000)
  assert.equal(verlauf.length, anzahl, 'Keine mehrfachen Phasenmeldungen nach Einsatzende')
})
