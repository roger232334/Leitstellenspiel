<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { stichwortKatalog } from '../data/stichwortKatalog.js'
import { katalogStichwoerter, stichwortFelder, stichwortFeldText } from '../data/einsatzStichwoerter.js'
import { einsatzAdresse } from '../data/einsatzErfassung.js'
import { orteSuchen } from '../services/ortssuche.js'
import SuchVorschlaege from './SuchVorschlaege.vue'
import { adressVorschlaege } from '../services/adressVorschlaege.js'
import { gebietsPruefung } from '../data/gebiet.js'
import { objektVorschlaege, objektEinsatzFelder } from '../services/objektSuche.js'
defineOptions({ name: 'EinsatzMaske' })

const props = defineProps({
  modelValue: { type: Object, required: true },
  nummer: { type: [String, Number], default: 'Neu' },
  status: { type: String, default: 'In Erfassung' },
  readonly: Boolean,
  notizAenderbar: Boolean,
  busy: Boolean,
  meldebildAenderbar: Boolean,
})
const emit = defineEmits(['update:modelValue', 'speichern', 'meldebild-auswaehlen', 'notiz-aendern'])
const strassenSuche = ref(null)
const objektSuche = ref(null)
function objektWaehlen(treffer) {
  if (props.readonly || props.busy) return
  emit('update:modelValue', { ...props.modelValue, ...objektEinsatzFelder(treffer.objekt) })
}
function notizAendern(wert) {
  if (props.busy) return
  if (props.readonly) {
    if (props.notizAenderbar) emit('notiz-aendern', wert)
  } else aendern('notiz', wert)
}
const ortsfelder = ['objekt', 'strasse', 'hausnummer', 'ort', 'ortsteil']
function strassenVorschlaege(text, signal) {
  return adressVorschlaege(text, 'strasse', props.modelValue.ort || '', signal)
}
function ortsVorschlaege(text, signal) {
  return adressVorschlaege(text, 'ort', '', signal)
}
function schlagwortVorschlaege(text) {
  const teile = text.toLocaleLowerCase('de').trim().split(/\s+/)
  return stichwortKatalog.filter(e => e.aktiv !== false && teile.every(t =>
    [e.kennung, e.stichwort, e.schlagwort, e.kategorie].join(' ').toLocaleLowerCase('de').includes(t),
  )).slice(0, 40).map(e => ({ id: e.id, label: e.kennung, detail: e.stichwort, eintrag: e }))
}
function schlagwortEingeben(text) {
  if (props.readonly) return
  emit('update:modelValue', { ...props.modelValue, schlagwort: text,
    meldebildId: null, stichwort: '', meldung: '', ...katalogStichwoerter(null) })
}
function adressVorschlagWaehlen(treffer, feld) {
  if (!gebietsPruefung(treffer).erlaubt) return
  emit('update:modelValue', {
    ...props.modelValue,
    objektId: null, postleitzahl: '', adressKennzeichen: '',
    ...(feld === 'strasse' ? {
      strasse: treffer.strasse,
      hausnummer: treffer.hausnummer || '',
    } : {}),
    ort: treffer.ort || props.modelValue.ort,
    ortsteil: treffer.ortsteil,
    position: feld === 'strasse' && treffer.quelle === 'lokal' ? { lat: treffer.lat, lng: treffer.lng } : null,
    gebietId: treffer.gebietId,
  })
}
function aendern(feld, wert) {
  if (props.readonly || props.busy) return
  emit('update:modelValue', {
    ...props.modelValue, [feld]: wert,
    ...(ortsfelder.includes(feld) ? { position: null, gebietId: null, objektId: null, postleitzahl: '', adressKennzeichen: '' } : {}),
    ...(feld === 'meldung' ? { meldebildId: null, stichwort: '', schlagwort: '', ...katalogStichwoerter(null) } : {}),
  })
}
const eroeffnung = computed(() => {
  const datum = new Date(props.modelValue.eroeffnetAm)
  return Number.isNaN(datum.getTime()) ? null : datum
})
const katalogOffen = ref(false)
const katalogText = ref('')
const katalogTreffer = computed(() => {
  const woerter = katalogText.value.toLocaleLowerCase('de').trim().split(/\s+/)
  return stichwortKatalog.filter(e => e.aktiv !== false && woerter.every(w =>
    [e.kennung, e.stichwort, e.schlagwort, e.kategorie].join(' ').toLocaleLowerCase('de').includes(w),
  )).slice(0, 60)
})
function meldebildWaehlen(eintrag) {
  if (!props.readonly) emit('update:modelValue', {
    ...props.modelValue, meldebildId: eintrag.id,
    schlagwort: eintrag.kennung,
    ...katalogStichwoerter(eintrag),
    meldung: eintrag.schlagwort || eintrag.stichwort, stichwort: eintrag.stichwort,
  })
  emit('meldebild-auswaehlen', eintrag)
  katalogOffen.value = false
}
const sucheOffen = ref(false)
const suchtext = ref('')
const sucht = ref(false)
const treffer = ref([])
const suchHinweis = ref('')
let anfrageId = 0
function sucheSchliessen() {
  anfrageId++
  sucheOffen.value = false
  sucht.value = false
}
function sucheOeffnen(art) {
  suchtext.value = (art === 'ort'
      ? [props.modelValue.ortsteil, props.modelValue.ort].filter(Boolean).join(', ')
      : einsatzAdresse(props.modelValue))
  treffer.value = []
  suchHinweis.value = 'Suchbegriff eingeben und Suche starten.'
  sucheOffen.value = true
}
async function suchen() {
  if (sucht.value || !suchtext.value.trim()) return
  const id = ++anfrageId
  sucht.value = true
  treffer.value = []
  suchHinweis.value = ''
  try {
    const ergebnisse = await orteSuchen(suchtext.value)
    if (id !== anfrageId) return
    treffer.value = ergebnisse
    if (!ergebnisse.length) suchHinweis.value = 'Keine zulässigen Treffer im aktiven Leitstellengebiet. Gebietsdaten im Adminbereich prüfen.'
  } catch {
    if (id === anfrageId) suchHinweis.value = 'Die Ortssuche ist nicht erreichbar. Bitte erneut versuchen oder die Adresse manuell eingeben.'
  } finally {
    if (id === anfrageId) sucht.value = false
  }
}
function ortWaehlen(treffer) {
  if (!gebietsPruefung(treffer).erlaubt) return
  emit('update:modelValue', {
    ...props.modelValue,
    objekt: '', objektId: null, postleitzahl: '', adressKennzeichen: '', station: '', strasse: treffer.strasse,
    hausnummer: treffer.hausnummer, ort: treffer.ort, ortsteil: treffer.ortsteil,
    position: { lat: treffer.lat, lng: treffer.lng },
    gebietId: treffer.gebietId,
  })
  sucheSchliessen()
}
watch(() => props.nummer, () => { sucheSchliessen(); katalogOffen.value = false })
onBeforeUnmount(sucheSchliessen)
</script>

