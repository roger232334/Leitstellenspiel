import test from 'node:test'
import assert from 'node:assert/strict'
import { fahrzeugDatenLaden, fahrzeugDatenSpeichern, fahrzeugeFuerSchicht, fahrzeugPruefen, fahrzeugAufKarteSichtbar, fahrzeugMitObjektWache } from '../src/data/fahrzeugVerwaltung.js'
const speicher = () => { let text = null; return { getItem: () => text, setItem: (_, wert) => { text = wert } } }

test('Funkgruppe, Wache und Ja/Nein-Merkmale bleiben nach Speichern und Schichtstart erhalten', () => {
  const s = speicher(), d = fahrzeugDatenLaden(s)
  const merkmale = { funkgruppe: 'RD Regensburg', wacheName: 'Wache West', wacheId: 'poi-42', hatNotarzt: true, hatGps: false, istFirstResponder: true, istEhrenamtlich: true }
  Object.assign(d.fahrzeuge[0], merkmale)
  fahrzeugDatenSpeichern(d, s)
  const wachen = [{ id: 'poi-42', name: 'Wache West', aktiv: true, position: { lat: 49, lng: 12 } }]
  const f = fahrzeugeFuerSchicht(fahrzeugDatenLaden(s), Date.now(), wachen)[0]
  for (const [key, wert] of Object.entries(merkmale)) assert.equal(f[key], wert)
  assert.equal(fahrzeugAufKarteSichtbar(f), false)
  assert.ok(f.position, 'GPS-Abschaltung löscht die interne Position nicht')
  f.hatGps = true
  assert.equal(fahrzeugAufKarteSichtbar(f), true)
  f.position = null
  assert.equal(fahrzeugAufKarteSichtbar(f), false)
  const explizitNein = fahrzeugPruefen({ ...d.fahrzeuge[2], hatNotarzt: false })
  assert.equal(explizitNein.hatNotarzt, false, 'NEF darf ausdrücklich ohne Notarzt hinterlegt werden')
  assert.throws(() => fahrzeugPruefen({ ...f, hatGps: 'nein' }))
})

test('Alte Fahrzeuge behalten ihre Kartensichtbarkeit und erhalten leere Zuordnungen', () => {
  const f = fahrzeugPruefen({ id: 1, funkrufname: 'Alt', typ: 'RTW', bereich: 'RD', startStatus: 2, position: { lat: 49, lng: 12 } })
  assert.equal(f.hatGps, true)
  assert.equal(fahrzeugAufKarteSichtbar(f), true)
  assert.equal(f.funkgruppe, '')
  assert.equal(f.wacheName, '')
  assert.equal(f.wacheId, null)
  assert.equal(f.hatNotarzt, false)
  assert.equal(f.istFirstResponder, false)
  assert.equal(f.istEhrenamtlich, false)
})
test('Standardfahrzeuge, Änderungen und leerer Bestand werden dauerhaft geladen', () => {
  const s = speicher(), d = fahrzeugDatenLaden(s)
  assert.equal(d.fahrzeuge.length, 5)
  d.fahrzeuge[0].funkrufnameLang = 'Test 71/1'
  fahrzeugDatenSpeichern(d, s)
  assert.equal(fahrzeugDatenLaden(s).fahrzeuge[0].funkrufname, 'Test 71/1')
  fahrzeugDatenSpeichern({ ...d, fahrzeuge: [] }, s)
  assert.deepEqual(fahrzeugDatenLaden(s).fahrzeuge, [])
  assert.equal(fahrzeugDatenLaden(s).naechsteId, 6)
})

