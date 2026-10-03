import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { frageKatalog, katalogFrage } from '../src/data/notruf/frageKatalog.js'
import { antwortAufFrage, medizinAntwortRegeln } from '../src/data/notruf/antwortLogik.js'
import { notrufSzenarien } from '../src/data/notrufSzenarien.js'
import { kommunikationsBeitrag } from '../src/data/kommunikation.js'

test('Alle bestehenden medizinischen Buttons besitzen eindeutige IDs und zugeordnete Fakten', () => {
  const fragen = frageKatalog.medizin.flatMap(g => g.fragen)
  assert.equal(new Set(fragen.map(f => f.id)).size, fragen.length)
  const basis = ['gespraechspartner', 'einsatzort', 'akutes-problem', 'beim-patienten']
  for (const frage of fragen) assert.ok(basis.includes(frage.id) || medizinAntwortRegeln[frage.id])
  for (const id of [1, 2, 3, 6, 7]) {
    const s = notrufSzenarien.find(s => s.id === id)
    for (const regel of Object.values(medizinAntwortRegeln)) {
      assert.ok(Object.hasOwn(s.notrufFakten, regel.fakt))
      assert.ok([true, false, null].includes(s.notrufFakten[regel.fakt]))
    }
    for (const frage of fragen) assert.equal(typeof antwortAufFrage(s, frage.id), 'string')
  }
})

test('Fakten entscheiden explizit zwischen Ja, Nein und unbekannt; Antworten sind wiederholbar', () => {
  for (const [id, regel] of Object.entries(medizinAntwortRegeln)) {
    assert.equal(antwortAufFrage({ notrufFakten: { [regel.fakt]: true } }, id), regel.ja)
    assert.equal(antwortAufFrage({ notrufFakten: { [regel.fakt]: false } }, id), regel.nein)
    for (const wert of [null, undefined, 'false', 0]) {
      assert.equal(antwortAufFrage({ notrufFakten: { [regel.fakt]: wert } }, id), 'Das kann ich nicht beurteilen.')
    }
  }
  const s = notrufSzenarien.find(s => s.id === 2)
  const vorher = structuredClone(s)
  assert.match(antwortAufFrage(s, 'atmung-genug-luft'), /^Nein/)
  assert.equal(antwortAufFrage(s, 'atmung-genug-luft'), antwortAufFrage(s, 'atmung-genug-luft'))
  assert.deepEqual(s, vorher)
  assert.equal(antwortAufFrage(s, 'Atmung? Luft?'), 'Das kann ich nicht beurteilen.')
})

test('Basisfragen nutzen Anruferdaten und Fakten statt zufälliger Standardantworten', () => {
  const s = notrufSzenarien.find(s => s.id === 3)
  assert.match(antwortAufFrage(s, 'gespraechspartner'), /Thomas Schmid/)
  assert.match(antwortAufFrage(s, 'einsatzort'), /Galgenbergstraße 20, Regensburg/)
  assert.equal(antwortAufFrage(s, 'beim-patienten'), 'Ich bin selbst der Patient.')
  assert.equal(antwortAufFrage(s, 'akutes-problem'), s.notrufFakten.akutesProblem)
  assert.equal(antwortAufFrage(notrufSzenarien.find(s => s.id === 4), 'atmung-genug-luft'), 'Das kann ich nicht beurteilen.')
})

test('App reicht Button-ID durch: geänderter Fragetext und Keyword-Falle ändern die Antwort nicht', async () => {
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const code = source.slice(source.indexOf('async function telefonFrageSenden('), source.indexOf('async function einsatzAusNotrufErstellen('))
  const frage = katalogFrage('medizin', 'atmung-genug-luft')
  const originalText = frage.text
  const s = structuredClone(notrufSzenarien.find(s => s.id === 2))
  const k = { katalogFrage, antwortAufFrage, kommunikationsBeitrag, frage: { value: '' },
    notrufDialog: { value: true }, aktuellesSzenario: { value: s }, simulationsZeit: { value: 100 },
    gespraech: { value: [] }, scrollChatNachUnten: async () => {},
    passendeAntwort: () => { throw new Error('Strukturierte Abfrage darf keine Keyword-Suche verwenden') } }
  const api = new Function('k', `with(k) { ${code}; return { frageAusKatalogSenden } }`)(k)
  try {
    frage.text = 'Andere Formulierung mit Adresse, Name und Brustschmerz.'
    await api.frageAusKatalogSenden({ kategorie: 'medizin', frageId: frage.id })
    assert.equal(k.gespraech.value[0].text, frage.text)
    assert.equal(k.gespraech.value[1].text, antwortAufFrage(s, frage.id))
    assert.ok(k.gespraech.value.every(b => b.kanal === 'telefon'))
    await api.frageAusKatalogSenden({ kategorie: 'medizin', frageId: 'falsch' })
    await api.frageAusKatalogSenden({ kategorie: 'unbekannt', frageId: frage.id })
    assert.equal(k.gespraech.value.length, 2)
    k.notrufDialog.value = false
    await api.frageAusKatalogSenden({ kategorie: 'medizin', frageId: frage.id })
    assert.equal(k.gespraech.value.length, 2)
  } finally { frage.text = originalText }
})
