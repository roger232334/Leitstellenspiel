import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adressVorschlaege as suchen, photonTreffer } from '../src/services/adressVorschlaege.js'
const adressVorschlaege = (text, feld, ort) => suchen(text, feld, ort, undefined, { onlineFallback: true })
import { installTestGebiet } from './gebietTestdaten.mjs'

test('Photon liefert Straße, Ort und Ortsteil getrennt', () => {
  const strasse = photonTreffer({ properties: { osm_key: 'highway', osm_id: 1, name: 'Hauptstraße', city: 'Regensburg', district: 'Reinhausen' } })
  assert.equal(strasse.strasse, 'Hauptstraße')
  assert.equal(strasse.ort, 'Regensburg')
  assert.equal(strasse.ortsteil, 'Reinhausen')
  assert.equal(photonTreffer({ properties: { name: 'Regensburg', osm_value: 'city' } }).ort, 'Regensburg')
  assert.equal(photonTreffer({ properties: { name: 'Reinhausen', osm_value: 'suburb', city: 'Regensburg' } }).ortsteil, 'Reinhausen')
})

test('Adressvorschläge berücksichtigen Ort, Mindestlänge und Cache', async () => {
  const original = globalThis.fetch
  const restore = installTestGebiet()
  const requests = []
  globalThis.fetch = async url => {
    requests.push(new URL(url))
    return { ok: true, json: async () => ({ features: [{ geometry: { coordinates: [12,49] }, properties: { osm_id: 2, osm_key: 'highway', name: 'Teststraße', city: 'Regensburg' } }] }) }
  }
  try {
    assert.deepEqual(await adressVorschlaege('Te', 'strasse'), [])
    const result = await adressVorschlaege('RemoteTeststr', 'strasse', 'Regensburg')
    assert.equal(result[0].strasse, 'Teststraße')
    assert.equal(requests[0].searchParams.get('q'), 'RemoteTeststr, Regensburg')
    assert.deepEqual(requests[0].searchParams.getAll('layer'), ['street', 'house'])
    await adressVorschlaege('RemoteTeststr', 'strasse', 'Regensburg')
    assert.equal(requests.length, 1)
    assert.equal(requests[0].hostname, 'photon.komoot.io')
  } finally { globalThis.fetch = original; restore() }
})
