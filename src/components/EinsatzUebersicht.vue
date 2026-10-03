<script setup>
import { computed, ref } from 'vue'
import { haupteinsaetze, haupteinsatzZu, untereinsaetzeZu } from '../data/einsatzHierarchie.js'
import { einsatzAdresse } from '../data/einsatzErfassung.js'

const props = defineProps({ einsaetze: { type: Array, required: true }, fahrzeuge: { type: Array, required: true }, ausgewaehlterEinsatzId: { type: Number, default: null } })
const emit = defineEmits(['einsatz-oeffnen'])
const spalten = ['Einsatznummer', 'Schlagwort', 'Adresse', 'Bemerkung', 'Fahrzeuge', 'Zielort']
const standard = [130, 250, 290, 320, 290, 220]
const speicher = 'els-einsatzliste-spalten-v1'
function laden() {
  try {
    const werte = JSON.parse(localStorage.getItem(speicher))
    if (Array.isArray(werte) && werte.length === standard.length && werte.every(w => Number.isFinite(w) && w >= 70 && w <= 1500)) return werte
  } catch { /* Standardbreiten auch bei gesperrtem Speicher verwenden. */ }
  return [...standard]
}
const breiten = ref(laden())
function speichern() { try { localStorage.setItem(speicher, JSON.stringify(breiten.value)) } catch { /* Sitzung bleibt bedienbar. */ } }
let ziehen = null
function start(event, index) {
  if (event.button !== 0) return
  ziehen = { index, x: event.clientX, breite: breiten.value[index] }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function bewegen(event) {
  if (ziehen) breiten.value[ziehen.index] = Math.max(70, Math.min(1500, ziehen.breite + event.clientX - ziehen.x))
}
function ende(event) {
  ziehen = null
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  speichern()
}
function taste(event, index) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
  event.preventDefault()
  breiten.value[index] = Math.max(70, Math.min(1500, breiten.value[index] + (event.key === 'ArrowRight' ? 10 : -10)))
  speichern()
}
const aktiveId = computed(() => haupteinsatzZu(props.einsaetze, props.einsaetze.find(e => e.id === props.ausgewaehlterEinsatzId))?.id)
const markiert = ref(null)
const zeilen = computed(() => haupteinsaetze(props.einsaetze).map(e => {
  const familie = [e, ...untereinsaetzeZu(props.einsaetze, e)]
  const ids = new Set(familie.flatMap(e => e.fahrzeuge || []))
  const fahrzeuge = props.fahrzeuge.filter(f => ids.has(f.id) || familie.some(e => e.id === f.einsatzId))
  const kennung = e.schlagwort || Object.values(e.stichwoerter || {}).find(s => s?.kennung)?.kennung
  return { id: e.id, werte: [String(e.id), [kennung, e.meldung].filter(Boolean).join(' · '),
    e.erfassung ? einsatzAdresse(e.erfassung) || e.ort : e.ort,
    e.bemerkung, fahrzeuge.map(f => f.funkrufname).join(', '),
    [...new Set(familie.map(e => e.zielort || e.erfassung?.zielort).filter(Boolean))].join(', ')] }
}))
</script>

<template>
  <section class="einsatz-uebersicht" aria-label="Einsatzliste">
    <header><strong>Einsatzliste · {{ zeilen.length }} Einsätze</strong><span>Doppelklick oder Enter öffnet die Einsatzbearbeitung.</span>
      <button type="button" @click="breiten = [...standard]; speichern()">Spalten zurücksetzen</button></header>
    <div class="listen-scroll">
      <table :style="{ width: breiten.reduce((summe, wert) => summe + wert, 0) + 'px' }">
        <colgroup><col v-for="(breite, index) in breiten" :key="index" :style="{ width: breite + 'px' }" /></colgroup>
        <thead><tr><th v-for="(spalte, index) in spalten" :key="spalte" scope="col">
          {{ spalte }}<span class="spalten-griff" role="separator" tabindex="0" aria-orientation="vertical"
            :aria-label="spalte + ': Spaltenbreite ändern'" :aria-valuenow="breiten[index]" :aria-valuemin="70" :aria-valuemax="1500"
            @pointerdown.stop.prevent="start($event, index)" @pointermove="bewegen" @pointerup="ende" @pointercancel="ende"
            @lostpointercapture="ziehen = null" @keydown="taste($event, index)" />
        </th></tr></thead>
        <tbody><tr v-for="zeile in zeilen" :key="zeile.id" tabindex="0"
          :class="{ markiert: (markiert ?? aktiveId) === zeile.id, geoeffnet: aktiveId === zeile.id }"
          @click="markiert = zeile.id" @dblclick="emit('einsatz-oeffnen', zeile.id)" @keydown.enter.prevent="emit('einsatz-oeffnen', zeile.id)">
          <td v-for="(wert, index) in zeile.werte" :key="index" :title="wert || ''">{{ wert || '—' }}</td>
        </tr><tr v-if="!zeilen.length"><td :colspan="spalten.length">Noch keine Einsätze vorhanden.</td></tr></tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.einsatz-uebersicht { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; background: #edf0f2; color: #111; font: 12px Arial, sans-serif; }
header { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 9px; border-bottom: 1px solid #929da5; background: linear-gradient(#eff3f5, #cbd5db); }
header span { flex: 1; color: #4d5b66; }
button { font: inherit; padding: 5px 10px; border: 1px solid #89969f; background: #f5f7f8; cursor: pointer; }
.listen-scroll { flex: 1; min-height: 0; overflow: auto; }
table { table-layout: fixed; border-collapse: separate; border-spacing: 0; text-align: left; }
th, td { box-sizing: border-box; padding: 9px 12px; border-right: 1px solid #c0c8ce; border-bottom: 1px solid #c0c8ce; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
th { position: sticky; top: 0; z-index: 1; background: linear-gradient(#eff3f5, #cbd5db); padding-right: 16px; }
td { height: 36px; }
tbody tr { cursor: pointer; background: #fff; }
tbody tr:nth-child(even) { background: #f1f3f4; }
tbody tr:hover { background: #e7edf1; }
tbody tr.markiert { background: #d8e4ec; }
tbody tr.geoeffnet td:first-child { font-weight: bold; box-shadow: inset 3px 0 #526b7c; }
tbody tr:focus-visible { outline: 2px solid #526b7c; outline-offset: -2px; }
.spalten-griff { position: absolute; right: 0; top: 0; bottom: 0; width: 9px; cursor: col-resize; touch-action: none; user-select: none; }
.spalten-griff:hover, .spalten-griff:focus { background: #899da9; outline: none; }
</style>
