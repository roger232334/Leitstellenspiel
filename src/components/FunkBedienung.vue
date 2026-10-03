<script setup>
import { computed, ref, watch } from 'vue'
import { fahrzeugFunkgruppeId } from '../data/funk.js'
const props = defineProps({ gruppen: { type: Array, required: true }, aktiveGruppeId: { type: String, default: null }, teilnehmerId: { type: Number, default: null }, fahrzeuge: { type: Array, required: true }, vorbereiteteMeldung: { type: Object, default: null } })
const emit = defineEmits(['gruppe-auswaehlen', 'teilnehmer-auswaehlen', 'sprechen', 'sprechwunsch'])
const text = ref('')
const antwortText = ref('')
watch(() => props.aktiveGruppeId, () => { antwortText.value = '' })
const absenderId = computed({ get: () => props.teilnehmerId, set: id => emit('teilnehmer-auswaehlen', id) })
const teilnehmer = computed(() => props.fahrzeuge.find(f => f.id === props.teilnehmerId))
const gruppenFahrzeuge = computed(() => props.fahrzeuge.filter(f => props.aktiveGruppeId && fahrzeugFunkgruppeId(f) === props.aktiveGruppeId))
const gruppe = computed(() => props.gruppen.find(g => g.id === props.aktiveGruppeId))
const gruppenMitAnzahl = computed(() => props.gruppen.map(g => ({ ...g,
  anzahl: props.fahrzeuge.filter(f => fahrzeugFunkgruppeId(f) === g.id).length,
})))
const fehler = ref('')
const meldungAktiv = computed(() => props.vorbereiteteMeldung?.gruppeId === props.aktiveGruppeId && props.vorbereiteteMeldung?.fahrzeugId === props.teilnehmerId)
watch(() => [props.aktiveGruppeId, props.teilnehmerId, props.vorbereiteteMeldung?.id], () => {
  text.value = ''
  fehler.value = ''
}, { immediate: true })
function sprechwunsch(fahrzeugId, prioritaet) {
  emit('sprechwunsch', { fahrzeugId, prioritaet }, ergebnis => { fehler.value = ergebnis.fehler || '' })
}
function meldungOeffnen() {
  emit('gruppe-auswaehlen', props.vorbereiteteMeldung.gruppeId)
  emit('teilnehmer-auswaehlen', props.vorbereiteteMeldung.fahrzeugId)
}
function sprechen() {
  if (!gruppe.value || (!meldungAktiv.value && !text.value.trim())) return
  // Der Aufrufer bestätigt die Übernahme; bei Fehler bleibt der Entwurf erhalten.
  emit('sprechen', { gruppeId: gruppe.value.id, fahrzeugId: absenderId.value, text: text.value, meldungId: meldungAktiv.value ? props.vorbereiteteMeldung.id : undefined }, erfolg => {
    fehler.value = erfolg.fehler || ''
    if (!erfolg.fehler) text.value = ''
  })
}
function antworten(wortlaut = antwortText.value) {
  if (!gruppe.value || !wortlaut.trim()) return
  emit('sprechen', { gruppeId: gruppe.value.id, fahrzeugId: null, text: wortlaut }, erfolg => {
    fehler.value = erfolg.fehler || ''
    if (!erfolg.fehler) antwortText.value = ''
  })
}
</script>
<template>
  <section class="funk-bedienung" aria-label="Funkbedienung und Funkgruppen">
    <div class="funk-titel">Funkbedienung / Funkgruppen</div>
    <div class="funk-scroll">
      <div class="funk-untertitel">Verfügbare Funkgruppen · {{ gruppen.length }}</div>
      <div class="funk-gruppen" role="group" aria-label="Funkgruppe auswählen">
        <button v-for="g in gruppenMitAnzahl" :key="g.id" type="button" class="funk-gruppe"
          :aria-pressed="g.id === aktiveGruppeId" @click="fehler = ''; emit('gruppe-auswaehlen', g.id)">
          <strong>{{ g.name }}</strong><small>{{ g.anzahl }} {{ g.anzahl === 1 ? 'Fahrzeug' : 'Fahrzeuge' }}</small>
        </button>
      </div>
      <p v-if="!gruppen.length">Noch keine Funkgruppen zugeordnet. Die Funkgruppe kann im Adminbereich beim Fahrzeug hinterlegt werden.</p>
      <div class="funk-aktiv" aria-live="polite">
        <small>Aktuell gewählte Funkgruppe</small>
        <strong>{{ gruppe?.name || 'Keine Funkgruppe ausgewählt' }}</strong>
        <small>Aktueller Funkteilnehmer</small>
        <strong>{{ teilnehmer ? (teilnehmer.funkrufnameLang || teilnehmer.funkrufname) : 'Leitstelle' }}</strong>
      </div>
      <section v-if="vorbereiteteMeldung" class="funk-aktiv" aria-label="Angenommene Fahrzeugmeldung">
        <strong>Fahrzeugmeldung bereit</strong>
        <span>Einsatz #{{ vorbereiteteMeldung.einsatzId }}</span>
        <button v-if="!meldungAktiv" type="button" @click="meldungOeffnen">Zur angenommenen Fahrzeugmeldung</button>
        <button v-else type="button" @click="sprechen">Fahrzeugmeldung empfangen</button>
      </section>
      <form class="leitstellen-antwort" aria-label="Als Leitstelle antworten" @submit.prevent="antworten()">
        <strong>Als Leitstelle antworten</strong>
        <small>{{ gruppe ? `An Funkgruppe ${gruppe.name}` : 'Bitte eine Funkgruppe auswählen.' }}</small>
        <label for="funk-antwort">Gesprochene Antwort</label>
        <textarea id="funk-antwort" v-model="antwortText" :disabled="!gruppe" rows="2" placeholder="Antwort der Leitstelle" />
        <div class="sprech-test">
          <button type="submit" :disabled="!gruppe || !antwortText.trim()">Antwort senden</button>
          <button type="button" :disabled="!gruppe" @click="antworten('Verstanden, hier Leitstelle.')">Verstanden</button>
        </div>
      </form>
      <section aria-label="Fahrzeuge der gewählten Funkgruppe">
        <div class="funk-untertitel">Fahrzeuge · {{ gruppenFahrzeuge.length }}</div>
        <p v-if="!gruppe">Bitte oben eine Funkgruppe auswählen.</p>
        <p v-else-if="!gruppenFahrzeuge.length">Dieser Funkgruppe sind keine Fahrzeuge zugeordnet.</p>
        <ul v-else class="funk-fahrzeuge">
          <li v-for="f in gruppenFahrzeuge" :key="f.id">
            <strong>{{ f.funkrufnameLang || f.funkrufname }}</strong><small v-if="f.typ">{{ f.typ }}</small>
            <div class="sprech-test">
              <small>Sprechwunsch simulieren:</small>
              <button type="button" :aria-label="`Normaler Sprechwunsch: ${f.funkrufnameLang || f.funkrufname}`" @click="sprechwunsch(f.id, 'normal')">Normal</button>
              <button type="button" :aria-label="`Dringender Sprechwunsch: ${f.funkrufnameLang || f.funkrufname}`" @click="sprechwunsch(f.id, 'dringend')">Dringend</button>
            </div>
          </li>
        </ul>
      </section>
      <p v-if="fehler" role="alert">{{ fehler }}</p>
      <details class="funk-simulation" :open="teilnehmerId != null">
      <summary>Funkspruch simulieren</summary>
      <form v-if="!meldungAktiv" @submit.prevent="sprechen">
        <label for="funk-absender">Absender (Simulation)</label>
        <select id="funk-absender" v-model="absenderId" :disabled="!gruppe">
          <option :value="null">Leitstelle</option>
          <option v-for="f in gruppenFahrzeuge" :key="f.id" :value="f.id">{{ f.funkrufnameLang || f.funkrufname }}</option>
        </select>
        <template v-if="!meldungAktiv">
          <label for="funk-text">Gesprochener Funkspruch</label>
          <textarea id="funk-text" v-model="text" :disabled="!gruppe" rows="4" placeholder="Wortlaut des Funkspruchs" />
        </template>
        <button type="submit" :disabled="!gruppe || (!meldungAktiv && !text.trim())">{{ meldungAktiv ? 'Fahrzeugrückmeldung senden' : 'Funkspruch erzeugen' }}</button>
      </form>
      </details>
    </div>
  </section>
