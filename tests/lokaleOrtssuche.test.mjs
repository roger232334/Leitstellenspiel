import test from 'node:test'
import assert from 'node:assert/strict'
import { osmBestandSetzen } from '../src/data/osmStammdaten.js'
import { gebietLaden, gebietSpeichern, gebietsPruefung, zufaelligeGebietsAdresse, GEBIET_KONFIG_KEY, GEBIET_KEY } from '../src/data/gebiet.js'
import { lokalSuchen, erstelleSuchindex } from '../src/services/lokaleOrtssuche.js'
import { adressVorschlaege } from '../src/services/adressVorschlaege.js'
import { orteSuchen } from '../src/services/ortssuche.js'
import { testGebiet } from './gebietTestdaten.mjs'
import { osmPoiUebernahmeVorbereiten } from '../src/data/osmObjekte.js'
import { objektTypen } from '../src/data/objektTypen.js'
import { readFileSync } from 'node:fs'

function bestand() {
  const g = testGebiet(), o = g.ortschaften[0]
  const gemeinde = { id: 'gemeinde', geometry: o.geometry }
  const ort = { ...o, gemeindeId: gemeinde.id }
  delete ort.geometry
  const stadt = { ...ort, id: 'stadt', ortsteil: 'Regensburg' }
  return { ortschaften: [ort, stadt], adressen: [{ ...g.adressen[0], strasse: 'Hauptstraße', hausnummer: '12' }, { ...g.adressen[0], id: 'unvollstaendig', strasse: '', hausnummer: '9' }],
    strassen: [{ id: 'strasse', gebietId: ort.id, name: 'Hauptstraße', position: o.position || { lat: 49, lng: 12 } }],
    gemeinden: [gemeinde], orteIndex: new Map([[ort.id, ort], [stadt.id, stadt]]), gemeindenIndex: new Map([[gemeinde.id, gemeinde]]) }
}

test('Präfixindex kombiniert Wörter und sucht Hausnummern exakt', () => {
  const rows = ['Hauptstraße 12 Regensburg', 'Hauptstraße 1 Regensburg', 'Anderes 12 Cham']
  const suche = erstelleSuchindex(rows, r => r)
  assert.deepEqual(suche('Hauptstr 12 Reg'), [rows[0]])
  assert.deepEqual(suche('Hauptstr 1 Reg'), [rows[1]])
  assert.deepEqual(suche('München'), [])
  assert.deepEqual(suche('Hauptstr', r => r !== rows[0], 1), [rows[1]])
})

test('Lokale Suche, Gebietsprüfung und Generator verwenden Basis plus erhaltene Konfiguration', async () => {
  const original = globalThis.localStorage, fetchAlt = globalThis.fetch
  const store = new Map()
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
  globalThis.fetch = () => { throw new Error('Lokale Suche darf kein Netz benötigen') }
  osmBestandSetzen(bestand())
  try {
    assert.equal((await orteSuchen('Hauptstr 12 Reg'))[0].hausnummer, '12')
    assert.equal((await adressVorschlaege('Haupt', 'strasse', 'Regensburg'))[0].strasse, 'Hauptstraße')
    assert.equal(lokalSuchen('Nord', { feld: 'ort' })[0].ortsteil, 'Nord')
    assert.equal(lokalSuchen('Regens', { feld: 'ort' })[0].ortsteil, 'Regensburg', 'Direkter Ortsname erscheint vor Ortsteilen mit derselben Gemeinde')
    assert.deepEqual(await orteSuchen('München'), [])
    assert.equal(gebietsPruefung({ gebietId: 'test-ort', lat: 52, lng: 13 }).erlaubt, false)
    const g = gebietLaden()
    assert.equal(zufaelligeGebietsAdresse(g, () => 0.99).strasse, 'Hauptstraße')
    g.ortschaften[0].aktiv = false
    g.ortschaften[0].einsatzaufkommenFaktor = 0.75
    gebietSpeichern(g)
    assert.deepEqual(lokalSuchen('Hauptstr'), [])
    assert.equal(JSON.parse(store.get(GEBIET_KEY)).adressen.length, 0)
    assert.equal(JSON.parse(store.get(GEBIET_KONFIG_KEY)).ortschaften['test-ort'].einsatzaufkommenFaktor, 0.75)
    osmBestandSetzen(bestand()) // New imported base, same stable IDs.
    assert.equal(gebietLaden().ortschaften[0].aktiv, false)
    assert.equal(gebietLaden().ortschaften[0].einsatzaufkommenFaktor, 0.75)
    assert.equal(zufaelligeGebietsAdresse(), null)
  } finally {
    osmBestandSetzen(null)
    globalThis.localStorage = original
    globalThis.fetch = fetchAlt
  }
})

test('OSM-POI-Mappings passen zum Katalog; Übernahme erhält bereits bearbeitete Objekte', () => {
  const mappings = JSON.parse(readFileSync(new URL('../scripts/osm/poi-mapping.json', import.meta.url), 'utf8'))
  for (const m of mappings) assert.ok(objektTypen.some(t => t.id === m.typId), m.typId)
  const ort = bestand().ortschaften[0]
  const poi = { id: 'osm:node:99', gebietId: ort.id, name: 'OSM Klinik', typId: 'krankenhaus', position: { lat: 49, lng: 12 } }
  const objekt = osmPoiUebernahmeVorbereiten(poi, ort)
  objekt.name = 'Eigene Klinik'; objekt.aktiv = false
  assert.deepEqual(osmPoiUebernahmeVorbereiten({ ...poi, name: 'Neu importiert' }, ort, [objekt]), objekt)
  assert.throws(() => osmPoiUebernahmeVorbereiten({ ...poi, name: '' }, ort), /keinen Namen/)
})

test('Generator kann echte Straßen ohne Hausnummer nutzen, erfindet keine Adresse', () => {
  const g = testGebiet()
  g.adressen = []
  g.strassen = [{ id: 'osm-strasse', gebietId: 'test-ort', name: 'Waldweg', position: { lat: 49, lng: 12 } }]
  const a = zufaelligeGebietsAdresse(g, () => 0)
  assert.equal(a.strasse, 'Waldweg')
  assert.equal(a.hausnummer, '')
  assert.equal(a.quelle, 'osm-strasse')
})