test('Langer und kurzer Funkrufname bleiben beim Speichern und Schichtstart separat erhalten', () => {
  const s = speicher(), d = fahrzeugDatenLaden(s)
  Object.assign(d.fahrzeuge[0], { funkrufnameLang: ' Rotkreuz Regensburg 71/1 ', funkrufnameKurz: ' RK R 71/1 ' })
  fahrzeugDatenSpeichern(d, s)
  const f = fahrzeugeFuerSchicht(fahrzeugDatenLaden(s), Date.now())[0]
  assert.equal(f.funkrufnameLang, 'Rotkreuz Regensburg 71/1')
  assert.equal(f.funkrufnameKurz, 'RK R 71/1')
  assert.equal(f.funkrufname, f.funkrufnameLang)
  const alt = fahrzeugPruefen({ id: 10, funkrufname: 'Alter Name', typ: 'RTW', bereich: 'RD', startStatus: 2 })
  assert.equal(alt.funkrufnameLang, 'Alter Name')
  assert.equal(alt.funkrufnameKurz, '')
  assert.throws(() => fahrzeugPruefen({ ...f, funkrufnameLang: '  ' }))
  assert.throws(() => fahrzeugPruefen({ ...f, id: 999, funkrufnameLang: 'rotkreuz regensburg 71/1' }, [f]))
})
test('Schichtkopie enthält frische Laufzeitdaten und verändert keine Stammdaten', () => {
  const d = fahrzeugDatenLaden(speicher())
  const start = new Date(2027, 1, 1, 8).getTime()
  const f = fahrzeugeFuerSchicht(d, start)[0]
  assert.equal(f.status, 2)
  assert.equal(f.statusZeiten[2], '08:00:00')
  assert.deepEqual(f.route, [])
  assert.equal(f.einsatzId, null)
  f.position.lat = 1; f.status = 3
  assert.notEqual(d.fahrzeuge[0].position.lat, 1)
  assert.equal(fahrzeugeFuerSchicht(d, start)[0].status, 2)
})
test('Doppelte Rufnamen, ungültige Koordinaten und beschädigter Speicher werden abgewiesen', () => {
  const d = fahrzeugDatenLaden(speicher()), f = d.fahrzeuge[0]
  assert.throws(() => fahrzeugPruefen({ ...f, id: 99 }, d.fahrzeuge))
  assert.throws(() => fahrzeugPruefen({ ...f, position: { lat: 91, lng: 0 } }))
  assert.throws(() => fahrzeugPruefen({ ...f, startStatus: 3 }))
  assert.throws(() => fahrzeugDatenLaden({ getItem: () => '{kaputt' }))
  assert.throws(() => fahrzeugDatenSpeichern(d, { setItem: () => { throw Error('Speicher voll') } }))
})

test('Wachenreferenz übernimmt Originalnamen und aktualisiert den Standort bei Schichtstart', () => {
  const s = speicher(), d = fahrzeugDatenLaden(s)
  const wache = { id: 'excel:wache', name: ' 3.2.2 R-L ' + 'Langer Wachenname '.repeat(10), aktiv: true, position: { lat: 49.1, lng: 12.2 } }
  d.fahrzeuge[0] = fahrzeugPruefen(fahrzeugMitObjektWache({ ...d.fahrzeuge[0], wacheId: wache.id }, [wache], true))
  fahrzeugDatenSpeichern(d, s)
  assert.equal(fahrzeugDatenLaden(s).fahrzeuge[0].wacheName, wache.name)
  assert.deepEqual(d.fahrzeuge[0].position, wache.position)
  wache.position.lat = 49.3
  wache.name = '3.2.2 R-L Neuer Name'
  const f = fahrzeugeFuerSchicht(fahrzeugDatenLaden(s), Date.now(), [wache])[0]
  assert.equal(f.wacheId, wache.id)
  assert.equal(f.wacheName, wache.name)
  assert.equal(f.position.lat, 49.3)
  f.position.lat = 50
  assert.equal(wache.position.lat, 49.3, 'Laufzeitposition verändert keine Objektkoordinaten')
})

test('Fehlende, deaktivierte oder koordinatenlose Wachen erzeugen keine veraltete Position', () => {
  const f = { ...fahrzeugDatenLaden(speicher()).fahrzeuge[0], wacheId: 'wache' }
  assert.throws(() => fahrzeugMitObjektWache(f, [], true), /fehlt/)
  assert.equal(fahrzeugMitObjektWache(f, []).position, null)
  const wache = { id: 'wache', name: 'Wache', aktiv: false, position: { lat: 49, lng: 12 } }
  assert.throws(() => fahrzeugMitObjektWache(f, [wache], true), /deaktiviert/)
  assert.equal(fahrzeugMitObjektWache(f, [wache]).position, null)
  assert.equal(fahrzeugMitObjektWache(f, [{ ...wache, aktiv: true, position: null }], true).position, null)
  assert.deepEqual(fahrzeugMitObjektWache({ ...f, wacheId: null }, []).position, f.position, 'Alte Fahrzeuge ohne Objektverknüpfung behalten ihren Standort')
})
