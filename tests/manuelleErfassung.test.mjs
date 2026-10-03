import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { leereEinsatzErfassung, einsatzAdresse } from '../src/data/einsatzErfassung.js'
import { katalogStichwoerter, mitRdVerknuepfung } from '../src/data/einsatzStichwoerter.js'
import { stichwortKatalog } from '../src/data/stichwortKatalog.js'
import { findeAaoRegel } from '../src/data/aaoRegeln.js'
import { gebietsPruefung } from '../src/data/gebiet.js'

const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const start = source.indexOf('async function einsatzAusErfassungErstellen(')
const end = source.indexOf('const neuerEinsatzDialog', start)
const absicherung = stichwortKatalog.find(e => e.id === 'RD-05-40')
function vorbereiten(anrufAktiv = false) {
  const ref = value => ({ value })
  const kontext = {
    geocodierungLaeuft: ref(false), manuelleErfassungAktiv: ref(true),
    manuelleErfassungDaten: ref({ ...leereEinsatzErfassung(),
      ort: 'Regensburg', meldung: absicherung.schlagwort, meldebildId: absicherung.id }),
    notrufDialog: ref(anrufAktiv), notrufDaten: ref({ meldung: 'Separater Notruf' }),
    aktuellesSzenario: ref({ id: 'test' }), szenarioPositionen: { test: { lat: 1, lng: 2 } },
    notrufSekunden: ref(25), gespraech: ref([{ text: 'Gespräch behalten' }]),
    einsaetze: ref([]), ausgewaehlterEinsatzId: ref(null), aktivesModul: ref('einsatz'),
    leereEinsatzErfassung, einsatzAdresse, katalogStichwoerter, mitRdVerknuepfung, stichwortKatalog,
    meldebildStichwoerter: () => ({}), findeEinsatzPosition: async () => null,
    naechsteEinsatzId: () => 1001, protokolliere: () => {},
    planeNaechstenNotruf: () => { throw new Error('Manuelle Anlage darf den Anruftimer nicht verändern') },
    alert: text => { throw new Error(text) },
    gebietsPruefung, confirm: () => true,
  }
  const speichern = new Function('kontext', `with (kontext) { ${source.slice(start, end)}; return einsatzAusErfassungErstellen }`)(kontext)
  return { kontext, speichern }
}

for (const anrufAktiv of [false, true]) {
  test(`Manuelle Gebietsabsicherung anlegen, laufender Anruf: ${anrufAktiv}`, async () => {
    const { kontext: k, speichern } = vorbereiten(anrufAktiv)
    await speichern('manuell')
    assert.equal(k.einsaetze.value.length, 1)
    const einsatz = k.einsaetze.value[0]
    assert.equal(einsatz.quelle, 'manuell')
    assert.equal(einsatz.stichwoerter.R.stichwort, 'RD ABSICHERUNG')
    assert.equal(einsatz.position, null, 'Keine Übernahme einer fremden Szenarioposition')
    assert.deepEqual(findeAaoRegel(einsatz.stichwoerter.R), [{ typ: 'RTW', anzahl: 1 }])
    assert.equal(k.notrufDialog.value, anrufAktiv)
    assert.equal(k.notrufDaten.value.meldung, 'Separater Notruf')
    assert.equal(k.gespraech.value.length, 1)
    assert.equal(k.notrufSekunden.value, 25)
    assert.equal(k.manuelleErfassungAktiv.value, false)
    assert.equal(k.manuelleErfassungDaten.value.meldung, '')
    assert.equal(k.ausgewaehlterEinsatzId.value, einsatz.id)
  })
}

test('Doppeltes Speichern eines manuellen Entwurfs erzeugt nur einen Einsatz', async () => {
  const { kontext: k, speichern } = vorbereiten()
  await Promise.all([speichern('manuell'), speichern('manuell')])
  assert.equal(k.einsaetze.value.length, 1)
})

test('Unbekanntes Gebiet verlangt Bestätigung; Abbrechen erhält den manuellen Entwurf', async () => {
  const { kontext: k, speichern } = vorbereiten(true)
  let warnung = ''
  k.confirm = text => { warnung = text; return false }
  await speichern('manuell')
  assert.match(warnung, /Gebiet/)
  assert.equal(k.einsaetze.value.length, 0)
  assert.equal(k.manuelleErfassungAktiv.value, true)
  assert.equal(k.notrufDialog.value, true)
})

test('Unvollständige manuelle Erfassung bleibt erhalten', async () => {
  const { kontext: k, speichern } = vorbereiten()
  k.manuelleErfassungDaten.value.ort = ''
  await assert.rejects(speichern('manuell'), /Einsatzort/)
  assert.equal(k.einsaetze.value.length, 0)
  assert.equal(k.manuelleErfassungAktiv.value, true)
})
