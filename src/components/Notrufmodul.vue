<script setup>
import {
  computed,
  ref,
  watch,
  nextTick,
} from 'vue'
import {
  notrufKategorien,
} from '../data/notruf/kategorien.js'
import { frageKatalog } from '../data/notruf/frageKatalog.js'
import { istSprachbeitrag, kommunikationsKanaele } from '../data/kommunikation.js'
import FunkBedienung from './FunkBedienung.vue'

defineOptions({ name: 'NotrufAnnahme' })

const props = defineProps({
  funkgruppen: { type: Array, default: () => [] },
  aktiveFunkgruppeId: { type: String, default: null },
  funkteilnehmerId: { type: Number, default: null },
  vorbereiteteFunkmeldung: { type: Object, default: null },
  fahrzeuge: { type: Array, default: () => [] },
  aktiveKategorie: {
    type: String,
    default: null,
  },

  uhrzeit: {
    type: String,
    default: '',
  },

  eingehenderNotruf: {
    type: Boolean,
    default: false,
  },

  klingelDauer: {
    type: String,
    default: '00:00',
  },

  notrufAktiv: {
    type: Boolean,
    default: false,
  },

  gespraech: {
    type: Array,
    default: () => [],
  },
})


const emit = defineEmits([
  'funkgruppe-auswaehlen',
  'funkteilnehmer-auswaehlen',
  'funkspruch-senden',
  'sprechwunsch-erzeugen',
  'einsatz-erfassen',
  'kategorie-auswaehlen',
  'notruf-annehmen',
  'test-notruf',
  'frage-senden',
])

const gespraechContainer =
  ref(null)
const sprachbeitraege = computed(() => props.gespraech.filter(istSprachbeitrag)
  .sort((a, b) => (Number.isFinite(a.zeit) ? a.zeit : 0) - (Number.isFinite(b.zeit) ? b.zeit : 0)))

