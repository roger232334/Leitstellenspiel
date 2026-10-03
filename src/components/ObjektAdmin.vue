<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { objektTypen, objektTypName } from '../data/objektTypen.js'
import { neuesObjekt, objektPruefen, objektDatenLaden, objektDatenSpeichern } from '../data/objektVerwaltung.js'
import { orteSuchen } from '../services/ortssuche.js'
import ObjektPosition from './ObjektPosition.vue'
import { gebietsPruefung } from '../data/gebiet.js'
import { objektImportStatus } from '../data/objektImport.js'
const quellName = quelle => ({ excel: 'Excel', osm: 'OSM', manuell: 'Manuell' })[quelle] || 'Manuell'
const daten = ref(null), fehler = ref(''), meldung = ref(''), entwurf = ref(null)
const suche = ref(''), typ = ref(''), aktiv = ref('alle'), seite = ref(1)
const lat = ref(''), lng = ref(''), treffer = ref([]), sucht = ref(false)
let suchVersion = 0
try { daten.value = objektDatenLaden() } catch (e) { fehler.value = `Objekte konnten nicht geladen werden: ${e.message}. Der gespeicherte Bestand bleibt unverändert.` }
const liste = computed(() => (daten.value?.objekte ?? []).filter(o =>
  [o.name, o.alias].join(' ').toLocaleLowerCase('de').includes(suche.value.trim().toLocaleLowerCase('de')) && (!typ.value || o.typId === typ.value) && (aktiv.value === 'alle' || o.aktiv === (aktiv.value === 'aktiv'))))