</template>
<style scoped>
.funk-bedienung { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid #89939c; background: #edf0f2; }
.funk-titel, .funk-untertitel { padding: 5px 7px; border-bottom: 1px solid #89939c; background: linear-gradient(#d8e2e8, #c2ccd3); color: #334653; font-weight: bold; }
.funk-titel { flex-shrink: 0; min-height: 25px; box-sizing: border-box; }
.funk-scroll { padding: 10px; overflow: auto; min-height: 0; }
form { display: grid; gap: 7px; margin-top: 14px; }
select, textarea { box-sizing: border-box; width: 100%; min-width: 0; padding: 6px; margin: 5px 0; border: 1px solid #8a949a; font: inherit; }
textarea { resize: vertical; }
button { padding: 7px; border: 1px solid #8a949a; background: linear-gradient(#fff, #dce1e4); font: inherit; cursor: pointer; }
button:disabled { opacity: 0.45; cursor: default; }
p { color: #52636e; line-height: 1.5; }
ul { padding-left: 18px; overflow-wrap: anywhere; }
.funk-gruppen { display: grid; gap: 5px; margin: 7px 0; }
.funk-gruppe { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 5px 10px; text-align: left; overflow-wrap: anywhere; }
.funk-gruppe[aria-pressed=true] { background: #d8e4ec; box-shadow: inset 3px 0 #526b7c; border-color: #526b7c; }
.funk-gruppe:focus-visible, summary:focus-visible { outline: 2px solid #526b7c; outline-offset: 2px; }
.funk-aktiv { display: grid; gap: 4px; padding: 9px; margin: 10px 0; border: 1px solid #a9b5be; background: #f5f7f8; overflow-wrap: anywhere; }
small { color: #52636e; }
.funk-fahrzeuge { margin: 0; padding: 0; list-style: none; }
.funk-fahrzeuge li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px 10px; padding: 8px 7px; border-bottom: 1px solid #c7d0d6; background: #fff; }
.funk-fahrzeuge li:nth-child(even) { background: #f5f7f8; }
.funk-simulation { margin-top: 14px; border-top: 1px solid #a9b5be; padding-top: 9px; }
.leitstellen-antwort { padding: 9px; margin: 10px 0; border: 1px solid #a9b5be; background: #f5f7f8; }
summary { cursor: pointer; color: #334653; }
.sprech-test { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; flex-basis: 100%; }
.sprech-test button { padding: 3px 6px; }
</style>
