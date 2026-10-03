<script setup>
import { computed } from 'vue'
import { einsatzPhasen, lebenszyklusTraeger, zeitStandards } from '../data/einsatzLebenszyklus.js'
const props = defineProps({ einsatz: { type: Object, required: true }, einsaetze: { type: Array, required: true }, jetzt: { type: Number, required: true } })
const traeger = computed(() => lebenszyklusTraeger(props.einsaetze, props.einsatz))
const verlauf = computed(() => traeger.value.lebenszyklus)
const vergangen = computed(() => verlauf.value?.arbeitsbeginn == null ? 0 : Math.max(0, ((verlauf.value.beendetAm ?? props.jetzt) - verlauf.value.arbeitsbeginn) / 1000))
const dauer = computed(() => traeger.value.zeitplanung?.dauerSekunden ?? zeitStandards.basisMinuten * 60)
const fortschritt = computed(() => Math.min(100, Math.floor(vergangen.value / dauer.value * 100)))
</script>
<template>
  <section class="einsatz-verlauf" aria-label="Einsatzverlauf">
    <strong>Einsatzphase: {{ einsatzPhasen[verlauf?.phase] || (einsatz.status === 'abgeschlossen' ? 'Beendet' : 'Noch nicht alarmiert') }}</strong>
    <span v-if="traeger.id !== einsatz.id">Gemeinsamer Ablauf · #{{ traeger.id }}</span>
    <span v-if="traeger.szenario?.lageBekannt === false">{{ traeger.szenario.lageDurchFunk ? 'Fahrzeugrückmeldung steht noch aus.' : 'Dauer wird nach Erkundung bekannt.' }}</span>
    <template v-else>
      <span>Einsatzdauer vor Ort: ca. {{ Math.round(dauer / 60) }} min</span>
      <span>Verstrichen vor Ort: {{ Math.floor(vergangen / 60) }} min · {{ fortschritt }} %</span>
      <progress :value="fortschritt" max="100" aria-label="Einsatzfortschritt" />
    </template>
    <small>Die Dauer vor Ort beginnt mit dem ersten geeigneten Fahrzeug. Ausrücken und Anfahrt kommen hinzu.</small>
  </section>
</template>
<style scoped>
.einsatz-verlauf { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin-top: 10px; padding: 8px; border: 1px solid #a9b5be; background: #edf1f3; font-size: 12px; }
progress { width: 100px; height: 8px; accent-color: #526b7c; }
small { flex-basis: 100%; color: #52636e; }
</style>
