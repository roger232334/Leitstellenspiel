<script setup>
import { computed } from 'vue'
import { pruefeEinsatzBedarf, bedarfsKontext } from '../data/einsatzBedarf.js'
import { katalogEintrag, faehigkeitsRegeln } from '../data/ausruestung/ausruestungsKatalog.js'

const props = defineProps({ einsatz: { type: Object, required: true }, einsaetze: { type: Array, required: true }, fahrzeuge: { type: Array, required: true } })
const traeger = computed(() => bedarfsKontext(props.einsatz, props.einsaetze).einsatz)
const lage = computed(() => {
  try {
    const optionen = { einsaetze: props.einsaetze }
    return { gesamt: pruefeEinsatzBedarf(props.einsatz, props.fahrzeuge, optionen),
      amOrt: pruefeEinsatzBedarf(props.einsatz, props.fahrzeuge, { ...optionen, nurAmOrt: true }) }
  } catch (fehler) { return { fehler: fehler.message } }
})
function name(id, feld) {
  return feld === 'faehigkeiten' ? faehigkeitsRegeln.find(r => r.id === id)?.name || id : katalogEintrag(id)?.name || id
}
</script>

<template>
  <section class="ressourcenlage" aria-label="Ressourcenlage">
    <div v-if="traeger?.szenario" class="szenario-lage">
      <p>Notruf: „{{ traeger.szenario.notruf?.einstieg }}“</p>
      <template v-if="traeger.szenario.lageBekannt">
        <strong>Erkundete Lage: {{ traeger.szenario.lageName }}</strong>
        <p v-for="mod in traeger.szenario.modifikatoren" :key="mod.id">{{ mod.name }}: {{ mod.rueckmeldung }}</p>
      </template>
      <template v-else>
        <p>Reale Lage und Ressourcenbedarf noch nicht bekannt.</p>
        <p>{{ traeger.szenario.lageDurchFunk ? 'Die Fahrzeugrückmeldung nach der Erkundung abwarten.' : 'Die Erkundung beginnt nach Eintreffen des ersten geeigneten Fahrzeugs.' }}</p>
      </template>
    </div>
    <strong>Ressourcenlage</strong>
    <p v-if="traeger?.status === 'abgeschlossen'">Einsatz abgeschlossen. Die Fahrzeuge sind freigegeben; es wird kein aktueller Fehlbedarf mehr angezeigt.</p>
    <p v-else-if="lage.fehler" role="alert">Bedarf kann nicht ausgewertet werden: {{ lage.fehler }}</p>
    <p v-else-if="!lage.gesamt.definiert">{{ traeger?.szenario?.lageBekannt === false ? (traeger.szenario.lageDurchFunk ? 'Bedarf wird nach der Funkrückmeldung angezeigt.' : 'Bedarf wird nach Erkundung angezeigt.') : 'Noch kein tatsächlicher Einsatzbedarf hinterlegt.' }}</p>
    <template v-else>
      <p v-if="lage.gesamt.einsatzId !== einsatz.id">Gemeinsamer Bedarf des Haupteinsatzes #{{ lage.gesamt.einsatzId }}.</p>
      <p>Gezählt: alarmiert / unterwegs (3) und am Einsatzort (4), einschließlich zugehöriger Untereinsätze.</p>
      <div v-for="(wert, id) in lage.gesamt.ressourcen" :key="id" class="ressource" :class="{ fehlt: !wert.erfuellt }">
        <strong>{{ name(id) }}</strong>
        <span>{{ wert.vorhanden }} / {{ wert.benoetigt }} {{ katalogEintrag(id)?.einheit }}</span>
        <small>Am Ort: {{ lage.amOrt.ressourcen[id].vorhanden }} {{ katalogEintrag(id)?.einheit }}</small>
        <span>{{ wert.erfuellt ? 'Erfüllt' : `Fehlbedarf: ${wert.fehlt} ${katalogEintrag(id)?.einheit || ''}` }}</span>
      </div>
      <template v-for="feld in ['ausruestung', 'faehigkeiten']" :key="feld">
        <div v-for="(wert, id) in lage.gesamt[feld]" :key="id" class="ressource" :class="{ fehlt: !wert.erfuellt }">
          <strong>{{ name(id, feld) }}{{ feld === 'faehigkeiten' ? ' (Fähigkeit)' : '' }}</strong>
          <span>{{ wert.erfuellt ? 'Erfüllt' : 'Fehlt' }}</span>
          <small>Am Ort: {{ lage.amOrt[feld][id].erfuellt ? 'vorhanden' : 'noch nicht vorhanden' }}</small>
        </div>
      </template>
      <p class="gesamt" role="status">{{ lage.gesamt.erfuellt ? 'Bedarf durch alarmierte Fahrzeuge gedeckt' : 'Bedarf noch nicht erfüllt' }} · {{ lage.amOrt.erfuellt ? 'Am Einsatzort erfüllt' : 'Am Einsatzort noch nicht erfüllt' }}</p>
    </template>
  </section>
</template>

<style scoped>
.ressourcenlage { margin-top: 10px; padding: 10px; border: 1px solid #a9b5be; background: #f4f6f7; color: #17232c; font-size: 12px; }
p { margin: 6px 0; color: #52636e; }
.ressource { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 14px; padding: 6px 0; border-bottom: 1px solid #d6dde2; }
.ressource strong { flex: 1 1 150px; }
small { color: #52636e; }
.fehlt > span:last-child { color: #8a3900; font-weight: bold; }
.gesamt { font-weight: bold; color: #17232c; }
</style>