function beitragsZeit(zeit, mitDatum = false) {
  const datum = new Date(zeit)
  if (!Number.isFinite(zeit) || Number.isNaN(datum.getTime())) return '—'
  return mitDatum ? datum.toLocaleString('de-DE') : datum.toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const aktiveGruppeId = ref(null)
const kategorie = computed(() => notrufKategorien.find(k => k.id === props.aktiveKategorie))
const frageGruppen = computed(() => frageKatalog[props.aktiveKategorie] ?? [])
const aktiveGruppe = computed(() => frageGruppen.value.find(g => g.id === aktiveGruppeId.value))
watch(() => props.aktiveKategorie, () => { aktiveGruppeId.value = null })
function zurKategorieauswahl() {
  aktiveGruppeId.value = null
  emit('kategorie-auswaehlen', null)
}
function eineEbeneZurueck() {
  if (aktiveGruppe.value) aktiveGruppeId.value = null
  else zurKategorieauswahl()
}

watch(
  () => sprachbeitraege.value.map(beitrag => beitrag.id),

  async () => {
    await nextTick()

    const element =
      gespraechContainer.value

    if (!element) {
      return
    }

    element.scrollTop =
      element.scrollHeight
  },

  {
    flush: 'post',
  },
)

function kategorieAuswaehlen(
  kategorie,
) {
  emit(
    'kategorie-auswaehlen',
    kategorie.id,
  )
}
</script>


<template>
  <div class="notruf-modul">

    <header class="notruf-modul-kopf">
      <div>
        <strong>
          Notrufannahme
        </strong>

        <span>
          Leitung 112
        </span>
      </div>

      <div class="notruf-uhr">
        {{ uhrzeit }}
      </div>
    </header>


    <!-- TELEFONSTATUS -->

    <div
      v-if="eingehenderNotruf"
      class="notruf-eingehend"
    >
      <div>
        <strong>
          ☎ Eingehender Notruf 112
        </strong>

        <span>
          Klingelt seit
          {{ klingelDauer }}
        </span>
      </div>

      <button
        type="button"
        @click="
          emit('notruf-annehmen')
        "
      >
        Notruf annehmen
      </button>
    </div>


    <div
      v-else-if="notrufAktiv"
      class="notruf-aktiv"
    >
      ● Gespräch aktiv
      <button type="button" class="einsatz-erfassen" @click="emit('einsatz-erfassen')">
        Einsatzdaten erfassen
      </button>
    </div>


    <div
      v-else
      class="notruf-bereit"
    >
      <span>
        ● Notrufleitung bereit
      </span>

      <button
        type="button"
        @click="
          emit('test-notruf')
        "
      >
        Testanruf
      </button>
    </div>


<main class="notruf-modul-inhalt">
      <section class="notruf-abfrage" aria-label="Strukturierte Abfrage und Fragenauswahl">
        <div class="notruf-bereich-titel">Abfrage / Fragenauswahl</div>
        <nav v-if="kategorie" class="abfrage-navigation" aria-label="Abfragenavigation">
          <div class="abfrage-zurueck">
            <button type="button" @click="eineEbeneZurueck">Zurück zur vorherigen Ebene</button>
            <button type="button" @click="zurKategorieauswahl">Zurück zur Kategorieauswahl</button>
          </div>
          <p aria-live="polite">{{ kategorie.name }}<template v-if="aktiveGruppe"> / {{ aktiveGruppe.name }}</template></p>
        </nav>
        <div class="abfrage-scroll">
          <template v-if="!kategorie">
            <div class="notruf-bereich-titel">Einsatzart auswählen</div>
            <div class="notruf-kategorien">
              <button v-for="eintrag in notrufKategorien" :key="eintrag.id" type="button"
                class="notruf-kategorie" :class="`kategorie-${eintrag.nummer}`" @click="kategorieAuswaehlen(eintrag)">
                <span class="notruf-kategorie-nummer">{{ eintrag.nummer }}</span>
                <span class="notruf-kategorie-name">{{ eintrag.name }}</span>
              </button>
            </div>
          </template>
          <template v-else-if="!aktiveGruppe">
            <div class="notruf-bereich-titel">Fragegruppe auswählen</div>
            <div class="abfrage-gruppen">
              <button v-for="gruppe in frageGruppen" :key="gruppe.id" type="button" @click="aktiveGruppeId = gruppe.id">
                <strong>{{ gruppe.name }}</strong><span>{{ gruppe.fragen.length }} Fragen</span>
              </button>
            </div>
            <p v-if="!frageGruppen.length" class="abfrage-hinweis">Für diese Kategorie sind noch keine Fragegruppen hinterlegt.</p>
          </template>
          <section v-else class="fragen-panel" :aria-label="aktiveGruppe.name">
            <div class="notruf-bereich-titel">{{ aktiveGruppe.name }}</div>
            <div class="fragen-scroll">
              <div class="frage-buttons">
                <button v-for="frage in aktiveGruppe.fragen" :key="frage.id" type="button"
                  :disabled="!notrufAktiv" @click="emit('frage-senden', { kategorie: aktiveKategorie, frageId: frage.id })">{{ frage.label }}</button>
              </div>
              <p v-if="!notrufAktiv" class="abfrage-hinweis">Fragen können während eines aktiven Notrufs gesendet werden.</p>
            </div>
          </section>
        </div>
      </section>
<section class="gespraech-panel" aria-label="Kommunikation">
      <div class="notruf-bereich-titel">
        Kommunikation
      </div>

      <div
  ref="gespraechContainer"
  class="gespraech-verlauf"

>

        <div
          v-if="sprachbeitraege.length === 0"
          class="gespraech-leer"
        >
          Noch kein Gesprächsinhalt.
        </div>

        <div
          v-for="
            nachricht in sprachbeitraege
          "
          :key="nachricht.id"
          class="gespraech-nachricht"
          :class="{
            funk: nachricht.kanal === 'funk',
            'telefon-disponent': nachricht.kanal === 'telefon' && nachricht.rolle === 'disponent',
          }"
        >
          <div class="beitrags-kopf">
            <strong>{{ kommunikationsKanaele[nachricht.kanal] }} · {{ nachricht.absender }}</strong>
            <small v-if="nachricht.kanal === 'funk' && nachricht.funkgruppeName">{{ nachricht.funkgruppeName }}</small>
            <time :title="beitragsZeit(nachricht.zeit, true)">{{ beitragsZeit(nachricht.zeit) }}</time>
          </div>

          <span>
            {{ nachricht.text }}
          </span>
        </div>

      </div>
    </section>
      <FunkBedienung :gruppen="funkgruppen" :aktive-gruppe-id="aktiveFunkgruppeId" :fahrzeuge="fahrzeuge"
        :teilnehmer-id="funkteilnehmerId" @teilnehmer-auswaehlen="emit('funkteilnehmer-auswaehlen', $event)"
        :vorbereitete-meldung="vorbereiteteFunkmeldung"
        @sprechwunsch="(daten, bestaetigen) => emit('sprechwunsch-erzeugen', daten, bestaetigen)"
        @gruppe-auswaehlen="emit('funkgruppe-auswaehlen', $event)"
        @sprechen="(daten, bestaetigen) => emit('funkspruch-senden', daten, bestaetigen)" />
    </main>

  </div>
