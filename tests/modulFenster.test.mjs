import test from 'node:test'
import assert from 'node:assert/strict'
import { tabHerausgezogen, fensterDokumentAbwarten } from '../src/services/modulFenster.js'

test('Zusatzfenster wartet auf sein HTTP-Dokument statt about:blank', async () => {
  const url = 'http://localhost:5173/modul-fenster.html'
  const fenster = { closed: false, location: { href: 'about:blank' }, document: { readyState: 'complete' } }
  let bereit = false
  const laden = fensterDokumentAbwarten(fenster, url).then(() => { bereit = true })
  await new Promise(resolve => setTimeout(resolve, 70))
  assert.equal(bereit, false)
  fenster.location.href = url
  await laden
  assert.equal(bereit, true)
})

test('Vorzeitig geschlossenes Zusatzfenster wird nicht vorbereitet', async () => {
  await assert.rejects(fensterDokumentAbwarten({ closed: true }, 'http://localhost/modul-fenster.html'))
})

test('Tab wird erst nach deutlicher Bewegung außerhalb der Leiste ausgelagert', () => {
  const start = { clientX: 100, clientY: 15 }
  const leiste = { left: 0, right: 800, top: 0, bottom: 30 }
  assert.equal(tabHerausgezogen(start, { clientX: 300, clientY: 15 }, leiste), false)
  assert.equal(tabHerausgezogen(start, { clientX: 100, clientY: 50 }, leiste), false)
  assert.equal(tabHerausgezogen(start, { clientX: 100, clientY: 80 }, leiste), true)
  assert.equal(tabHerausgezogen(start, { clientX: -100, clientY: 15 }, leiste), true)
  assert.equal(tabHerausgezogen(start, { clientX: 900, clientY: 15 }, leiste), true)
  assert.equal(tabHerausgezogen(null, start, leiste), false)
})
