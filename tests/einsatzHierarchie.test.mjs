import { test } from 'node:test'
import assert from 'node:assert/strict'
import { haupteinsaetze, haupteinsatzZu, untereinsaetzeZu, gemeinsameHinweiseAendern } from '../src/data/einsatzHierarchie.js'

test('Hinweise werden vom Haupt- und jedem Untereinsatz für dieselbe Einsatzfamilie geändert', () => {
  const haupt = { id: 1, typ: 'haupt', bemerkung: 'Alt', erfassung: { notiz: 'Alt' } }
  const fw = { id: 2, typ: 'unter', parentId: 1, erfassung: { notiz: 'Alt' } }
  const rd = { id: 3, typ: 'unter', parentId: 1 }
  const fremd = { id: 4, typ: 'haupt', bemerkung: 'Anderer Einsatz' }
  const fremdUnter = { id: 5, typ: 'unter', parentId: 4, bemerkung: 'Andere Hinweise' }
  const liste = [haupt, fw, rd, fremd, fremdUnter]
  for (const [id, text] of [[1, 'Zugang hinten'], [2, 'Zugang frei'], [3, 'Patient im Hof'], [2, '']]) {
    gemeinsameHinweiseAendern(liste, id, text)
    for (const e of [haupt, fw, rd]) {
      assert.equal(e.bemerkung, text)
      assert.equal(haupteinsatzZu(liste, e).bemerkung, text)
      if (e.erfassung) assert.equal(e.erfassung.notiz, text)
    }
    assert.equal(fremd.bemerkung, 'Anderer Einsatz')
    assert.equal(fremdUnter.bemerkung, 'Andere Hinweise')
  }
})

test('Hinweise bleiben für ältere Einsätze und verwaiste Untereinsätze bearbeitbar', () => {
  const alt = { id: 1 }
  const verwaist = { id: 2, typ: 'unter', parentId: 99 }
  const liste = [alt, verwaist]
  gemeinsameHinweiseAendern(liste, 1, 'Hinweis')
  gemeinsameHinweiseAendern(liste, 2, 'Eigene Hinweise')
  gemeinsameHinweiseAendern(liste, 99, 'Unbekannt')
  gemeinsameHinweiseAendern(liste, 1, null)
  assert.equal(alt.bemerkung, 'Hinweis')
  assert.equal(verwaist.bemerkung, 'Eigene Hinweise')
})

test('Gesamtliste zeigt nur Haupteinsätze; Untereinsatzauswahl erhält den Hauptkontext', () => {
  const haupt = { id: 1001, typ: 'haupt' }
  const anderer = { id: 2001, typ: 'haupt' }
  const fw = { id: 1002, typ: 'unter', parentId: 1001, bereich: 'FW' }
  const rd = { id: 1003, typ: 'unter', parentId: 1001, bereich: 'RD' }
  const fremd = { id: 2002, typ: 'unter', parentId: 2001 }
  const liste = [haupt, fw, rd, anderer, fremd]
  assert.deepEqual(haupteinsaetze(liste), [haupt, anderer])
  for (const auswahl of [haupt, fw, rd]) {
    const kontext = haupteinsatzZu(liste, auswahl)
    assert.equal(kontext, haupt)
    assert.deepEqual(untereinsaetzeZu(liste, kontext), [fw, rd])
  }
  rd.status = 'alarmiert'
  assert.equal(untereinsaetzeZu(liste, haupt)[1].status, 'alarmiert')
  assert.equal(liste.length, 5, 'Unterdaten bleiben für die Alarmierung erhalten')
})

test('Leere und ältere Einsätze sowie fehlende Eltern werden sicher behandelt', () => {
  const alt = { id: 1 }
  assert.deepEqual(haupteinsaetze([alt]), [alt])
  assert.equal(haupteinsatzZu([alt], alt), alt)
  assert.equal(haupteinsatzZu([], null), null)
  assert.equal(haupteinsatzZu([], { typ: 'unter', parentId: 999 }), null)
  assert.deepEqual(untereinsaetzeZu([], null), [])
})