const seiten = computed(() => Math.max(1, Math.ceil(liste.value.length / 50)))
const sichtbar = computed(() => liste.value.slice((seite.value - 1) * 50, seite.value * 50))
watch([suche, typ, aktiv], () => { seite.value = 1 })
watch(seiten, n => { seite.value = Math.min(seite.value, n) })
const felder = [ ['strasse', 'Straße'], ['hausnummer', 'Hausnummer'], ['hausnummerZusatz', 'Hausnummernzusatz'], ['adressKennzeichen', 'Adress-/Objektkennzeichen'], ['ort', 'Ort / Ortsteil'], ['gemeinde', 'Gemeinde'], ['postleitzahl', 'Postleitzahl'] ]
const position = computed(() => {
  if (lat.value === '' || lng.value === '') return null
  const p = { lat: Number(String(lat.value).replace(',', '.')), lng: Number(String(lng.value).replace(',', '.')) }
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 ? p : null
})
function abbrechenErlaubt() { return !entwurf.value || window.confirm('Ungespeicherte Objekteingaben verwerfen?') }
const gebietsHinweis = computed(() => {
  if (!entwurf.value) return ''
  try { const p = gebietsPruefung({ adresse: entwurf.value.adresse, position: position.value }); return p.erlaubt ? '' : `${p.grund} Dieses Objekt wird nicht für automatische Einsätze verwendet.` }
  catch { return 'Gebietsdaten nicht lesbar. Keine automatische Verwendung dieses Objekts.' }
})
function abbrechen() {
  if (!abbrechenErlaubt()) return
  entwurf.value = null; suchVersion++; sucht.value = false; treffer.value = []
}
defineExpose({ verlassenErlaubt: abbrechenErlaubt })
function bearbeiten(o = null) {
  if (!abbrechenErlaubt()) return
  suchVersion++; sucht.value = false; treffer.value = []
  entwurf.value = o ? JSON.parse(JSON.stringify(o)) : neuesObjekt()
  lat.value = entwurf.value.position?.lat ?? ''; lng.value = entwurf.value.position?.lng ?? ''
  fehler.value = ''; meldung.value = ''
}
function positionSetzen(p) {
  lat.value = p?.lat ?? ''; lng.value = p?.lng ?? ''
  suchVersion++; sucht.value = false; treffer.value = []
}
function sichern(objekte, text) {
  try { daten.value = objektDatenSpeichern({ version: 1, objekte }); meldung.value = text; fehler.value = ''; return true }
  catch (e) { fehler.value = `Nicht gespeichert: ${e.message}`; return false }
}
function speichern() {
  if (!daten.value) return
  try {
    if ((lat.value !== '' || lng.value !== '') && !position.value) throw new Error('Bitte beide gültigen WGS84-Koordinaten eingeben oder beide Felder leeren.')
    const objekt = objektPruefen({ ...entwurf.value, position: position.value })
    const bestand = daten.value.objekte
    const neu = !bestand.some(o => o.id === objekt.id)
    if (sichern(neu ? [...bestand, objekt] : bestand.map(o => o.id === objekt.id ? objekt : o), 'Objekt gespeichert.')) {
      entwurf.value = null; suchVersion++; sucht.value = false; treffer.value = []
    }
  } catch (e) { fehler.value = e.message }
}
function loeschen(o) {
  if (!abbrechenErlaubt() || !window.confirm(`Objekt „${o.name}“ endgültig löschen? Für spätere Referenzen empfiehlt sich stattdessen Deaktivieren.`)) return
  if (sichern(daten.value.objekte.filter(e => e.id !== o.id), 'Objekt gelöscht.')) { entwurf.value = null; suchVersion++; sucht.value = false; treffer.value = [] }
}
function umschalten(o) {
  if (!abbrechenErlaubt()) return
  if (sichern(daten.value.objekte.map(e => e.id === o.id ? { ...e, aktiv: !e.aktiv } : e), o.aktiv ? 'Objekt deaktiviert.' : 'Objekt aktiviert.')) { entwurf.value = null; suchVersion++; sucht.value = false; treffer.value = [] }
}
async function suchen() {
  const a = entwurf.value.adresse
  const query = [[a.strasse, a.hausnummer].filter(Boolean).join(' '), a.postleitzahl, a.ort, a.gemeinde].filter(Boolean).join(', ')
  if (!query.trim()) { fehler.value = 'Bitte zunächst eine Adresse eingeben.'; return }
  const version = ++suchVersion
  sucht.value = true; treffer.value = []; fehler.value = ''
  try {
    const result = await orteSuchen(query)
    if (version !== suchVersion) return
    treffer.value = result
    if (!result.length) fehler.value = 'Keine Treffer. Die Position kann manuell gesetzt werden.'
  } catch (e) { if (version === suchVersion) fehler.value = e.message }
  finally { if (version === suchVersion) sucht.value = false }
}
function adresseGeaendert() { suchVersion++; sucht.value = false; treffer.value = [] }
onBeforeUnmount(() => { suchVersion++ })
</script>
<template>
  <section class="objekt-admin">
    <div class="werkzeugleiste"><h2>Objekte / POI · {{ daten?.objekte.length ?? 0 }}</h2><button :disabled="!daten" @click="bearbeiten()">+ Objekt anlegen</button></div>
    <p v-if="objektImportStatus.meldung" :class="{ fehler: objektImportStatus.zustand === 'fehler' }" role="status">{{ objektImportStatus.meldung }}</p>
    <p class="hinweis">Die Objekte werden in diesem Browser gespeichert. Adressen sind optional; Positionen können unabhängig davon gesetzt werden.</p>
    <p v-if="fehler" role="alert" class="fehler">{{ fehler }}</p><p v-if="meldung" role="status">{{ meldung }}</p>
    <form v-if="entwurf" @submit.prevent="speichern">
      <h3>{{ daten.objekte.some(o => o.id === entwurf.id) ? 'Objekt bearbeiten' : 'Objekt anlegen' }}</h3>
      <div class="formular-raster">
        <label>Objektname *<textarea v-model="entwurf.name" required rows="2" /></label>
        <label>Alias (optional)<input v-model="entwurf.alias" maxlength="250" placeholder="z. B. NOT R" /><small>Zusätzlicher Suchname. Mehrere Objekte dürfen denselben Alias haben; der Originalname bleibt erhalten.</small></label>
        <label>Objekttyp *<select v-model="entwurf.typId" required><option v-for="t in objektTypen" :key="t.id" :value="t.id">{{ t.name }}</option></select></label>
        <label v-for="[id, name] in felder" :key="id">{{ name }}<input v-model="entwurf.adresse[id]" maxlength="250" @input="adresseGeaendert" /></label>
      </div>
      <small>Das Kennzeichen wird separat gespeichert, z. B. SEE, FORST, KM oder RTP.</small>
      <div><button type="button" :disabled="sucht" @click="suchen">{{ sucht ? 'Suche läuft …' : 'Adresse suchen' }}</button></div>
      <ul v-if="treffer.length" class="treffer"><li v-for="t in treffer" :key="t.id"><button type="button" @click="positionSetzen({ lat: t.lat, lng: t.lng })">{{ t.displayName }} – Position übernehmen</button></li></ul>
      <div class="formular-raster">
        <label>Breitengrad (WGS84)<input v-model="lat" inputmode="decimal" placeholder="49.0134" @input="adresseGeaendert" /></label>
        <label>Längengrad (WGS84)<input v-model="lng" inputmode="decimal" placeholder="12.1016" @input="adresseGeaendert" /></label>
      </div>
      <ObjektPosition :position="position" @update:position="positionSetzen" />
      <p v-if="gebietsHinweis" role="status" class="fehler">{{ gebietsHinweis }}</p>
      <div><button type="button" @click="positionSetzen(null)">Position leeren</button></div>
      <label class="checkbox"><input v-model="entwurf.aktiv" type="checkbox" />Aktiv</label>
      <label>Bemerkung<textarea v-model="entwurf.bemerkung" maxlength="4000" rows="3" /></label>
      <div class="werkzeugleiste"><button type="submit">Objekt speichern</button><button type="button" @click="abbrechen">Abbrechen</button></div>
    </form>
    <div class="werkzeugleiste filter">
      <label>Name / Alias suchen<input v-model="suche" type="search" placeholder="Objektname oder Alias" /></label>
      <label>Typ<select v-model="typ"><option value="">Alle Typen</option><option v-for="t in objektTypen" :key="t.id" :value="t.id">{{ t.name }}</option></select></label>
      <label>Status<select v-model="aktiv"><option value="alle">Alle</option><option value="aktiv">Aktiv</option><option value="inaktiv">Inaktiv</option></select></label>
    </div>
    <div class="objekt-liste">
      <article v-for="o in sichtbar" :key="o.id">
        <div>
          <strong>{{ o.name }}</strong><small>{{ objektTypName(o.typId) }} · {{ quellName(o.quelle) }} · {{ o.aktiv ? 'Aktiv' : 'Inaktiv' }}</small>
          <small v-if="o.alias">Alias: {{ o.alias }}</small>
          <span>{{ [o.adresse.strasse, o.adresse.hausnummer, o.adresse.hausnummerZusatz, o.adresse.adressKennzeichen, o.adresse.ort].filter(Boolean).join(' ') || 'Keine Adresse' }}</span>
          <span v-for="(a, index) in o.weitereAdressen || []" :key="index">Weitere Adresse: {{ [a.strasse, a.hausnummer, a.hausnummerZusatz, a.adressKennzeichen, a.postleitzahl, a.ort].filter(Boolean).join(' ') }}</span>
          <small>{{ o.position ? `${o.position.lat}, ${o.position.lng}` : 'Keine Position hinterlegt' }}</small>
          <details v-if="o.abteilungen?.length"><summary>{{ o.abteilungen.length }} Abteilungen</summary>
            <div v-for="(a, index) in o.abteilungen" :key="index" class="abteilung">
              <strong>{{ a.name || 'Abteilung ohne Namen' }}</strong>
              <span>{{ [a.adresse.strasse, a.adresse.hausnummer, a.adresse.hausnummerZusatz, a.adresse.adressKennzeichen, a.adresse.ort].filter(Boolean).join(' ') || 'Keine eigene Adresse' }}</span>
              <small v-if="a.position">{{ a.position.lat }}, {{ a.position.lng }}</small>
            </div>
          </details>
        </div>
        <div class="aktionen"><button @click="bearbeiten(o)">Bearbeiten</button><button @click="umschalten(o)">{{ o.aktiv ? 'Deaktivieren' : 'Aktivieren' }}</button><button @click="loeschen(o)">Löschen</button></div>
      </article>
      <p v-if="daten && !liste.length">Keine passenden Objekte.</p>
    </div>
    <div class="werkzeugleiste"><button :disabled="seite <= 1" @click="seite--">Zurück</button><span>Seite {{ seite }} / {{ seiten }} · {{ liste.length }} Treffer · 50 pro Seite</span><button :disabled="seite >= seiten" @click="seite++">Weiter</button></div>
  </section>
