<script setup>
import { computed, ref, watch } from 'vue'
import { gebietsKreise, gebietLaden, gebietImportVorbereiten, gebietSpeichern } from '../data/gebiet.js'
import { osmStatus, osmStammdaten } from '../data/osmStammdaten.js'
const osm = osmStammdaten()
const editierbar = g => ({ ...g, ortschaften: g.ortschaften.map(o => ({ ...o })) })
const daten = ref(null), fehler = ref(''), meldung = ref(''), importDaten = ref(null), geaendert = ref(false)
try { daten.value = editierbar(gebietLaden()) } catch (e) { fehler.value = `Gebiet nicht geladen: ${e.message}` }
const suche = ref(''), kreis = ref(''), gemeinde = ref(''), aktiv = ref('alle'), seite = ref(1)
const gemeinden = computed(() => [...new Set((daten.value?.ortschaften ?? []).filter(o => !kreis.value || o.kreisId === kreis.value).map(o => o.gemeinde))].sort((a, b) => a.localeCompare(b, 'de')))
const liste = computed(() => (daten.value?.ortschaften ?? []).filter(o => (!kreis.value || kreis.value === o.kreisId) && (!gemeinde.value || gemeinde.value === o.gemeinde) &&
  (aktiv.value === 'alle' || o.aktiv === (aktiv.value === 'aktiv')) && `${o.gemeinde} ${o.ortsteil} ${o.postleitzahl}`.toLocaleLowerCase('de').includes(suche.value.toLocaleLowerCase('de').trim())))
