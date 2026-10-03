import test from 'node:test'
import assert from 'node:assert/strict'

test('Fehlender Import blockiert den Start nicht und erzeugt keine Ersatzdaten', async () => {
  const m = await import('../src/data/osmStammdaten.js?test-fehlt')
  assert.equal(await m.osmDatenLaden(async () => ({ status: 404 })), null)
  assert.equal(m.osmStatus.zustand, 'fehlt')
  assert.equal(m.osmStammdaten(), null)
})

test('Unvollständiger Snapshot wird niemals teilweise freigegeben', async () => {
  const m = await import('../src/data/osmStammdaten.js?test-abbruch')
  const manifest = { version: 1, dateien: Object.fromEntries(['orte.json', 'gebiete.json', 'strassen-stadt-regensburg.json'].map(n => [n, { pfad: `snapshot/${n}` }])) }
  const files = { 'manifest.json': manifest, 'snapshot/orte.json': [], 'snapshot/gebiete.json': { gemeinden: [], kreise: [{ id: 'stadt-regensburg' }] }, 'snapshot/strassen-stadt-regensburg.json': { spalten: [], zeilen: [] } }
  const result = await m.osmDatenLaden(async url => ({ ok: true, json: async () => files[url.replace('/data/gebiet/', '')] }))
  assert.equal(result, null)
  assert.equal(m.osmStatus.zustand, 'fehler')
  assert.equal(m.osmStammdaten(), null)
})