</template>


<style scoped>
.notruf-modul {
  flex: 1;
  min-height: 0;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background: #d7dce0;

  color: #111;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 11px;
}


.notruf-modul-kopf {
  height: 42px;
  min-height: 42px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 10px;

  border-bottom:
    1px solid #89939c;

  background:
    linear-gradient(
      #edf1f3,
      #cbd5db
    );
}


.notruf-modul-kopf > div:first-child {
  display: flex;
  align-items: center;
  gap: 12px;
}


.notruf-modul-kopf strong {
  font-size: 12px;
}


.notruf-modul-kopf span {
  color: #52636e;
}


.notruf-uhr {
  padding: 5px 10px;

  border: 1px solid #9ca6ac;

  background: white;

  font-family: monospace;
  font-weight: bold;
}


.notruf-modul-inhalt {
  flex: 1 1 0;
  height: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1.25fr)
    minmax(0, 0.7fr);

  grid-template-rows:
    minmax(0, 1fr);

  gap: 4px;
  padding: 4px;

  overflow: hidden;
}







.notruf-bereich-titel {
  min-height: 25px;

  padding: 5px 7px;

  border-bottom:
    1px solid #89939c;

  background:
    linear-gradient(
      #d8e2e8,
      #c2ccd3
    );

  color: #334653;

  font-weight: bold;
}


.notruf-kategorien {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 6px;

  padding: 8px;
}


.notruf-kategorie {
  min-height: 40px;

  display: grid;

  grid-template-columns:
    28px 1fr;

  align-items: center;

  padding: 0;

  border: 1px solid #87939a;

  background: #dbe5e9;

  color: #111;

  cursor: pointer;

  font-family:
    Arial,
    sans-serif;

  box-shadow:
    inset 1px 1px
    rgba(255, 255, 255, 0.7);
}


.notruf-kategorie:hover {
  filter: brightness(0.96);
}


.notruf-kategorie.aktiv {
  outline: 3px solid #2d6191;

  font-weight: bold;
}


.notruf-kategorie-nummer {
  display: flex;
  align-items: center;
  justify-content: center;

  border-right:
    1px solid
    rgba(0, 0, 0, 0.15);

  font-size: 15px;
  font-weight: bold;
}


.notruf-kategorie-name {
  padding: 8px;

  text-align: center;

  font-size: 12px;
}


.kategorie-1 {
  background: #cbeaf2;
}


.kategorie-2 {
  background: #ffd09d;
}


.kategorie-3 {
  background: #93ced2;
}


.kategorie-4 {
  background: #d8c4de;
}


.kategorie-5 {
  background: #dbeaa5;
}


.kategorie-6 {
  background: #f3a0a0;
}


.kategorie-7 {
  background: #cbe4ce;
}


.kategorie-8 {
  background: #efc7d4;
}


.kategorie-9 {
  background: #9db8d0;
}


.kategorie-10 {
  background: #ffe294;
}





.notruf-eingehend,
.notruf-bereit,
.notruf-aktiv {
  min-height: 42px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 5px 10px;

  border-bottom:
    1px solid #89939c;
}


.notruf-eingehend {
  background: #f4b0b0;
}


.notruf-eingehend > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}


.notruf-eingehend button {
  padding: 7px 18px;

  border: 1px solid #47785b;

  background: #cce8d2;

  font-weight: bold;

  cursor: pointer;
}


.notruf-aktiv {
  justify-content: space-between;

  background: #cce8d2;

  color: #20582f;

  font-weight: bold;
}


.notruf-bereit {
  background: #e4e8ea;
}

.einsatz-erfassen {
  padding: 6px 12px;
  border: 1px solid #47785b;
  background: #f1f8f2;
  color: #20582f;
  cursor: pointer;
  font: inherit;
}


.notruf-bereit button {
  padding: 4px 10px;

  cursor: pointer;
}




.gespraech-panel {
  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  overflow: hidden;
}

.gespraech-panel
> .notruf-bereich-titel {
  flex: 0 0 auto;
}

