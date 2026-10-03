<script setup>
import { ref, shallowRef, nextTick, onBeforeUnmount } from 'vue'
import { fensterVorbereiten, fensterDokumentAbwarten } from '../services/modulFenster.js'
const props = defineProps({ titel: { type: String, required: true }, aktiv: Boolean })
const emit = defineEmits(['ausgelagert', 'fehler'])
const ziel = shallowRef(null)
const extern = ref(false)
let fenster = null
let aufraeumen = null
let kontrolle = null
let schliesst = false
let beimVerlassen = null

function fokussieren() { if (fenster && !fenster.closed) fenster.focus() }
async function andocken() {
  if (!fenster || schliesst) return
  schliesst = true
  const vorher = fenster
  vorher.removeEventListener('pagehide', beimVerlassen)
  clearInterval(kontrolle)
  aufraeumen?.()
  // Den Teleport zurücksetzen, bevor sein Zieldokument geschlossen wird.
  extern.value = false
  ziel.value = null
  emit('ausgelagert', false)
  await nextTick()
  if (!vorher.closed) vorher.close()
  fenster = null
  schliesst = false
}
async function auslagern(position = {}) {
  if (fenster && !fenster.closed) { fokussieren(); return true }
  const left = Number.isFinite(position.screenX) ? Math.round(position.screenX - 180) : window.screenX + 70
  const top = Number.isFinite(position.screenY) ? Math.round(position.screenY - 30) : window.screenY + 70
  const url = new URL(`${import.meta.env.BASE_URL}modul-fenster.html`, window.location.href).href
  const neu = window.open(url, '_blank', `popup=yes,width=1280,height=850,left=${left},top=${top},resizable=yes,scrollbars=yes`)
  if (!neu) {
    emit('fehler', 'Das Zusatzfenster wurde vom Browser blockiert. Bitte Pop-ups für diese Seite erlauben und erneut auf ↗ klicken.')
    return false
  }
  fenster = neu
  try {
    await fensterDokumentAbwarten(neu, url)
    const vorbereitet = fensterVorbereiten(neu, props.titel)
    fenster = neu
    aufraeumen = vorbereitet.beenden
    ziel.value = vorbereitet.host
    extern.value = true
    beimVerlassen = () => { void andocken() }
    neu.addEventListener('pagehide', beimVerlassen)
    kontrolle = setInterval(() => { if (neu.closed) void andocken() }, 500)
    emit('ausgelagert', true)
    neu.focus()
    return true
  } catch {
    if (fenster !== neu) return false
    aufraeumen?.()
    neu.close()
    fenster = null
    ziel.value = null
    extern.value = false
    emit('fehler', 'Das Modulfenster konnte nicht geöffnet werden. Das Modul bleibt im Hauptfenster verfügbar.')
    return false
  }
}
function hauptfensterVerlassen() {
  clearInterval(kontrolle)
  aufraeumen?.()
  if (fenster && !fenster.closed) {
    fenster.removeEventListener('pagehide', beimVerlassen)
    fenster.close()
  }
}
function hauptfensterWarnung(event) {
  if (fenster && !fenster.closed) { event.preventDefault(); event.returnValue = '' }
}
window.addEventListener('beforeunload', hauptfensterWarnung)
window.addEventListener('pagehide', hauptfensterVerlassen)
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', hauptfensterWarnung)
  window.removeEventListener('pagehide', hauptfensterVerlassen)
  hauptfensterVerlassen()
})
defineExpose({ auslagern, andocken, fokussieren })
</script>

<template>
  <Teleport :to="ziel || 'body'" :disabled="!ziel">
    <section v-show="aktiv || extern" class="modul-fenster" :aria-label="titel">
      <header v-if="extern" class="modul-fenster-kopf">
        <strong>{{ titel }}</strong>
        <span>Mit Hauptfenster verbunden</span>
        <button type="button" @click="andocken">Zurück ins Hauptfenster</button>
      </header>
      <slot :extern="extern" />
    </section>
  </Teleport>
</template>

<style scoped>
.modul-fenster { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; overflow: hidden; background: #d7dce0; color: #111; }
.modul-fenster-kopf { display: flex; align-items: center; gap: 14px; flex-shrink: 0; min-height: 36px; padding: 5px 10px; border-bottom: 1px solid #89939c; background: linear-gradient(#edf1f3, #cbd5db); font: 12px Arial, sans-serif; }
.modul-fenster-kopf span { flex: 1; color: #52636e; }
.modul-fenster-kopf button { padding: 4px 8px; border: 1px solid #89939c; background: #f5f7f8; color: #111; cursor: pointer; }
</style>
