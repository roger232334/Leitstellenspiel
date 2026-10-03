import test from 'node:test'
import assert from 'node:assert/strict'
import { neuesObjekt, objektDatenSpeichern, objektDatenLaden, objektImportZusammenfuehren } from '../src/data/objektVerwaltung.js'
import { objektVorschlaege, objektEinsatzFelder } from '../src/services/objektSuche.js'

test('Alias bleibt nach Speichern und erneutem Import erhalten, Originalname unverändert', () => {
  const o = { ...neuesObjekt(), name: ' 3.2.2 R-L Krankenhaus ', alias: 'NOT R' }
  const map = new Map()
  const speicher = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  objektDatenSpeichern({ version: 1, objekte: [o] }, speicher)
  const geladen = objektDatenLaden(speicher)
  assert.equal(geladen.objekte[0].alias, 'NOT R')
  const { daten } = objektImportZusammenfuehren(geladen, { objekte: [{ ...o, alias: undefined }] })
  assert.equal(daten.objekte[0].alias, 'NOT R')
  assert.equal(daten.objekte[0].name, o.name)
})

test('Suche findet mehrere gleiche Aliase und Originalnamen ohne Trefferlimit', () => {
  const objekte = Array.from({ length: 75 }, (_, i) => ({ ...neuesObjekt(), name: `3.2.2 R-L Klinik ${i}`, alias: 'NOT R' }))
  assert.equal(objektVorschlaege('not r', objekte).length, 75)
  assert.equal(objektVorschlaege('Klinik 74', objekte)[0].label, objekte[74].name)
  assert.equal(objektVorschlaege('unbekannt', objekte).length, 0)
})

test('Auswahl übernimmt Adresse und Position; fehlende Angaben löschen vorherige Werte', () => {
  const o = { ...neuesObjekt(), name: '3.2.2 R-L Klinik', alias: 'NOT R',
    adresse: { strasse: 'Teststraße', hausnummer: '10', hausnummerZusatz: 'a', ort: 'Reinhausen', gemeinde: 'Regensburg', postleitzahl: '93059', adressKennzeichen: 'NOT' }, position: { lat: 49, lng: 12 } }
  const f = objektEinsatzFelder(o)
  assert.equal(f.objekt, o.name)
  assert.equal(f.objektId, o.id)
  assert.equal(f.hausnummer, '10a')
  assert.equal(f.strasse, 'Teststraße')
  assert.equal(f.ort, 'Regensburg')
  assert.equal(f.ortsteil, 'Reinhausen')
  assert.equal(f.postleitzahl, '93059')
  assert.deepEqual(f.position, o.position)
  assert.notEqual(f.position, o.position)
  const leer = { ...f, ...objektEinsatzFelder({ ...neuesObjekt(), name: 'See' }) }
  for (const key of ['strasse', 'hausnummer', 'ort', 'ortsteil', 'station', 'postleitzahl', 'adressKennzeichen']) assert.equal(leer[key], '')
  assert.equal(leer.position, null)
})
