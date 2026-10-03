import test from 'node:test'
import assert from 'node:assert/strict'
import { objektTypen, quellObjektTyp } from '../src/data/objektTypen.js'
import { neuesObjekt, objektPruefen, objektDatenPruefen, objektDatenLaden, objektDatenSpeichern, objektAusQuellzeile, aktiveKartenObjekte, objektZu, OBJEKTE_KEY } from '../src/data/objektVerwaltung.js'

test('Typkatalog besitzt stabile eindeutige IDs und trennt unbekannt von Sonstiges', () => {
  assert.equal(objektTypen.length, 38)
  assert.equal(new Set(objektTypen.map(t => t.id)).size, 38)
  for (const t of objektTypen) assert.equal(quellObjektTyp(t.name.toUpperCase()), t.id)
  assert.equal(quellObjektTyp('FEUERWEHR-THW'), 'feuerwehr-thw')
  assert.equal(quellObjektTyp('STRAßENOBJEKT'), 'strassenobjekt')
  assert.equal(quellObjektTyp('NICHT VORHANDEN'), 'unklassifiziert')
  assert.equal(quellObjektTyp('unbekannter Importtyp'), 'unklassifiziert')
  assert.equal(quellObjektTyp('SONSTIGES'), 'sonstiges')
})

test('Koordinatenobjekte, Teiladressen und Nullposition sind erlaubt; ungültige Daten nicht', () => {
  const o = { ...neuesObjekt(), name: 'See', typId: 'gewaesser', position: { lat: 49, lng: 12 } }
  assert.deepEqual(objektPruefen(o), o)
  assert.notEqual(neuesObjekt().id, o.id)
  assert.equal(objektPruefen({ ...o, adresse: { adressKennzeichen: 'SEE' }, position: null }).adresse.adressKennzeichen, 'SEE')
  for (const position of [{ lat: 91, lng: 12 }, { lat: 49, lng: 181 }, { lat: NaN, lng: 12 }, { lat: 49 }, { lat: '', lng: 12 }]) assert.throws(() => objektPruefen({ ...o, position }))
  for (const patch of [{ name: ' ' }, { typId: 'falsch' }, { aktiv: 'ja' }, { id: '' }]) assert.throws(() => objektPruefen({ ...o, ...patch }))
  assert.deepEqual(objektPruefen({ ...o, position: { lat: 0, lng: 0 } }).position, { lat: 0, lng: 0 })
})

test('Versionierter Bestand speichert Bearbeitung/Deaktivierung/Löschung; IDs und fremde Daten bleiben erhalten', () => {
  const map = new Map([['fahrzeuge', 'unverändert']])
  const speicher = { getItem: key => map.get(key) ?? null, setItem: (key, val) => map.set(key, val) }
  assert.deepEqual(objektDatenLaden(speicher), { version: 1, objekte: [] })
  const o = { ...neuesObjekt(), name: 'Praxis', typId: 'praxis' }
  objektDatenSpeichern({ version: 1, objekte: [o] }, speicher)
  const geladen = objektDatenLaden(speicher)
  geladen.objekte[0].name = 'Praxis neu'; geladen.objekte[0].aktiv = false
  objektDatenSpeichern(geladen, speicher)
  assert.equal(objektDatenLaden(speicher).objekte[0].id, o.id)
  assert.equal(objektDatenLaden(speicher).objekte[0].aktiv, false)
  objektDatenSpeichern({ version: 1, objekte: [] }, speicher)
  assert.equal(objektDatenLaden(speicher).objekte.length, 0)
  assert.equal(map.get('fahrzeuge'), 'unverändert')
  map.set(OBJEKTE_KEY, '{kaputt')
  assert.throws(() => objektDatenLaden(speicher))
  assert.equal(map.get(OBJEKTE_KEY), '{kaputt')
  assert.throws(() => objektDatenSpeichern({ version: 1, objekte: [o] }, { setItem() { throw new Error('Speicher voll') } }), /Speicher voll/)
  assert.throws(() => objektDatenPruefen({ version: 1, objekte: [o, o] }), /Doppelte/)
})

