<script setup>
import { computed, nextTick, ref } from 'vue'
import { dokumentationEintraege } from '../data/einsatzDokumentation.js'

const props = defineProps({ einsatz: { type: Object, default: null } })
const emit = defineEmits(['entwurf', 'uebernehmen'])
const gross = ref(false)
const eingabe = ref(null)
const liste = ref(null)
const eintraege = computed(() => dokumentationEintraege(props.einsatz))
const zeitText = zeit => zeit == null ? 'Altbestand' : new Date(zeit).toLocaleString('de-DE')
function neu() { eingabe.value?.focus() }
async function uebernehmen() {
  if (!props.einsatz?.dokumentationEntwurf?.trim()) return
  emit('uebernehmen', props.einsatz.id)
  await nextTick()
  if (liste.value) liste.value.scrollTop = liste.value.scrollHeight
  neu()
}
</script>

<template>
  <section class="dokumentation" :class="{ gross }" aria-label="Einsatzdokumentation" @keydown.esc="gross = false">
    <header>Einsatzdokumentation <span v-if="einsatz">· Einsatz #{{ einsatz.id }}</span></header>
    <div ref="liste" class="eintraege" role="log" aria-label="Dokumentierte Einträge">
      <article v-for="eintrag in eintraege" :key="eintrag.id">
        <time>{{ zeitText(eintrag.zeit) }}</time><span>{{ eintrag.text }}</span>
      </article>
      <p v-if="!eintraege.length">{{ einsatz ? 'Noch keine Dokumentation vorhanden.' : 'Bitte einen eröffneten Einsatz auswählen.' }}</p>
    </div>
    <textarea ref="eingabe" :disabled="!einsatz" :value="einsatz?.dokumentationEntwurf || ''"
      aria-label="Neuer Dokumentationseintrag" placeholder="Dokumentation eingeben … (Strg+Enter übernimmt)"
      @input="emit('entwurf', { id: einsatz.id, text: $event.target.value })"
      @keydown.ctrl.enter.prevent="uebernehmen" />
    <footer>
      <button type="button" :disabled="!einsatz" @click="neu">Neu</button>
      <button type="button" :disabled="!einsatz?.dokumentationEntwurf?.trim()" @click="uebernehmen">Übernehmen</button>
      <button type="button" :aria-pressed="gross" @click="gross = !gross">{{ gross ? 'Verkleinern' : 'Vergrößern' }}</button>
      <small v-if="einsatz?.dokumentationEntwurf">Entwurf · noch nicht übernommen</small>
    </footer>
  </section>
</template>

<style scoped>
.dokumentation { display: flex; flex-direction: column; min-height: 0; min-width: 0; height: 100%; font: 11px Arial, sans-serif; background: #edf0f2; color: #111; }
.gross { position: fixed; inset: 5vh 5vw; height: auto; z-index: 1000; border: 1px solid #89939c; box-shadow: 0 8px 40px #0006; }
header { padding: 5px 8px; font-weight: bold; background: linear-gradient(#e7edf1, #c3cfd7); border-bottom: 1px solid #89939c; }
.eintraege { flex: 1; min-height: 50px; overflow: auto; background: white; }
article { display: grid; grid-template-columns: 130px minmax(0, 1fr); padding: 6px; gap: 8px; border-bottom: 1px solid #d3dbe0; }
article span { white-space: pre-wrap; overflow-wrap: anywhere; }
time, p, small { color: #52636e; } p { margin: 8px; }
textarea { box-sizing: border-box; width: 100%; min-height: 55px; height: 70px; resize: vertical; max-height: 40%; border: 1px solid #a0a9af; padding: 6px; font: inherit; }
footer { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; align-items: center; }
button { padding: 4px 9px; font: inherit; border: 1px solid #89939c; background: linear-gradient(#fff, #dce2e6); cursor: pointer; } button:disabled { opacity: .5; cursor: default; }
</style>
