import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kommunikationsBeitrag, istSprachbeitrag } from '../src/data/kommunikation.js'
import { katalogFrage } from '../src/data/notruf/frageKatalog.js'
import { antwortAufFrage } from '../src/data/notruf/antwortLogik.js'

test('Explizite Kanäle, stabile eindeutige IDs auch bei gleicher Simulationszeit', () => {
  const daten = { kanal: 'telefon', rolle: 'anrufer', text: 'Funkgruppe: Status 4', zeit: 100 }
  const a = kommunikationsBeitrag(daten), b = kommunikationsBeitrag(daten)
  assert.equal(a.kanal, 'telefon', 'Wörter im Text ändern niemals den Kanal')
  assert.notEqual(a.id, b.id)
  assert.equal(a.art, 'sprache')
  assert.equal(a.absender, 'Anrufer')
  assert.equal(istSprachbeitrag(a), true)
  assert.throws(() => kommunikationsBeitrag({ ...daten, kanal: undefined }))
  assert.throws(() => kommunikationsBeitrag({ ...daten, kanal: 'system' }))
  assert.throws(() => kommunikationsBeitrag({ ...daten, rolle: 'system' }))
})

test('System-, Status- und Altbeiträge ohne explizite Kennzeichnung bleiben außerhalb des Verlaufs', () => {
  const funk = kommunikationsBeitrag({ kanal: 'funk', rolle: 'funkstelle', absender: 'Florian Test 40/1', text: 'Hier Florian Test.', zeit: 100 })
  assert.equal(istSprachbeitrag(funk), true)
  for (const eintrag of [null, { text: 'Telefon: Hallo' }, { ...funk, kanal: 'intern' },
    { ...funk, art: 'status' }, { ...funk, art: 'system' }, { ...funk, art: 'einsatzmeldung' }]) {
    assert.equal(istSprachbeitrag(eintrag), false)
  }
})

test('Bestehende Fragewege erzeugen ausschließlich Telefonbeiträge und verändern keine Chronik', async () => {
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const code = source.slice(source.indexOf('async function telefonFrageSenden('), source.indexOf('async function einsatzAusNotrufErstellen('))
  const kontext = { kommunikationsBeitrag, katalogFrage, antwortAufFrage, frage: { value: 'Wo?' }, notrufDialog: { value: true }, aktuellesSzenario: { value: {} },
    simulationsZeit: { value: 1000 }, gespraech: { value: [] }, passendeAntwort: () => 'In Regensburg.', scrollChatNachUnten: async () => {} }
  const api = new Function('k', `with (k) { ${code}; return { frageSenden, frageAusKatalogSenden } }`)(kontext)
  await api.frageSenden()
  await api.frageAusKatalogSenden({ kategorie: 'medizin', frageId: 'akutes-problem' })
  assert.equal(kontext.gespraech.value.length, 4)
  assert.ok(kontext.gespraech.value.every(e => e.kanal === 'telefon' && istSprachbeitrag(e)))
  assert.deepEqual(kontext.gespraech.value.map(e => e.rolle), ['disponent', 'anrufer', 'disponent', 'anrufer'])
  assert.equal(new Set(kontext.gespraech.value.map(e => e.id)).size, 4)
  kontext.notrufDialog.value = false
  await api.frageAusKatalogSenden({ kategorie: 'medizin', frageId: 'akutes-problem' })
  assert.equal(kontext.gespraech.value.length, 4)
})
