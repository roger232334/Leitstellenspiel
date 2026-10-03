<script setup>
import { computed, ref } from 'vue'
defineOptions({ name: 'StartMenue' })
import { gebietLaden } from '../data/gebiet.js'
import { osmStatus } from '../data/osmStammdaten.js'
import { einsatzFrequenzen, schichtStartzeit } from '../data/schicht.js'
import AdminBereich from './AdminBereich.vue'
import { fahrzeugDatenLaden, fahrzeugeFuerSchicht } from '../data/fahrzeugVerwaltung.js'
const emit = defineEmits(['starten'])
const jetzt = new Date()
const datum = ref(`${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}-${String(jetzt.getDate()).padStart(2, '0')}`)
const zeit = ref(`${String(jetzt.getHours()).padStart(2, '0')}:${String(jetzt.getMinutes()).padStart(2, '0')}`)
const frequenz = ref(100)
const admin = ref(false)
const gebietsHinweis = computed(() => {
  if (admin.value) return ''
  try {
    const g = gebietLaden()
    const mitAdresse = new Set([...g.adressen.filter(a => a.strasse), ...(g.strassen || [])].map(a => a.gebietId))
    const moeglich = g.ortschaften.some(o => o.aktiv && o.einsatzaufkommenFaktor > 0 && mitAdresse.has(o.id))
    return moeglich ? '' : 'Automatische Notrufe warten auf aktive Ortschaften und importierte Adressen. Bitte Adminbereich → Gebiet einrichten. Manuelle Einsätze und Testeinsätze bleiben möglich.'
  } catch { return 'Gebietsdaten nicht lesbar. Automatische Ortsauswahl ist gesperrt.' }
})
const fehler = ref('')
const daten = ref(null)
try { daten.value = fahrzeugDatenLaden() }
catch { fehler.value = 'Die gespeicherten Fahrzeugdaten konnten nicht geladen werden. Bitte den Browserspeicher prüfen; die Daten wurden nicht überschrieben.' }
function starten() {
  const start = schichtStartzeit(datum.value, zeit.value)
  if (!Number.isFinite(start)) { fehler.value = 'Bitte ein gültiges Datum und eine gültige Startzeit wählen.'; return }
  if (!daten.value) return
  try { emit('starten', { start, frequenz: frequenz.value, fahrzeugDaten: fahrzeugeFuerSchicht(daten.value, start) }) }
  catch (e) { fehler.value = `Schicht konnte nicht gestartet werden: ${e.message}` }
}
</script>

<template>
  <AdminBereich v-if="admin && daten" :daten="daten" @gespeichert="daten = $event" @zurueck="admin = false" />
  <main v-else class="start-menue">
    <section class="menue-karte">
      <header><span>LEITSTELLENSIMULATOR</span><h1>Schicht starten</h1></header>
      <form @submit.prevent="starten">
        <label for="schicht-datum">Schichtdatum</label><input id="schicht-datum" v-model="datum" type="date" required />
        <label for="schicht-zeit">Startzeit</label><input id="schicht-zeit" v-model="zeit" type="time" required />
        <label for="schicht-frequenz">Einsatzfrequenz</label>
        <select id="schicht-frequenz" v-model="frequenz"><option v-for="wert in einsatzFrequenzen" :key="wert" :value="wert">{{ wert }} %</option></select>
        <p>100 % entspricht der bisherigen Häufigkeit. Eine niedrigere Frequenz verlängert die Pausen zwischen den Notrufen.</p>
        <p v-if="fehler" role="alert">{{ fehler }}</p>
        <p v-if="osmStatus.zustand === 'fehler'" role="alert">{{ osmStatus.meldung }}</p>
        <p v-if="gebietsHinweis" role="status">{{ gebietsHinweis }}</p>
        <button class="start-button" type="submit" :disabled="!daten">Simulation starten</button>
        <button type="button" :disabled="!daten" @click="admin = true">Adminbereich</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.start-menue { position: fixed; inset: 0; display: grid; place-items: center; padding: 24px; overflow: auto; background: #dce1e4; color: #18232b; font: 14px Arial, sans-serif; }
.menue-karte { width: min(100%, 460px); border: 1px solid #929da5; background: #f5f7f8; box-shadow: 0 12px 36px #27374220; }
header { padding: 24px; border-bottom: 1px solid #aeb9c1; background: linear-gradient(#f4f6f8, #cbd5db); }
header span { font-size: 11px; letter-spacing: 2px; color: #53636f; }
h1 { margin: 10px 0 0; font-size: 25px; }
form, .admin-inhalt { display: grid; gap: 12px; padding: 24px; }
label { font-weight: bold; }
input, select, button { box-sizing: border-box; min-width: 0; width: 100%; padding: 10px; font: inherit; border: 1px solid #929da5; color: inherit; background: white; }
button { cursor: pointer; background: linear-gradient(#fff, #dce1e4); }
.start-button { background: #d1e3d4; font-weight: bold; }
p { margin: 4px 0 10px; color: #52616c; line-height: 1.5; }
</style>
