import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ref, watch } from 'vue'

const script = readFileSync(new URL('../src/components/SuchVorschlaege.vue', import.meta.url), 'utf8')
  .split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
const warten = () => new Promise(resolve => setTimeout(resolve, 15))
function feld(laden, readonly = false, seitengroesse = 0) {
  const events = []
  let aufraeumen
  const api = new Function('ref', 'watch', 'onBeforeUnmount', 'defineProps', 'defineEmits', 'document', 'defineExpose',
    `${script}; return { eingeben, taste, schliessen, treffer, offen, text, oeffnen, eingabefeld, anzahlSichtbar };`)(
    ref, watch, callback => { aufraeumen = callback },
    () => ({ modelValue: '', laden, readonly, minimum: 3, verzoegerung: 5, id: 'test', seitengroesse }),
    () => (...args) => events.push(args), { getElementById: () => null }, () => {},
  )
  return { ...api, events, aufraeumen }
}

test('Tippen bündelt Anfragen und veraltete Antworten überschreiben keine neueren Treffer', async () => {
  const pending = []
  const f = feld(text => new Promise(resolve => pending.push({ text, resolve })))
  f.eingeben({ target: { value: 'Reg' } })
  assert.equal(f.offen.value, true, 'Trefferliste öffnet unmittelbar beim Tippen')
  f.eingeben({ target: { value: 'Rege' } })
  await warten()
  assert.equal(pending.length, 1)
  assert.equal(pending[0].text, 'Rege')
  f.eingeben({ target: { value: 'Regens' } })
  await warten()
  const neu = { id: 1, label: 'Regensburg' }
  pending[1].resolve([neu])
  await warten()
  pending[0].resolve([{ id: 2, label: 'Veraltet' }])
  await warten()
  assert.equal(f.treffer.value[0].label, 'Regensburg')
  f.taste({ key: 'ArrowDown', preventDefault() {} })
  f.taste({ key: 'Enter', preventDefault() {} })
  assert.equal(f.events.at(-1)[0], 'auswahl')
  assert.equal(f.events.at(-1)[1].id, 1)
  assert.equal(f.offen.value, false)
  f.aufraeumen()
})

test('Suchknopf fokussiert das bestehende Feld und öffnet dessen Treffer', async () => {
  const f = feld(async () => [{ id: 1, label: 'Hauptstraße' }])
  let fokussiert = false
  f.eingabefeld.value = { focus: () => { fokussiert = true } }
  f.text.value = 'Haupt'
  f.oeffnen()
  assert.equal(fokussiert, true)
  assert.equal(f.offen.value, true)
  await warten()
  assert.equal(f.treffer.value[0].label, 'Hauptstraße')
  f.aufraeumen()
})

test('Geschlossene Vorschläge bleiben nach einer späten Antwort geschlossen', async () => {
  let fertig
  const f = feld(() => new Promise(resolve => { fertig = resolve }))
  f.eingeben({ target: { value: 'Straße' } })
  await warten()
  f.schliessen()
  fertig([{ id: 1, label: 'Straße' }])
  await warten()
  assert.equal(f.offen.value, false)
  assert.equal(f.treffer.value.length, 0)
  f.aufraeumen()
})

test('Begrenzte Darstellung behält alle Treffer und erlaubt Auswahl jenseits der ersten 50', async () => {
  const f = feld(async () => Array.from({ length: 120 }, (_, id) => ({ id, label: `Objekt ${id}` })), false, 50)
  f.eingeben({ target: { value: 'Objekt' } })
  await warten()
  assert.equal(f.treffer.value.length, 120)
  assert.equal(f.anzahlSichtbar.value, 50)
  for (let i = 0; i < 60; i++) f.taste({ key: 'ArrowDown', preventDefault() {} })
  assert.equal(f.anzahlSichtbar.value, 60)
  f.taste({ key: 'Enter', preventDefault() {} })
  assert.equal(f.events.at(-1)[1].id, 59)
  f.eingeben({ target: { value: 'Andere Suche' } })
  assert.equal(f.anzahlSichtbar.value, 50)
  f.aufraeumen()
})