.fragen-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  overflow: hidden;

  border: 1px solid #89939c;

  background: white;
}

.gespraech-verlauf {
  flex: 1 1 0;

  min-width: 0;
  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;

  padding: 8px;

  box-sizing: border-box;

  background: white;

  scrollbar-gutter: stable;
}


.gespraech-leer {
  padding: 20px;

  color: #777;

  text-align: center;
}


.gespraech-nachricht {
  margin-bottom: 10px;

  display: flex;
  flex-direction: column;

  gap: 2px;
}


.gespraech-nachricht strong {
  font-size: 10px;

  color: #52636e;
}


.gespraech-nachricht span {
  max-width: 90%;
  overflow-wrap: anywhere;

  padding: 7px 9px;

  border: 1px solid #abb4ba;

  background: #edf0f2;
}


.gespraech-nachricht.telefon-disponent {
  align-items: flex-end;
}


.gespraech-nachricht.telefon-disponent span {
  background: #d8eafb;
}

.gespraech-nachricht.funk span {
  background: #fff5cf;
  border-color: #c8ba85;
}

.beitrags-kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px 10px;
  max-width: 90%;
  overflow-wrap: anywhere;
}

.beitrags-kopf time {
  color: #52636e;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}


.fragen-scroll {
  flex: 1;
  min-height: 0;

  overflow-y: auto;

  padding: 7px;

  background: #f5f6f6;
}


.fragegruppe {
  margin-bottom: 8px;

  border:
    1px solid #9ba4aa;

  background: white;
}


.fragegruppe-titel {
  padding: 5px 7px;

  border-bottom:
    1px solid #9ba4aa;

  background:
    linear-gradient(
      #e6ecef,
      #d0dade
    );

  font-weight: bold;
}


.frage-buttons {
  display: flex;
  flex-wrap: wrap;

  gap: 5px;

  padding: 7px;
}


.frage-buttons button {
  min-width: 120px;
  min-height: 34px;

  padding: 5px 10px;

  border:
    1px solid #8a949a;

  background:
    linear-gradient(
      #ffffff,
      #dce1e4
    );

  color: #111;

  cursor: pointer;
}


.frage-buttons button:hover:not(
  :disabled
) {
  background: #d8eafb;
}


.frage-buttons button:disabled {
  opacity: 0.45;

  cursor: default;
}

.notruf-abfrage, .funk-panel, .gespraech-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #89939c;
  background: #edf0f2;
}
.notruf-bereich-titel { flex-shrink: 0; box-sizing: border-box; }
.abfrage-scroll, .funk-inhalt { flex: 1; min-height: 0; overflow: auto; }
.abfrage-navigation { flex-shrink: 0; padding: 8px; border-bottom: 1px solid #9ba4aa; }
.abfrage-navigation p { margin: 8px 0 0; color: #334653; overflow-wrap: anywhere; }
.abfrage-zurueck { display: flex; flex-wrap: wrap; gap: 6px; }
.abfrage-zurueck button, .abfrage-gruppen button { padding: 7px 9px; border: 1px solid #8a949a; background: linear-gradient(#fff, #dce1e4); color: #111; font: inherit; cursor: pointer; text-align: left; }
.abfrage-gruppen { display: grid; gap: 7px; padding: 8px; }
.abfrage-gruppen button { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; min-height: 38px; }
.abfrage-gruppen span { color: #52636e; }
.abfrage-zurueck button:hover, .abfrage-gruppen button:hover { background: #d8eafb; }
.abfrage-scroll .fragen-panel { height: auto; overflow: visible; margin: 0 7px 7px; }
.abfrage-scroll .fragen-scroll { overflow: visible; }
.abfrage-hinweis, .funk-inhalt { padding: 10px; }
.funk-felder { display: grid; gap: 6px; padding: 8px; }
.funk-felder select { width: 100%; min-width: 0; padding: 6px; font: inherit; }
.funk-inhalt p { line-height: 1.5; color: #52636e; }
.notruf-kategorie { min-width: 0; }
.notruf-kategorie-name { font-size: 11px; overflow-wrap: anywhere; }
@media (max-width: 850px) {
  .notruf-modul-inhalt { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 0.8fr); }
  .notruf-kategorien { grid-template-columns: minmax(0, 1fr); }
  .frage-buttons button { min-width: 0; width: 100%; overflow-wrap: anywhere; }
}
</style>
