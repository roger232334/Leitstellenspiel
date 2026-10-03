<script setup>
import { hinweiseGruppieren } from '../data/leitstellenHinweise.js'
import { computed, ref } from 'vue'

const props = defineProps({ hinweise: { type: Array, required: true } })
const emit = defineEmits(['entfernen', 'annehmen'])
const gruppen = computed(() => hinweiseGruppieren(props.hinweise))
const aktiveId = ref(null)
const titel = ref('')
const dialog = ref(null)
const fehler = ref('')
const aktiveGruppe = computed(() => gruppen.value.find(g => g.id === aktiveId.value))
function oeffnen(gruppe) {
  aktiveId.value = gruppe.id
  titel.value = gruppe.titel
  fehler.value = ''
  dialog.value.showModal()
}
function annehmen(hinweis) {
  emit('annehmen', hinweis.id, ergebnis => { fehler.value = ergebnis.fehler || '' })
}
</script>
<template>
  <section class="hinweisleiste" aria-label="Leitstellenhinweise">
    <div class="hinweis-kopf"><strong>Leitstellenhinweise</strong></div>
    <div v-if="gruppen.length" class="hinweis-reihe" aria-label="Hinweisgruppen">
      <button v-for="gruppe in gruppen" :key="gruppe.id" type="button" class="hinweis-karte"
        :class="{ dringend: gruppe.dringend }" aria-haspopup="dialog"
        :aria-label="`${gruppe.titel}, ${gruppe.hinweise.length} offene Hinweise${gruppe.dringend ? ', dringend' : ''}`"
        @click="oeffnen(gruppe)">{{ gruppe.titel }}</button>
    </div>
    <p v-else class="hinweis-leer">Keine offenen Leitstellenhinweise.</p>
    <dialog ref="dialog" class="hinweis-dialog" aria-labelledby="hinweis-dialog-titel" @close="fehler = ''">
      <header><strong id="hinweis-dialog-titel">{{ titel }}</strong><button type="button" aria-label="Detailfenster schließen" @click="dialog.close()">Schließen</button></header>
      <p v-if="fehler" role="alert" class="fehler">{{ fehler }}</p>
      <div class="detail-liste">
        <p v-if="!aktiveGruppe">Keine offenen Hinweise mehr in dieser Gruppe.</p>
        <article v-for="hinweis in aktiveGruppe?.hinweise || []" :key="hinweis.id" :class="{ dringend: hinweis.prioritaet === 'dringend' }">
          <template v-if="hinweis.typ === 'sprechwunsch'">
            <strong>{{ hinweis.funkrufname }}</strong>
            <span>{{ hinweis.funkgruppe }} · {{ hinweis.prioritaet === 'dringend' ? 'Dringender Sprechwunsch' : 'Sprechwunsch' }}</span>
          </template>
          <template v-else><strong>{{ hinweis.titel }}</strong><p>{{ hinweis.text }}</p></template>
          <span v-if="hinweis.einsatzId != null">Einsatz #{{ hinweis.einsatzId }}</span>
          <small v-if="hinweis.test">Testhinweis</small>
          <time>{{ new Date(hinweis.erstelltAm).toLocaleString('de-DE') }}</time>
          <div class="aktionen">
            <button v-if="hinweis.typ === 'sprechwunsch'" type="button" @click="annehmen(hinweis)">Sprechaufforderung senden</button>
            <button type="button" @click="emit('entfernen', hinweis.id)">{{ hinweis.typ === 'sprechwunsch' ? 'Verwerfen' : 'Als erledigt entfernen' }}</button>
          </div>
        </article>
      </div>
    </dialog>
  </section>
</template>
<style scoped>
.hinweisleiste { flex: 0 0 auto; min-width: 0; border-top: 1px solid #89939c; background: #e5eaed; font: 11px Arial, sans-serif; color: #17232c; }
.hinweis-kopf { padding: 4px 8px; background: linear-gradient(#edf1f3, #cbd5db); border-bottom: 1px solid #a9b5be; }
.hinweis-reihe { display: flex; gap: 6px; padding: 6px; overflow-x: auto; }
button { border: 1px solid #8a949a; padding: 5px 9px; font: inherit; color: inherit; background: linear-gradient(#fff, #dce1e4); cursor: pointer; }
button:focus-visible { outline: 2px solid #526b7c; outline-offset: 2px; }
.hinweis-karte { flex: 0 0 auto; max-width: 260px; min-height: 32px; background: #f5f7f8; font-weight: bold; overflow-wrap: anywhere; }
.dringend { background: #fff0a6; border-color: #b79a39; }
.hinweis-leer { margin: 0; padding: 8px; color: #52636e; }
.hinweis-dialog { width: min(480px, calc(100vw - 40px)); max-height: 70vh; box-sizing: border-box; padding: 0; border: 1px solid #89939c; background: #edf0f2; color: #17232c; font: 12px Arial, sans-serif; }
.hinweis-dialog::backdrop { background: rgb(0 0 0 / 20%); }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px; background: linear-gradient(#edf1f3, #cbd5db); position: sticky; top: 0; }
.detail-liste { padding: 8px; }
article { display: grid; gap: 6px; padding: 10px; margin-bottom: 8px; border: 1px solid #acb6bd; background: #fff; overflow-wrap: anywhere; }
article.dringend { background: #fff0a6; }
.aktionen { display: flex; flex-wrap: wrap; gap: 6px; }
time, small { color: #52636e; }
p { margin: 4px 0; }
.fehler { padding: 8px; color: #8a3900; }
</style>
