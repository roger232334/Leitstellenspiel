<script setup>
import { computed, shallowRef, watch } from 'vue'
import { ausruestungsKatalog, ausruestungsKategorien } from '../data/ausruestung/ausruestungsKatalog.js'
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue', 'standard'])
const aktuell = shallowRef(props.modelValue)
watch(() => props.modelValue, wert => { aktuell.value = wert })
const kategorien = computed(() => ausruestungsKategorien.map(k => ({ ...k, eintraege: ausruestungsKatalog.filter(e => e.kategorie === k.id) })).filter(k => k.eintraege.length))
function wert(e) { return aktuell.value[e.typ === 'number' ? 'ressourcen' : 'ausruestung'][e.id] }
function aendern(e, event) {
  const feld = e.typ === 'number' ? 'ressourcen' : 'ausruestung'
  const neu = e.typ === 'number' ? (event.target.value === '' ? '' : event.target.valueAsNumber) : event.target.checked
  aktuell.value = { ...aktuell.value, [feld]: { ...aktuell.value[feld], [e.id]: neu } }
  emit('update:modelValue', aktuell.value)
}
function zusammenfassung(k) {
  return k.eintraege.filter(e => e.typ === 'number' ? wert(e) > 0 : wert(e) === true)
    .map(e => e.typ === 'number' ? `${wert(e)} ${e.einheit} ${e.name}` : e.name).join(' · ') || 'Keine Beladung'
}
</script>
<template>
  <section class="beladungs-editor" aria-label="Beladung und Ausrüstung">
    <div class="beladungs-kopf"><h3>Beladung / Ausrüstung</h3><button type="button" @click="emit('standard')">Standardbeladung wiederherstellen</button></div>
    <p>Individuelle Beladung dieses Fahrzeugs. Vorlagen sind anpassbare Simulationswerte, keine verbindlichen Normbeladungen. Typen ohne Vorlage starten leer.</p>
    <details v-for="k in kategorien" :key="k.id" :open="k.id === 'brand'">
      <summary><strong>{{ k.name }}</strong><span>{{ zusammenfassung(k) }}</span></summary>
      <div class="beladungs-felder">
        <label v-for="e in k.eintraege" :key="e.id" :class="{ 'mengen-feld': e.typ === 'number' }">
          <template v-if="e.typ === 'number'"><span>{{ e.name }}</span><div><input :data-ausruestung="e.id" type="number" :value="wert(e)" :min="e.min" :step="e.step" required @input="aendern(e, $event)" /><span>{{ e.einheit }}</span></div></template>
          <template v-else><input :data-ausruestung="e.id" type="checkbox" :checked="wert(e)" @change="aendern(e, $event)" /><span>{{ e.name }}</span></template>
        </label>
      </div>
    </details>
  </section>
</template>
<style scoped>
.beladungs-editor { min-width: 0; border-top: 1px solid #b4bec5; padding-top: 16px; }
.beladungs-kopf { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; justify-content: space-between; }
h3 { margin: 0; font-size: 15px; } p { color: #52636e; line-height: 1.5; font-size: 12px; }
button { border: 1px solid #98a4ad; background: #edf1f4; color: #17232c; padding: 6px 9px; cursor: pointer; font: inherit; max-width: 100%; white-space: normal; }
details { margin-top: 6px; border: 1px solid #c7d0d6; background: #fff; }
summary { padding: 8px 10px; cursor: pointer; background: #edf1f4; overflow-wrap: anywhere; }
summary span { display: block; margin-top: 4px; font-size: 11px; color: #52636e; }
.beladungs-felder { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 8px 18px; padding: 12px; }
label { display: flex; align-items: center; gap: 8px; font-size: 12px; min-width: 0; }
.mengen-feld { display: grid; gap: 4px; }
.mengen-feld div { display: flex; align-items: center; gap: 7px; }
input[type=number] { min-width: 0; width: 100px; max-width: 65%; padding: 5px; border: 1px solid #98a4ad; font: inherit; }
input[type=checkbox] { width: 16px; height: 16px; flex-shrink: 0; margin: 0; }
</style>
