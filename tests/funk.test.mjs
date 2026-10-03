import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { funkgruppenAusFahrzeugen, fahrzeugFunkgruppeId, funkspruchErzeugen } from '../src/data/funk.js'
import { istSprachbeitrag, kommunikationsBeitrag } from '../src/data/kommunikation.js'

const fahrzeuge = [
  { id: 1, funkgruppe: ' RD Regensburg ', funkrufnameLang: 'Rotkreuz Regensburg 71/1' },
  { id: 2, funkgruppe: 'rd regensburg', funkrufname: 'Rotkreuz Regensburg 71/2' },
  { id: 3, funkgruppe: 'FW Regensburg', funkrufname: 'Florian Regensburg 40/1' },
  { id: 4, funkgruppe: '', funkrufname: 'Ohne Gruppe' },
]
test('Funkgruppen verwenden vorhandene Fahrzeugzuordnung und eindeutige normalisierte IDs', () => {
  assert.equal(funkgruppenAusFahrzeugen(fahrzeuge).length, 2)
  assert.equal(fahrzeugFunkgruppeId(fahrzeuge[0]), fahrzeugFunkgruppeId(fahrzeuge[1]))
  assert.equal(fahrzeugFunkgruppeId(fahrzeuge[3]), null)
  assert.deepEqual(funkgruppenAusFahrzeugen([]), [])
})

test('Funkspruch besitzt Kanal, Gruppenbezug und Funkrufnamen; falsche Zuordnungen werden abgewiesen', () => {
  const daten = { gruppeId: fahrzeugFunkgruppeId(fahrzeuge[0]), gruppen: funkgruppenAusFahrzeugen(fahrzeuge), text: 'Hier Rotkreuz Regensburg 71/1.', zeit: 123 }
  const spruch = funkspruchErzeugen({ ...daten, fahrzeug: fahrzeuge[0] })
  assert.equal(spruch.kanal, 'funk')
  assert.equal(spruch.absender, fahrzeuge[0].funkrufnameLang)
  assert.equal(spruch.fahrzeugId, 1)
  assert.equal(spruch.funkgruppeId, daten.gruppeId)
  assert.ok(istSprachbeitrag(spruch))
  assert.equal(funkspruchErzeugen(daten).absender, 'Leitstelle')
  assert.throws(() => funkspruchErzeugen({ ...daten, fahrzeug: fahrzeuge[2] }))
  assert.throws(() => funkspruchErzeugen({ ...daten, fahrzeug: fahrzeuge[3] }))
  assert.throws(() => funkspruchErzeugen({ ...daten, gruppeId: 'unbekannt' }))
  assert.throws(() => funkspruchErzeugen({ ...daten, text: ' ' }))
})

test('App-Funkpfad funktioniert unabhängig vom Telefonzustand und schreibt nur Sprachbeiträge', () => {
  const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const code = source.slice(source.indexOf('function funkgruppeAuswaehlen('), source.indexOf('const telefonGespraech'))
  for (const telefonAktiv of [false, true]) {
    const telefon = kommunikationsBeitrag({ kanal: 'telefon', rolle: 'anrufer', text: 'Hallo', zeit: 100 })
    const k = { funk: { value: { aktiveGruppeId: null } }, funkgruppen: { value: funkgruppenAusFahrzeugen(fahrzeuge) },
      fahrzeuge: { value: fahrzeuge }, gespraech: { value: [telefon] }, simulationsZeit: { value: 200 },
      notrufDialog: { value: telefonAktiv }, funkspruchErzeugen }
    const api = new Function('k', `with (k) { ${code}; return { funkgruppeAuswaehlen, funkspruchSenden } }`)(k)
    const gruppeId = fahrzeugFunkgruppeId(fahrzeuge[0])
    api.funkgruppeAuswaehlen(gruppeId)
    let rueckgabe
    api.funkspruchSenden({ gruppeId, fahrzeugId: 1, text: 'Testmeldung' }, wert => { rueckgabe = wert })
    assert.deepEqual(rueckgabe, {})
    assert.deepEqual(k.gespraech.value.map(e => e.kanal), ['telefon', 'funk'])
    assert.equal(k.notrufDialog.value, telefonAktiv)
    assert.equal(k.gespraech.value[0], telefon)
    api.funkspruchSenden({ gruppeId, fahrzeugId: 3, text: 'Falsche Gruppe' }, wert => { rueckgabe = wert })
    assert.ok(rueckgabe.fehler)
    assert.equal(k.gespraech.value.length, 2)
  }
})
