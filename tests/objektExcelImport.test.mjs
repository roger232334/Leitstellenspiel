import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { excelObjekteLesen, excelImportErgaenzen } from '../scripts/objekte/import-excel.js'
import { objektAusQuellzeile, objektDatenLaden, objektDatenSpeichern, objektImportZusammenfuehren, OBJEKTE_KEY } from '../src/data/objektVerwaltung.js'
import { objektImportLaden, objektImportStatus } from '../src/data/objektImport.js'

const zeile = (name = '3.2.2 R-L Musterfirma') => ({ 'Objekt-Krankenhaus Name': name, Typ: 'PRAXIS', XKoord_WGS84: '12,1', YKoord_WGS84: '49,2', 'Adresse Strasse': 'Straße', 'Adresse HausNr von': '1', 'Adresse Ort': 'Ort' })
const objekt = (id, name) => objektAusQuellzeile(zeile(name), id)
function speicherNeu() {
  const map = new Map()
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
}

test('XLSX-Dateileser nutzt den Adapter, erhält Zelltexte/PLZ und isoliert fehlerhafte Zeilen', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'els-excel-test-'))
  try {
    const w = new ExcelJS.Workbook(), s = w.addWorksheet('Objekte')
    w.addWorksheet('Info').addRow(['Keine Objektdaten'])
    s.addRow(['Berichtsname', 'Test'])
    const headers = Object.keys(zeile()).concat('Postleitzahl')
    s.addRow(headers)
    const original = '  3.2.2 R-L Praxis  Müller\nZweiter Teil  '
    const values = { ...zeile(original), Postleitzahl: 1234 }
    const row = s.addRow(headers.map(h => values[h]))
    row.getCell(headers.length).numFmt = '00000'
    s.addRow(headers.map(h => ({ ...values, Typ: 'Unbekannter Typ', 'Objekt-Krankenhaus Name': '3.2.2 R-L Andere Praxis' })[h]))
    s.addRow(headers.map(h => ({ ...values, XKoord_WGS84: '' })[h]))
    s.addRow(headers.map(h => ({ ...values, 'Objekt-Krankenhaus Name': '3.2.2 R-L Ohne Position', XKoord_WGS84: '', YKoord_WGS84: '' })[h]))
    s.addRow([])
    const file = path.join(dir, 'daten.xlsx')
    await w.xlsx.writeFile(file)
    const result = await excelObjekteLesen(file)
    assert.deepEqual(result.import.statistik, { eingeleseneZeilen: 4, erfolgreichImportiert: 3, uebersprungen: 1, duplikate: 0, unbekannteTypen: 1, fehler: 1 })
    assert.equal(result.objekte[0].name, original)
    assert.equal(result.objekte[0].adresse.postleitzahl, '01234')
    assert.equal(result.objekte[0].quelle, 'excel')
    assert.deepEqual(result.objekte[0].position, { lat: 49.2, lng: 12.1 })
    assert.equal(result.objekte[2].position, null)
    assert.equal((await excelObjekteLesen(file)).objekte[0].id, result.objekte[0].id)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('Batchimport erhält manuelle Objekte und führt nur neue Zeilen mit Zusatzadressen zusammen', () => {
  const manuell = { ...objekt('manuell-1'), quelle: 'manuell', bemerkung: 'Eigene Notiz', aktiv: false }
  const bestand = { version: 1, objekte: [manuell] }
  const alt = structuredClone(bestand)
  const neu = objekt('excel:neu', '3.2.2 R-L Bahnhof')
  const zweitadresse = { ...neu, id: 'excel:andere-zeile', adresse: { ...neu.adresse, strasse: 'Bahnstrecke', adressKennzeichen: 'KM' } }
  const result = objektImportZusammenfuehren(bestand, { objekte: [objekt('excel:manuell-dublette'), neu, zweitadresse] })
  assert.deepEqual(bestand, alt, 'Eingabebestand wird nicht mutiert')
  assert.deepEqual(result.daten.objekte[0], manuell)
  assert.equal(result.statistik.erfolgreichImportiert, 1)
  assert.equal(result.statistik.duplikate, 2)
  assert.deepEqual(result.daten.objekte[1].weitereAdressen, [zweitadresse.adresse])
  const storage = speicherNeu()
  objektDatenSpeichern(result.daten, storage)
  assert.deepEqual(objektDatenLaden(storage), result.daten)
})

test('Startimport ist wiederholbar und erhält Bearbeitungen/Löschungen sowie bestehende Objekte', async () => {
  const storage = speicherNeu()
  const manuell = { ...objekt('manuell'), quelle: 'manuell', bemerkung: 'Unverändert' }
  objektDatenSpeichern({ version: 1, objekte: [manuell] }, storage)
  const paket = { version: 1, import: { id: 'excel:test', statistik: {} }, objekte: [objekt('excel:neu', '3.2.2 R-L Neues Objekt'), objekt('excel:duplikat')] }
  const fetcher = async () => ({ ok: true, json: async () => paket })
  await objektImportLaden(fetcher, storage)
  assert.equal(objektImportStatus.statistik.erfolgreichImportiert, 1)
  assert.equal(objektImportStatus.statistik.duplikate, 1)
  assert.deepEqual(objektDatenLaden(storage).objekte[0], manuell)
  objektDatenSpeichern({ version: 1, objekte: [manuell] }, storage) // Editor intentionally deletes imported object.
  await objektImportLaden(fetcher, storage)
  assert.equal(objektImportStatus.zustand, 'bereits-importiert')
  assert.equal(objektDatenLaden(storage).objekte.length, 1)
  const prior = storage.getItem(OBJEKTE_KEY)
  await objektImportLaden(async () => ({ ok: true, json: async () => ({ ...paket, import: { id: 'excel:bad' }, objekte: [{ ...paket.objekte[0], position: { lat: 999, lng: 0 } }] }) }), storage)
  assert.equal(objektImportStatus.zustand, 'fehler')
  assert.equal(storage.getItem(OBJEKTE_KEY), prior)
})

test('Speicherfehler lassen den bisherigen Bestand und die Importquittung unverändert', async () => {
  const original = JSON.stringify({ version: 1, objekte: [] })
  const storage = { getItem: () => original, setItem: () => { throw new Error('Speicher voll') } }
  const paket = { version: 1, import: { id: 'excel:test' }, objekte: [objekt('excel:test')] }
  await objektImportLaden(async () => ({ ok: true, json: async () => paket }), storage)
  assert.equal(objektImportStatus.zustand, 'fehler')
  assert.match(objektImportStatus.meldung, /Speicher voll/)
})

test('Weitere Importdatei erhält das alte Paket und lässt bearbeitete/gelöschte Altobjekte unangetastet', async () => {
  const alt = { version: 1, import: { id: 'excel:alt' }, objekte: [objekt('excel:alt-1'), objekt('excel:alt-2', 'Altes gelöschtes Objekt')] }
  const neu = { version: 1, import: { id: 'excel:stadt' }, objekte: [objekt('excel:stadt-1', '3.2.1 R-S Neu')] }
  const original = structuredClone(alt)
  const bundle = excelImportErgaenzen(alt, neu)
  assert.deepEqual(bundle.pakete[0], original)
  assert.deepEqual(alt, original)
  assert.equal(excelImportErgaenzen(bundle, neu).pakete.length, 2)
  const storage = speicherNeu()
  const bearbeitet = { ...alt.objekte[0], name: 'Mein bearbeiteter Originalname', aktiv: false }
  objektDatenSpeichern({ version: 1, objekte: [bearbeitet], importe: [alt.import.id] }, storage)
  const fetcher = async () => ({ ok: true, json: async () => bundle })
  await objektImportLaden(fetcher, storage)
  const gespeichert = objektDatenLaden(storage)
  assert.equal(gespeichert.objekte.length, 2)
  assert.deepEqual(gespeichert.objekte[0], bearbeitet)
  assert.equal(gespeichert.objekte[1].name, neu.objekte[0].name)
  await objektImportLaden(fetcher, storage)
  assert.equal(objektImportStatus.zustand, 'bereits-importiert')
  assert.deepEqual(objektDatenLaden(storage), gespeichert)
  const frisch = speicherNeu()
  await objektImportLaden(fetcher, frisch)
  assert.equal(objektDatenLaden(frisch).objekte.length, 3, 'Frischer Browser erhält beide Quellen')
})

test('Stadt-Adressspalten, Hausnummernzusätze und Abteilungen bleiben beim Zusammenführen erhalten', () => {
  const row = { ...zeile('3.2.1 R-S Klinik'), 'Adresse Strasse': undefined, 'Adresse Straße': 'Originalstraße', 'Adresse HausNr Zusatz von': 'A',
    'Abteilung Name': '  Station 1  ', 'Abteilung XKoord_WGS84': '12,3', 'Abteilung YKoord_WGS84': '49,1', 'Abteilung Adresse Straße': 'Zufahrt', 'Abteilung Adresse HausNr Zusatz von': 'B' }
  const a = objektAusQuellzeile(row, 'excel:a')
  const b = objektAusQuellzeile({ ...row, 'Abteilung Name': 'Station 2' }, 'excel:b')
  assert.equal(a.adresse.strasse, 'Originalstraße')
  assert.equal(a.adresse.hausnummerZusatz, 'A')
  assert.equal(a.abteilungen[0].name, '  Station 1  ')
  assert.deepEqual(a.abteilungen[0].position, { lat: 49.1, lng: 12.3 })
  const result = objektImportZusammenfuehren({ version: 1, objekte: [] }, { objekte: [a, b, b] })
  assert.equal(result.daten.objekte.length, 1)
  assert.equal(result.daten.objekte[0].abteilungen.length, 2)
  const storage = speicherNeu()
  objektDatenSpeichern(result.daten, storage)
  assert.deepEqual(objektDatenLaden(storage), result.daten)
})