test('Quellzeilenadapter erhält Originalname, Kennzeichen und PLZ und ordnet X/Y korrekt zu', () => {
  const zeile = { 'Objekt-Krankenhaus Name': '3.2.2 R-L Testsee', XKoord_WGS84: '12,1234', YKoord_WGS84: '49,5678', 'Adresse HausNr von': 10, 'Adresse HausNr Kennzeichen von': 'SEE', Postleitzahl: '01234', Typ: 'GEWÄSSER' }
  const o = objektAusQuellzeile(zeile, 'import-test')
  assert.equal(o.name, '3.2.2 R-L Testsee')
  assert.equal(o.id, 'import-test')
  assert.equal(o.typId, 'gewaesser')
  assert.deepEqual(o.position, { lat: 49.5678, lng: 12.1234 })
  assert.equal(o.adresse.hausnummer, '10')
  assert.equal(o.adresse.adressKennzeichen, 'SEE')
  assert.equal(o.adresse.postleitzahl, '01234')
  assert.equal(objektAusQuellzeile({ ...zeile, XKoord_WGS84: '', YKoord_WGS84: '' }).position, null)
  assert.throws(() => objektAusQuellzeile({ ...zeile, XKoord_WGS84: '' }))
  assert.equal(objektAusQuellzeile({ ...zeile, 'Objekt-Krankenhaus Name': 'Haus 3.2.2 R-L Test' }).name, 'Haus 3.2.2 R-L Test')
})

test('Originalnamen bleiben bei Import, Persistenz und erneutem Import exakt erhalten', () => {
  const map = new Map()
  const speicher = { getItem: key => map.get(key) ?? null, setItem: (key, val) => map.set(key, val) }
  for (const name of ['3.2.2 R-L Musterfirma', '3.2.2 R-L Rathaus ...', '3.2.2 R-L Praxis ...', '  3.2.2  R-L\tMüller & Söhne  ', '3.2.2 R-L ' + 'Langer Originalname '.repeat(30)]) {
    const zeile = { 'Objekt-Krankenhaus Name': name, Typ: 'SONSTIGES' }
    const objekt = objektAusQuellzeile(zeile, 'originalname')
    assert.equal(objekt.name, name)
    objektDatenSpeichern({ version: 1, objekte: [objekt] }, speicher)
    const geladen = objektDatenLaden(speicher)
    assert.equal(geladen.objekte[0].name, name)
    geladen.objekte[0].aktiv = false
    objektDatenSpeichern(geladen, speicher)
    assert.equal(objektDatenLaden(speicher).objekte[0].name, name)
    const erneut = objektAusQuellzeile(zeile, objekt.id)
    objektDatenSpeichern({ version: 1, objekte: [erneut] }, speicher)
    assert.equal(objektDatenLaden(speicher).objekte[0].name, name)
  }
})

test('2000 Objekte bleiben referenzierbar; Kartenfilter liefern nur aktive Objekte mit Position', () => {
  const objekte = Array.from({ length: 2000 }, (_, i) => ({ ...neuesObjekt(), name: `Objekt ${i}`, typId: i % 2 ? 'praxis' : 'gewaesser', aktiv: i % 3 !== 0, position: i % 5 ? { lat: 49, lng: 12 } : null }))
  const daten = objektDatenPruefen({ version: 1, objekte })
  assert.equal(daten.objekte.length, 2000)
  assert.equal(objektZu(daten.objekte, objekte[1000].id).name, 'Objekt 1000')
  assert.equal(objektZu(daten.objekte, 'unbekannt'), null)
  const kartenObjekte = aktiveKartenObjekte(daten.objekte, ['praxis'])
  assert.ok(kartenObjekte.length > 100)
  assert.ok(kartenObjekte.every(o => o.aktiv && o.position && o.typId === 'praxis'))
})