</template>
<style scoped>
.objekt-admin { padding: 20px 24px; display: grid; gap: 14px; min-width: 0; }
* { box-sizing: border-box; }
h2 { font-size: 17px; margin: 0; flex: 1; } h3, p { margin: 0; }
.werkzeugleiste, .aktionen { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
button, input, select, textarea { min-width: 0; max-width: 100%; padding: 8px 10px; font: inherit; color: inherit; border: 1px solid #98a4ad; border-radius: 3px; background: white; }
button { cursor: pointer; background: linear-gradient(#fff, #dce2e6); } button:disabled { opacity: .5; cursor: default; }
label { display: grid; gap: 6px; min-width: 0; }
form { display: grid; gap: 14px; min-width: 0; padding: 20px; border: 1px solid #b4bec5; background: white; border-radius: 5px; }
.formular-raster { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
form input:not([type=checkbox]), select, textarea { width: 100%; }
.checkbox { display: flex; align-items: center; }
small, .hinweis { color: #52636e; } .fehler { color: #a32323; }
.filter label { flex: 1 1 180px; }
.objekt-liste article { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px; border-bottom: 1px solid #ced6dc; background: white; overflow-wrap: anywhere; }
.objekt-liste article:nth-child(even) { background: #f4f6f7; }
.objekt-liste article > div:first-child { display: grid; gap: 3px; min-width: 0; }
.objekt-liste strong { white-space: pre-wrap; }
.abteilung { display: grid; gap: 3px; margin: 6px 0 6px 12px; } summary { cursor: pointer; }
.aktionen button { padding: 3px 6px; }
.treffer { padding-left: 20px; } .treffer button { text-align: left; white-space: normal; }
@media(max-width: 650px) { .objekt-admin { padding: 14px; } .formular-raster { grid-template-columns: minmax(0, 1fr); } .objekt-liste article { flex-direction: column; align-items: stretch; } }
</style>