<template>
  <form class="einsatzmaske" @submit.prevent="emit('speichern')">
    <div class="masken-titel">Einsatzmaske</div>
    <div class="eroeffnung">
      <span>Nr. / Eröffnung</span>
      <strong>{{ nummer }}</strong>
      <span>{{ eroeffnung?.toLocaleDateString('de-DE') || '—' }}</span>
      <span>{{ eroeffnung?.toLocaleTimeString('de-DE') || '—' }}</span>
    </div>
    <fieldset :disabled="busy">
      <div class="masken-zeile">
        <label for="einsatz-objekt">Objekt / Stat.</label>
        <div class="felder objekt-zeile">
          <div class="suchfeld">
            <SuchVorschlaege ref="objektSuche" id="einsatz-objekt" :model-value="modelValue.objekt" :readonly="readonly" :laden="text => objektVorschlaege(text)" :minimum="0" :verzoegerung="0" :seitengroesse="50"
              @update:model-value="aendern('objekt', $event)" @auswahl="objektWaehlen" />
            <button v-if="!readonly" type="button" aria-label="Objekt suchen" title="Objekt nach Name oder Alias suchen" @click="objektSuche?.oeffnen()">⌕</button>
          </div>
          <input aria-label="Station oder Zusatz" placeholder="Station" :value="modelValue.station" :readonly="readonly" @input="aendern('station', $event.target.value)" />
        </div>
      </div>
      <div class="masken-zeile">
        <label for="einsatz-strasse">Straße / Nr.</label>
        <div class="felder strassen-zeile">
          <div class="suchfeld">
            <SuchVorschlaege ref="strassenSuche" id="einsatz-strasse" :model-value="modelValue.strasse" :readonly="readonly" :laden="strassenVorschlaege" quelle
              @update:model-value="aendern('strasse', $event)" @auswahl="adressVorschlagWaehlen($event, 'strasse')" />
            <button v-if="!readonly" type="button" aria-label="Adresse suchen" title="Straßenvorschläge anzeigen" @click="strassenSuche?.oeffnen()">⌕</button>
          </div>
          <input aria-label="Hausnummer" :value="modelValue.hausnummer" :readonly="readonly" @input="aendern('hausnummer', $event.target.value)" />
          <label class="sosi"><input type="checkbox" :checked="modelValue.sondersignal" :disabled="readonly" @change="aendern('sondersignal', $event.target.checked)" />SoSi</label>
        </div>
      </div>
      <div class="masken-zeile">
        <label for="einsatz-ort">Ort / Ortsteil</label>
        <div class="felder ort-zeile">
          <SuchVorschlaege id="einsatz-ort" :model-value="modelValue.ort" :readonly="readonly" :laden="ortsVorschlaege" quelle
            @update:model-value="aendern('ort', $event)" @auswahl="adressVorschlagWaehlen($event, 'ort')" />
          <div class="suchfeld">
            <input aria-label="Ortsteil" :value="modelValue.ortsteil" :readonly="readonly" @input="aendern('ortsteil', $event.target.value)" @keydown.enter.prevent="!readonly && sucheOeffnen('ort')" />
            <button v-if="!readonly" type="button" aria-label="Ort oder Ortsteil suchen" title="Ort oder Ortsteil suchen" @click="sucheOeffnen('ort')">⌕</button>
          </div>
        </div>
      </div>
      <div v-if="sucheOffen && !readonly" class="suchbereich" @keydown.esc="sucheSchliessen">
        <div class="suchkopf">
          <strong>Adress- und Ortsteilsuche</strong>
          <button type="button" aria-label="Ortssuche schließen" @click="sucheSchliessen">×</button>
        </div>
        <div class="suchaktion">
          <input v-model="suchtext" :disabled="sucht" aria-label="Suchbegriff für Ortssuche" placeholder="z. B. Hauptstr 12 Regenstauf oder Reinhausen" @keydown.enter.prevent="suchen" />
          <button type="button" :disabled="sucht || !suchtext.trim()" @click="suchen">{{ sucht ? 'Suche …' : 'Suchen' }}</button>
        </div>
        <p role="status">{{ sucht ? 'Adressen werden gesucht …' : suchHinweis }}</p>
        <div class="suchtreffer">
          <button v-for="eintrag in treffer" :key="eintrag.id" type="button" @click="ortWaehlen(eintrag)">
            <strong>{{ eintrag.objekt || eintrag.strasse || eintrag.ortsteil || eintrag.ort }}</strong>
            <span>{{ eintrag.displayName }}</span>
          </button>
        </div>
        <small>Adressdaten: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap-Mitwirkende</a></small>
      </div>
      <div class="masken-trenner"></div>
      <div class="masken-zeile">
        <label for="einsatz-anrufer">Meldender/Tel.</label>
        <div class="felder ort-zeile">
          <input id="einsatz-anrufer" :value="modelValue.anrufer" :readonly="readonly" @input="aendern('anrufer', $event.target.value)" />
          <input type="tel" aria-label="Rückrufnummer" :value="modelValue.rueckrufnummer" :readonly="readonly" @input="aendern('rueckrufnummer', $event.target.value)" />
        </div>
      </div>
      <div class="masken-zeile">
        <label for="einsatz-schlagwort">Schlagwort</label>
        <div class="felder stichwort-zeile">
          <div class="suchfeld">
            <SuchVorschlaege id="einsatz-schlagwort" :model-value="modelValue.schlagwort" :readonly="readonly && !meldebildAenderbar"
              :laden="schlagwortVorschlaege" :minimum="0" :verzoegerung="0"
              @update:model-value="schlagwortEingeben" @auswahl="meldebildWaehlen($event.eintrag)" />
            <button v-if="!readonly || meldebildAenderbar" type="button" aria-label="Schlagwort auswählen" @click="katalogOffen = !katalogOffen">▾</button>
          </div>
          <select aria-label="Priorität" :value="modelValue.prioritaet || '0'" :disabled="readonly" @change="aendern('prioritaet', $event.target.value)">
            <option v-for="p in ['0', '1', '2', '3']" :key="p">{{ p }}</option>
          </select>
        </div>
      </div>
      <div class="stichwort-felder">
        <div v-for="feld in stichwortFelder" :key="feld.id" class="stichwort-einzelfeld">
          <label :for="`einsatz-stw-${feld.id}`">{{ feld.label }}</label>
          <input :id="`einsatz-stw-${feld.id}`" :value="stichwortFeldText(modelValue.stichwoerter, feld.bereiche)" :title="stichwortFeldText(modelValue.stichwoerter, feld.bereiche)" readonly />
        </div>
      </div>
      <div class="masken-zeile">
        <label for="einsatz-meldung">Meldung/Stat.</label>
        <div class="felder meldung-zeile">
          <div class="suchfeld">
            <input id="einsatz-meldung" :value="modelValue.meldung" :readonly="readonly" :required="!readonly" @input="aendern('meldung', $event.target.value)" />
            <button v-if="!readonly || meldebildAenderbar" type="button" aria-label="Meldebild auswählen" title="Meldebildkatalog" @click="katalogOffen = !katalogOffen">▾</button>
          </div>
          <span class="masken-status">{{ status }}</span>
        </div>
      </div>
      <div v-if="katalogOffen" class="suchbereich" @keydown.esc="katalogOffen = false">
        <div class="suchkopf"><strong>Meldebildkatalog</strong><button type="button" aria-label="Meldebildkatalog schließen" @click="katalogOffen = false">×</button></div>
        <input v-model="katalogText" aria-label="Meldebild suchen" placeholder="Meldebild oder Stichwort suchen" @keydown.enter.prevent />
        <div class="suchtreffer">
          <button v-for="eintrag in katalogTreffer" :key="eintrag.id" type="button" @click="meldebildWaehlen(eintrag)">
            <strong>{{ eintrag.kennung }}</strong><span>{{ eintrag.stichwort }} · {{ eintrag.kategorie }}</span>
          </button>
          <p v-if="!katalogTreffer.length">Kein passendes Meldebild gefunden.</p>
        </div>
      </div>
      <label class="notiz-label" for="einsatz-notiz">Hinweise / Gesprächsnotizen</label>
      <textarea id="einsatz-notiz" :value="modelValue.notiz" :readonly="readonly && !notizAenderbar" rows="5" @input="notizAendern($event.target.value)"></textarea>
      <slot name="untereinsaetze" />
      <button v-if="!readonly" type="submit" class="erstellen-button">{{ busy ? 'Einsatz wird erstellt …' : 'Einsatz eröffnen' }}</button>
    </fieldset>
  </form>
