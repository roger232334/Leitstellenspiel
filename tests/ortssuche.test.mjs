import { test } from 'node:test'
import assert from 'node:assert/strict'
import { einsatzAdresse, leereEinsatzErfassung } from '../src/data/einsatzErfassung.js'
import { ortTrefferAufbereiten, orteSuchen as suchen } from '../src/services/ortssuche.js'
const orteSuchen = text => suchen(text, { onlineFallback: true })
import { installTestGebiet } from './gebietTestdaten.mjs'

test('Ortsteile, Objekte und Adressbestandteile werden übernommen', () => {
  const treffer = ortTrefferAufbereiten({
    place_id: 1, class: 'amenity', type: 'hospital', name: 'Testklinik',
    lat: '49.01', lon: '12.10', display_name: 'Testklinik, Reinhausen, Regensburg',
    address: { road: 'Teststraße', house_number: '12a', city: 'Regensburg', suburb: 'Reinhausen' },
  })
  assert.equal(treffer.objekt, 'Testklinik')
  assert.equal(treffer.ortsteil, 'Reinhausen')
  assert.equal(treffer.lat, 49.01)
  assert.equal(einsatzAdresse(treffer), 'Teststraße 12a, Reinhausen, Regensburg')
  assert.equal(ortTrefferAufbereiten({ address: { town: 'Testort', quarter: 'Nord' } }).ortsteil, 'Nord')
  const neu = leereEinsatzErfassung()
  assert.equal(neu.ortsteil, '')
  assert.equal(neu.position, null)
})

test('Suche serialisiert Anfragen, cached Treffer und lässt Fehler erneut versuchen', async () => {
  const originalFetch = globalThis.fetch
  const restore = installTestGebiet()
  const zeiten = []
  const requests = []
  let fehler = true
  globalThis.fetch = async url => {
    zeiten.push(Date.now())
    requests.push(new URL(url))
    if (new URL(url).searchParams.get('q') === 'Fehler' && fehler) {
      fehler = false
      return { ok: false, status: 503 }
    }
    return { ok: true, json: async () => [{ place_id: 2, lat: '49', lon: '12', address: { suburb: 'Nord' } }] }
  }
  try {
    assert.deepEqual(await orteSuchen('  '), [])
    const [a, b] = await Promise.all([orteSuchen('Testort A'), orteSuchen('Testort B')])
    assert.equal(a[0].ortsteil, 'Nord')
    assert.equal(b[0].lat, 49)
    assert.ok(zeiten[1] - zeiten[0] >= 1000)
    assert.equal(requests[0].searchParams.get('addressdetails'), '1')
    assert.deepEqual(await orteSuchen(' testort a '), a)
    assert.equal(requests.length, 2)
    await assert.rejects(orteSuchen('Fehler'), /503/)
    assert.equal((await orteSuchen('Fehler')).length, 1)
  } finally {
    globalThis.fetch = originalFetch
    restore()
  }
})
