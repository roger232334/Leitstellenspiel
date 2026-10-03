<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, required: true },
  laden: { type: Function, required: true },
  readonly: Boolean,
  minimum: { type: Number, default: 3 },
  verzoegerung: { type: Number, default: 450 },
  quelle: Boolean,
  seitengroesse: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue', 'auswahl'])
const text = ref(props.modelValue)
const eingabefeld = ref(null)
function oeffnen() {
  if (props.readonly) return
  eingabefeld.value?.focus()
  suchen()
}
defineExpose({ oeffnen })
const offen = ref(false)
const treffer = ref([])
const aktiv = ref(-1)
const hinweis = ref('')
const anzahlSichtbar = ref(props.seitengroesse || Infinity)
let timer
let controller
let version = 0
watch(() => props.modelValue, wert => { text.value = wert })
function schliessen() {
  offen.value = false
  clearTimeout(timer)
  controller?.abort()
  version++
}
function suchen() {
  schliessen()
  if (props.readonly) return
  offen.value = true
  treffer.value = []
  anzahlSichtbar.value = props.seitengroesse || Infinity
  aktiv.value = -1
  if (text.value.trim().length < props.minimum) {
    hinweis.value = `Mindestens ${props.minimum} Zeichen eingeben.`
    return
  }
  hinweis.value = 'Suche …'
  const id = version
  timer = setTimeout(async () => {
    controller = new AbortController()
    try {
      const result = await props.laden(text.value, controller.signal)
      if (id !== version) return
      treffer.value = result
      hinweis.value = result.length ? '' : 'Keine passenden Treffer.'
    } catch {
      if (id === version) hinweis.value = 'Suche nicht erreichbar. Freie Eingabe ist weiterhin möglich.'
    }
  }, props.verzoegerung)
}
function eingeben(event) {
  text.value = event.target.value
  emit('update:modelValue', text.value)
  suchen()
}
function waehlen(eintrag) {
  schliessen()
  text.value = eintrag.label
  emit('auswahl', eintrag)
}
function taste(event) {
  if (event.key === 'Escape') { event.preventDefault(); schliessen() }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!offen.value) suchen()
    if (treffer.value.length) {
      aktiv.value = (aktiv.value + (event.key === 'ArrowDown' ? 1 : -1) + treffer.value.length) % treffer.value.length
      anzahlSichtbar.value = Math.max(anzahlSichtbar.value, aktiv.value + 1)
      const doc = event.target?.ownerDocument || document
      doc.getElementById(`${props.id}-treffer-${aktiv.value}`)?.scrollIntoView({ block: 'nearest' })
    }
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    if (offen.value && treffer.value.length) waehlen(treffer.value[Math.max(0, aktiv.value)])
    else suchen()
  }
}
onBeforeUnmount(schliessen)
</script>

<template>
  <div class="vorschlag-feld" @focusout="schliessen">
    <input ref="eingabefeld" :id="id" :value="text" :readonly="readonly" autocomplete="off" role="combobox"
      aria-autocomplete="list" :aria-expanded="offen" :aria-controls="`${id}-liste`"
      :aria-activedescendant="offen && aktiv >= 0 ? `${id}-treffer-${aktiv}` : undefined"
      @input="eingeben" @focus="suchen" @keydown="taste" />
    <div v-if="offen" class="vorschlag-dropdown">
      <div :id="`${id}-liste`" role="listbox" class="vorschlag-liste">
        <div v-for="(eintrag, index) in treffer.slice(0, anzahlSichtbar)" :id="`${id}-treffer-${index}`" :key="eintrag.id"
          role="option" :aria-selected="aktiv === index" class="vorschlag-option" :class="{ aktiv: aktiv === index }"
          @mousedown.prevent @click="waehlen(eintrag)">
          <strong>{{ eintrag.label }}</strong><span>{{ eintrag.detail }}</span>
        </div>
      </div>
      <div v-if="seitengroesse && treffer.length" class="treffer-seiten">
        <small>{{ Math.min(anzahlSichtbar, treffer.length) }} von {{ treffer.length }} Treffern</small>
        <button v-if="anzahlSichtbar < treffer.length" type="button" @mousedown.prevent @click="anzahlSichtbar += seitengroesse">Mehr anzeigen</button>
      </div>
      <p v-if="hinweis" role="status">{{ hinweis }}</p>
      <small v-if="quelle"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap-Mitwirkende</a></small>
    </div>
  </div>
</template>

<style scoped>
.vorschlag-feld { position: relative; min-width: 0; flex: 1; }
.treffer-seiten { display: flex; align-items: center; justify-content: space-between; padding: 4px; gap: 6px; }
.treffer-seiten button { cursor: pointer; font: inherit; padding: 5px; border: 1px solid #98a4ad; background: #edf0f2; color: #17232c; }
input { width: 100%; min-width: 0; height: 23px; border: 1px solid #969fa5; border-radius: 0; background: white; color: #111; font: inherit; padding: 3px; }
input:focus { outline: 2px solid #357ab0; outline-offset: -1px; }
.vorschlag-dropdown { position: absolute; z-index: 30; top: 100%; left: 0; width: max(100%, 250px); max-width: 310px; background: white; color: #111; border: 1px solid #7e9eb5; box-shadow: 0 3px 8px #0003; }
.vorschlag-liste { max-height: 220px; overflow: auto; }
.vorschlag-option { display: flex; flex-direction: column; gap: 3px; padding: 7px; border-bottom: 1px solid #d6dfe5; cursor: pointer; overflow-wrap: anywhere; }
.vorschlag-option:hover, .vorschlag-option.aktiv { background: #deedf8; }
.vorschlag-option span { color: #52636e; }
p, small { display: block; margin: 0; padding: 6px; }
</style>