</template>

<style scoped>
.einsatzmaske { padding: 5px; color: #111; font: 11px Arial, sans-serif; }
.masken-titel { font-weight: bold; border-bottom: 1px solid #bcc2c6; padding: 4px 0; }
.eroeffnung { display: grid; grid-template-columns: 80px 1fr 78px 65px; align-items: center; gap: 3px; padding: 6px 0 9px; }
.eroeffnung > :not(:first-child) { background: white; border: 1px solid #a3a7aa; padding: 3px; }
fieldset { border: 1px solid #b6bcc0; margin: 0; padding: 4px; min-width: 0; }
.masken-zeile { display: grid; grid-template-columns: 78px minmax(0, 1fr); align-items: center; gap: 3px; margin-bottom: 3px; }
.masken-zeile > label { font-weight: bold; }
.felder { display: grid; gap: 3px; min-width: 0; }
.objekt-zeile { grid-template-columns: minmax(0, 1fr) 76px; }
.strassen-zeile { grid-template-columns: minmax(0, 1fr) 55px 52px; }
.ort-zeile { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.stichwort-zeile { grid-template-columns: minmax(0, 1fr) 42px; }
.stichwort-felder { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 3px 7px; margin: 4px 0 7px; }
.stichwort-einzelfeld { display: grid; grid-template-columns: 57px minmax(0, 1fr); align-items: center; gap: 3px; }
.stichwort-einzelfeld label { font-weight: bold; }
.stichwort-einzelfeld input { background: #fff7c2; }
.meldung-zeile { grid-template-columns: minmax(0, 1fr) 85px; }
input, select, textarea { width: 100%; min-width: 0; border: 1px solid #969fa5; border-radius: 0; background: #fff; color: #111; font: inherit; padding: 3px; }
input, select { height: 23px; }
input:focus, textarea:focus, select:focus { outline: 2px solid #357ab0; outline-offset: -1px; }
.suchfeld { display: flex; min-width: 0; }
.suchfeld input { flex: 1; }
button { border: 1px solid #929ca3; background: linear-gradient(#fff, #dce1e4); color: #111; cursor: pointer; padding: 3px 7px; font: inherit; }
button:disabled { opacity: .6; cursor: default; }
.suchfeld button { width: 25px; flex-shrink: 0; font-size: 17px; padding: 0; }
.sosi { display: flex; align-items: center; gap: 3px; }
.sosi input { width: 13px; height: 13px; }
.masken-trenner { height: 7px; margin-bottom: 6px; border-bottom: 1px solid #bac0c4; }
.masken-status { display: flex; align-items: center; background: #e6ebee; padding: 3px; border: 1px solid #969fa5; }
.notiz-label { display: block; margin: 10px 0 4px; font-weight: bold; }
textarea { resize: vertical; min-height: 75px; }
.erstellen-button { width: 100%; margin-top: 8px; padding: 8px; background: #d5e9d7; font-weight: bold; }
.suchbereich { border: 1px solid #7e9eb5; padding: 6px; margin: 6px 0; background: #f6f9fb; }
.suchkopf, .suchaktion { display: flex; align-items: center; gap: 4px; margin-bottom: 5px; }
.suchkopf { justify-content: space-between; }
.suchaktion input { flex: 1; }
.suchbereich p { margin: 5px 0; }
.suchtreffer { max-height: 210px; overflow: auto; }
.suchtreffer button { width: 100%; display: flex; flex-direction: column; gap: 3px; text-align: left; padding: 7px 5px; background: white; margin-bottom: 3px; overflow-wrap: anywhere; }
.suchtreffer button:hover { background: #dfedf7; }
.suchtreffer span { color: #52636e; }
small { display: block; margin-top: 5px; }
a { color: #285878; }
</style>
