import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stichwortKatalog } from '../src/data/stichwortKatalog.js'
import { findeRdVerknuepfung } from '../src/data/rdVerknuepfungen.js'
import { katalogStichwoerter, mitRdVerknuepfung, stichwortFeldText } from '../src/data/einsatzStichwoerter.js'

const vu = stichwortKatalog.find(e => e.id === 'THL-28-10')

test('T2810 zeigt THL und die bestehende RD-Verknüpfung bereits vor dem Split', () => {
  const daten = katalogStichwoerter(vu)
  assert.equal(vu.kennung, '#T2810#VU#mehrere PKW')
  assert.equal(stichwortFeldText(daten.stichwoerter, ['T']), 'THL 2')
  assert.equal(stichwortFeldText(daten.stichwoerter, ['R']), '2 RTW + ELRD')
  assert.equal(stichwortFeldText(daten.stichwoerter, ['ABC', 'B']), '')
  assert.equal(stichwortFeldText(daten.stichwoerter, ['SON', 'INF']), '')
})

test('Alle Katalogbereiche behalten ihre Einträge und hinterlegten RD-Zuordnungen', () => {
  for (const eintrag of stichwortKatalog) {
    const daten = katalogStichwoerter(eintrag)
    const bereich = { B: 'B', THL: 'T', ABC: 'ABC', RD: 'R', SON: 'SON', INF: 'INF' }[eintrag.bereich]
    assert.equal(daten.stichwoerter[bereich], eintrag)
    if (['B', 'THL', 'ABC'].includes(eintrag.bereich)) {
      const rd = findeRdVerknuepfung(eintrag)
      assert.equal(daten.stichwoerter.R?.stichwort || null, rd?.verknuepfungNeu || null)
    }
  }
  assert.deepEqual(katalogStichwoerter(null).stichwoerter, {
    B: null, T: null, ABC: null, R: null, SON: null, INF: null,
  })
})

test('Auto-Split übernimmt die angezeigten Stichwörter in FW- und RD-Untereinsätze', () => {
  const haupt = {
    id: 1001, typ: 'haupt', meldung: vu.schlagwort, schlagwort: vu.kennung,
    erfassung: { ortsteil: 'Reinhausen' },
    ...katalogStichwoerter(vu),
  }
  const liste = { value: [haupt] }
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const start = source.indexOf('function autoSplitEinsatz()')
  const end = source.indexOf('function vorschlagErzeugen()', start)
  const meldungen = []
  const split = new Function('ausgewaehlterEinsatz', 'einsaetze', 'mitRdVerknuepfung',
    'hatStichwort', 'naechsteEinsatzId', 'protokolliere', 'alert',
    `${source.slice(start, end)}; return autoSplitEinsatz;`)(
    { value: haupt }, liste, mitRdVerknuepfung,
    (e, b) => Boolean(e.stichwoerter?.[b]),
    () => Math.max(...liste.value.map(e => e.id)) + 1,
    () => {}, text => meldungen.push(text),
  )
  split()
  const fw = liste.value.find(e => e.bereich === 'FW')
  const rd = liste.value.find(e => e.bereich === 'RD')
  assert.equal(fw.stichwoerter.T.stichwort, haupt.stichwoerter.T.stichwort)
  assert.equal(fw.stichwoerter.R, null)
  assert.equal(rd.stichwoerter.R.stichwort, haupt.stichwoerter.R.stichwort)
  assert.equal(rd.rdVerknuepfung, '2 RTW + ELRD')
  assert.equal(rd.stichwoerter.T, null)
  assert.equal(rd.schlagwort, vu.kennung)
  assert.equal(rd.erfassung.ortsteil, 'Reinhausen')
  assert.equal(haupt.autoSplitErfolgt, true)
  split()
  assert.equal(liste.value.length, 3)
  assert.equal(meldungen.length, 1)
})