const seiten = computed(() => Math.max(1, Math.ceil(liste.value.length / 50)))
const sichtbar = computed(() => liste.value.slice((seite.value - 1) * 50, seite.value * 50))
watch([suche, kreis, gemeinde, aktiv], () => { seite.value = 1 })
watch(kreis, () => { gemeinde.value = '' })
watch(seiten, n => { seite.value = Math.min(seite.value, n) })
function verlassenErlaubt() { return !geaendert.value || window.confirm('Ungespeicherte Gebietseinstellungen verwerfen?') }
defineExpose({ verlassenErlaubt })
async function dateiLesen(event) {
  const datei = event.target.files[0]
  if (!datei) return
  try {
    if (datei.size > 30000000) throw new Error('Die Importdatei darf höchstens 30 MB groß sein.')
    const parsed = JSON.parse(await datei.text())
    gebietImportVorbereiten(parsed, gebietLaden())
    importDaten.value = parsed
    fehler.value = ''
  } catch (e) { importDaten.value = null; fehler.value = e.message }
  event.target.value = ''
}
function importieren() {
  if (!verlassenErlaubt()) return
  try {
    daten.value = gebietSpeichern(gebietImportVorbereiten(importDaten.value, gebietLaden()))
    importDaten.value = null; geaendert.value = false; meldung.value = 'Gebiet importiert und gespeichert.'; fehler.value = ''
  } catch (e) { fehler.value = e.message }
}
function speichern() {
  try { daten.value = editierbar(gebietSpeichern(daten.value)); geaendert.value = false; meldung.value = 'Gebietseinstellungen gespeichert.'; fehler.value = '' }
  catch (e) { fehler.value = e.message }
}
</script>
<template>
  <section class="gebiet-admin">
    <h2>Gebiet · ILS Regensburg</h2>
    <p v-if="osm">Lokaler OSM-Import: {{ osm.manifest.statistik.gemeinden }} Gemeinden und {{ osm.manifest.statistik.gemeindefreieGebiete || 0 }} gemeindefreie Gebiete · {{ osm.manifest.statistik.orte }} Orts-/Verwaltungseinträge · {{ osm.manifest.statistik.strassen }} Straßen · {{ osm.manifest.statistik.adressen }} Adressen. Aktivierung und Faktoren werden getrennt gespeichert.</p>
    <p v-else role="status">{{ osmStatus.meldung }} Import auf diesem Rechner: <code>npm run import-osm</code>, anschließend Seite neu laden.</p>
    <p v-if="osm" class="hinweis">Ortsteilzuordnung ohne ausdrückliche OSM-Adressangabe: nächster erfasster Ort innerhalb der Gemeinde. Dies sind keine amtlichen Ortsteilgrenzen.</p>
    <p v-if="osm"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap-Mitwirkende · ODbL</a> · Quelle: {{ osm.manifest.quelle }}</p>
    <p>{{ gebietsKreise.map(k => k.name).join(' · ') }}</p>
    <p v-if="!osm" class="hinweis">Benötigt werden echte Gemeinde-/Ortsteildaten und zugeordnete Adressen. GeoJSON-Grenzen ermöglichen die Prüfung von Koordinaten. Ohne importierte Daten sind automatische Ortswahl und Adressvorschläge gesperrt.</p>
    <p v-if="fehler" role="alert">{{ fehler }}</p><p v-if="meldung" role="status">{{ meldung }}</p>
    <label v-if="!osm">Gebiet/Adressen importieren (JSON)<input type="file" accept=".json,application/json" @change="dateiLesen" /></label>
    <div v-if="importDaten" class="import"><p>{{ importDaten.ortschaften.length }} Ortschaften · {{ importDaten.adressen.length }} Adressen geprüft. Bestehende IDs werden aktualisiert; Aktivierung und Faktoren bleiben erhalten. Andere Einträge bleiben bestehen.</p><button @click="importieren">Import übernehmen</button><button @click="importDaten = null">Abbrechen</button></div>
    <template v-if="daten">
      <p>{{ daten.ortschaften.length }} Orts-/Verwaltungseinträge · {{ osm ? osm.gemeinden.length + ' Gemeinde-/Verwaltungsgrenzen' : daten.ortschaften.filter(o => o.geometry).length + ' Ortsgrenzen' }} · {{ daten.adressen.length }} Adressen</p>
      <div class="filter">
        <label>Suche<input v-model="suche" type="search" placeholder="Gemeinde, Ortsteil, PLZ" /></label>
        <label>Kreis<select v-model="kreis"><option value="">Alle Kreise</option><option v-for="k in gebietsKreise" :key="k.id" :value="k.id">{{ k.name }}</option></select></label>
        <label>Gemeinde<select v-model="gemeinde"><option value="">Alle Gemeinden</option><option v-for="g in gemeinden" :key="g">{{ g }}</option></select></label>
        <label>Status<select v-model="aktiv"><option value="alle">Alle</option><option value="aktiv">Aktiv</option><option value="inaktiv">Inaktiv</option></select></label>
      </div>
      <button :disabled="!geaendert" @click="speichern">Änderungen speichern</button>
      <div class="kopf zeile"><strong>Gebiet</strong><strong>Einsatzaufkommen</strong><strong>Aktiv</strong></div>
      <div v-for="o in sichtbar" :key="o.id" class="zeile">
        <span>Deutschland › Bayern › {{ gebietsKreise.find(k => k.id === o.kreisId).name }} › {{ o.gemeinde }} › {{ o.ortsteil }}<small v-if="o.postleitzahl"> · {{ o.postleitzahl }}</small></span>
        <input v-model.number="o.einsatzaufkommenFaktor" type="number" min="0" max="1000" step="0.1" :aria-label="`Einsatzaufkommen ${o.gemeinde} ${o.ortsteil}`" @input="geaendert = true" />
        <input v-model="o.aktiv" type="checkbox" :aria-label="`Aktiv ${o.gemeinde} ${o.ortsteil}`" @change="geaendert = true" />
      </div>
      <p v-if="!liste.length">Keine passenden Ortschaften. Der vollständige Ortsbestand ist noch zu importieren.</p>
      <div class="filter"><button :disabled="seite === 1" @click="seite--">Zurück</button><span>Seite {{ seite }} / {{ seiten }} · {{ liste.length }} Treffer</span><button :disabled="seite === seiten" @click="seite++">Weiter</button></div>
      <p>Faktor 0 verhindert automatische Einsätze, lässt Adresssuchen aber zu. Deaktivierte Ortschaften werden auch aus der Suche ausgeschlossen. Neue Einstellungen gelten nach dem Speichern.</p>
    </template>
  </section>
</template>
<style scoped>
.gebiet-admin { padding: 20px 24px; display: grid; gap: 12px; min-width: 0; }
h2, p { margin: 0; } h2 { font-size: 17px; }
.hinweis, small { color: #52636e; } [role=alert] { color: #a32323; }
button, input, select { box-sizing: border-box; min-width: 0; max-width: 100%; padding: 7px; border: 1px solid #98a4ad; font: inherit; background: white; }
button { cursor: pointer; background: linear-gradient(#fff, #dce2e6); } button:disabled { opacity: .5; }
label { display: grid; gap: 5px; min-width: 0; }
.filter { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; } .filter label { flex: 1 1 170px; }
.zeile { display: grid; grid-template-columns: minmax(0,1fr) 140px 60px; align-items: center; gap: 10px; padding: 7px; background: white; overflow-wrap: anywhere; }
.kopf { background: #dce3e8; }.import { padding: 12px; border: 1px solid #a9b5be; background: #fff0d4; }
@media(max-width: 600px) { .zeile { grid-template-columns: minmax(0,1fr) 85px 40px; font-size: 11px; } .gebiet-admin { padding: 12px; } }
</style>
