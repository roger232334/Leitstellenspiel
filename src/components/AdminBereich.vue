<script setup>
import { computed, ref } from 'vue'
import { fahrzeugPruefen, fahrzeugDatenSpeichern, fahrzeugMitObjektWache } from '../data/fahrzeugVerwaltung.js'
import { objektDatenLaden } from '../data/objektVerwaltung.js'
import { objektTypName } from '../data/objektTypen.js'
import SuchVorschlaege from './SuchVorschlaege.vue'
import { fahrzeugArten, fahrzeugArtZu } from '../data/fahrzeugArten.js'
import { fachdienste, fachdienstName } from '../data/fachdienste.js'
import FahrzeugTableau from './FahrzeugTableau.vue'
import BeladungsEditor from './BeladungsEditor.vue'
import ObjektAdmin from './ObjektAdmin.vue'
import GebietAdmin from './GebietAdmin.vue'
import { beladungNormalisieren } from '../data/ausruestung/beladung.js'
import { standardbeladungFuer } from '../data/ausruestung/fahrzeugStandardbeladungen.js'
const props = defineProps({ daten: { type: Object, required: true } })
const emit = defineEmits(['zurueck', 'gespeichert'])
const menue = ref('Fahrzeuge'), suche = ref(''), entwurf = ref(null), meldung = ref(''), fehler = ref(''), loeschId = ref(null), tableau = ref(false)
const punkte = ['Fahrzeuge', 'Alarm- und Ausrückeordnung', 'Objekte / POI', 'Gebiet', 'Allgemeine Einstellungen']
const objektAdmin = ref(null)
const gebietAdmin = ref(null)
const typenSuche = ref('')
const wachenSuche = ref(''), wachenObjekte = ref([]), wachenFehler = ref('')
const gewaehlteWache = computed(() => wachenObjekte.value.find(o => o.id === entwurf.value?.wacheId))
function wachenLaden() {
  try { wachenObjekte.value = objektDatenLaden().objekte; wachenFehler.value = '' }
  catch (e) { wachenObjekte.value = []; wachenFehler.value = `Objektliste nicht lesbar: ${e.message}` }
}
function wachenVorschlaege(text) {
  wachenLaden()
  if (wachenFehler.value) throw new Error(wachenFehler.value)
  const teile = text.toLocaleLowerCase('de').trim().split(/\s+/)
  return wachenObjekte.value.filter(o => o.aktiv && teile.every(t =>
    [o.name, objektTypName(o.typId), ...Object.values(o.adresse)].join(' ').toLocaleLowerCase('de').includes(t)))
    .map(o => ({ id: o.id, label: o.name,
      detail: [objektTypName(o.typId), o.adresse.strasse, o.adresse.hausnummer, o.adresse.ort, o.position ? '' : 'Keine Koordinaten'].filter(Boolean).join(' · ') }))
}
function wacheWaehlen(treffer) {
  entwurf.value = fahrzeugMitObjektWache({ ...entwurf.value, wacheId: treffer.id }, wachenObjekte.value, true)
  wachenSuche.value = ''
}
function wacheEntfernen() {
  Object.assign(entwurf.value, { wacheId: null, wacheName: '', position: null })
  wachenSuche.value = ''
}
let bisherigeStandardbeladung = ''
function standardWiederherstellen() {
  if (!window.confirm('Die individuelle Beladung durch die Standardvorlage dieses Typs ersetzen?')) return
  entwurf.value.beladung = standardbeladungFuer(entwurf.value)
  bisherigeStandardbeladung = JSON.stringify(entwurf.value.beladung)
}
const typenGruppen = computed(() => [...new Set(fahrzeugArten.map(a => a.gruppe))].map(name => ({ name,
  arten: fahrzeugArten.filter(a => a.gruppe === name && (a.id === entwurf.value?.fahrzeugArtId ||
    `${a.kennzahl} ${a.kurz} ${a.name}`.toLocaleLowerCase('de').includes(typenSuche.value.toLocaleLowerCase('de')))),
})).filter(g => g.arten.length))
function typWaehlen() {
  const individuell = JSON.stringify(entwurf.value.beladung) !== bisherigeStandardbeladung
  const art = fahrzeugArtZu(entwurf.value.fahrzeugArtId)
  if (art) entwurf.value.typ = art.kurz.toUpperCase()
  else entwurf.value.typ = props.daten.fahrzeuge.find(f => f.id === entwurf.value.id)?.typ || ''
  const standard = standardbeladungFuer(entwurf.value)
  if (!individuell || window.confirm('Standardbeladung des neuen Typs übernehmen? OK ersetzt die bisherige Beladung. Abbrechen behält sie für den neuen Typ bei.')) entwurf.value.beladung = standard
  bisherigeStandardbeladung = JSON.stringify(standard)
}
const liste = computed(() => props.daten.fahrzeuge.filter(f => `${f.funkrufnameLang} ${f.funkrufnameKurz} ${f.typ} ${f.bereich} ${fachdienstName(f.bereich)}`.toLocaleLowerCase('de').includes(suche.value.toLocaleLowerCase('de'))))
const tableauFahrzeuge = computed(() => props.daten.fahrzeuge.map(f => ({ ...f, status: f.startStatus })))
function bearbeiten(f = null) {
  if (entwurf.value && !window.confirm('Ungespeicherte Eingaben verwerfen?')) return
  entwurf.value = f ? { ...f, fahrzeugArtId: f.fahrzeugArtId || '' } : { id: null, funkrufnameLang: '', funkrufnameKurz: '', typ: 'RTW', fahrzeugArtId: '71-RTW', bereich: 'RD', startStatus: 2, position: null }
  typenSuche.value = ''
  wachenSuche.value = ''; wachenLaden()
  entwurf.value.beladung = beladungNormalisieren(entwurf.value)
  bisherigeStandardbeladung = JSON.stringify(standardbeladungFuer(entwurf.value))
  if (!f) Object.assign(entwurf.value, { funkgruppe: '', wacheName: '', wacheId: null, hatNotarzt: false, hatGps: true, istFirstResponder: false, istEhrenamtlich: false })
  meldung.value = ''; fehler.value = ''; loeschId.value = null
}
function verlassen(aktion) {
  if (menue.value === 'Gebiet' && gebietAdmin.value && !gebietAdmin.value.verlassenErlaubt()) return
  if (menue.value === 'Objekte / POI' && objektAdmin.value && !objektAdmin.value.verlassenErlaubt()) return
  if (entwurf.value && !window.confirm('Ungespeicherte Eingaben verwerfen?')) return
  entwurf.value = null; loeschId.value = null; fehler.value = ''; aktion()
}
function sichern(daten, text) {
  try { const gespeichert = fahrzeugDatenSpeichern(daten); emit('gespeichert', gespeichert); meldung.value = text; fehler.value = ''; return true }
  catch (error) { fehler.value = `Nicht gespeichert: ${error.message}`; return false }
}
function speichern() {
  try {
    const e = entwurf.value
    if (e.id === null && !fahrzeugArtZu(e.fahrzeugArtId)) throw new Error('Bitte einen Fahrzeugtyp aus der Richtlinie auswählen.')
    const neu = e.id === null
    const mitWache = e.wacheId == null ? e : fahrzeugMitObjektWache(e, objektDatenLaden().objekte, true)
    const f = fahrzeugPruefen({ ...mitWache, id: neu ? props.daten.naechsteId : e.id }, props.daten.fahrzeuge)
    const fahrzeuge = neu ? [...props.daten.fahrzeuge, f] : props.daten.fahrzeuge.map(alt => alt.id === f.id ? f : alt)
    if (sichern({ ...props.daten, naechsteId: props.daten.naechsteId + Number(neu), fahrzeuge }, 'Fahrzeug gespeichert. Die nächste Schicht verwendet diese Daten.')) entwurf.value = null
  } catch (error) { fehler.value = error.message }
}
function loeschen() {
  if (sichern({ ...props.daten, fahrzeuge: props.daten.fahrzeuge.filter(f => f.id !== loeschId.value) }, 'Fahrzeug gelöscht.')) loeschId.value = null
}
</script>

<template>
  <main class="admin">
    <header><div><small>LEITSTELLENSIMULATOR</small><h1>Adminbereich</h1></div><button @click="verlassen(() => emit('zurueck'))">Zurück zum Menü</button></header>
    <nav aria-label="Adminmenü"><button v-for="punkt in punkte" :key="punkt" :class="{ aktiv: menue === punkt }" @click="verlassen(() => menue = punkt)">{{ punkt }}</button></nav>
    <section v-if="menue === 'Fahrzeuge'" class="fahrzeug-admin">
      <div class="werkzeugleiste"><h2>Fahrzeuge · {{ daten.fahrzeuge.length }}</h2><button @click="verlassen(() => tableau = !tableau)">{{ tableau ? 'Fahrzeugstammdaten' : 'Wachen und Tableau anordnen' }}</button></div>
      <p class="hinweis">Die Daten werden in diesem Browser gespeichert und beim nächsten Schichtstart übernommen.</p>
      <FahrzeugTableau v-if="tableau" :fahrzeuge="tableauFahrzeuge" verwaltung-erlaubt />
      <template v-else>
        <p v-if="meldung" role="status">{{ meldung }}</p><p v-if="fehler" role="alert" class="fehler">{{ fehler }}</p>
        <div class="werkzeugleiste"><input v-model="suche" aria-label="Fahrzeuge suchen" placeholder="Funkrufname, Typ oder Fachdienst suchen" /><button @click="bearbeiten()">+ Fahrzeug anlegen</button></div>
        <div v-if="loeschId !== null" class="loeschen" role="alert">Fahrzeug „{{ daten.fahrzeuge.find(f => f.id === loeschId)?.funkrufname }}“ endgültig löschen? <button @click="loeschen">Löschen bestätigen</button><button @click="loeschId = null">Abbrechen</button></div>
        <div class="verwaltung">
          <div class="tabelle"><table><thead><tr><th>Funkrufname</th><th>Typ</th><th>Fachdienst</th><th>Startstatus</th><th>Aktionen</th></tr></thead><tbody>
            <tr v-for="f in liste" :key="f.id"><td data-label="Funkrufname" :title="f.funkrufname">{{ f.funkrufname }}</td><td data-label="Typ" :title="f.typ">{{ f.typ }}</td><td data-label="Fachdienst" :title="fachdienstName(f.bereich)">{{ fachdienstName(f.bereich) }}</td><td data-label="Startstatus">{{ f.startStatus }}</td><td data-label="Aktionen"><div class="zeilen-aktionen"><button @click="bearbeiten(f)">Bearbeiten</button><button @click="verlassen(() => loeschId = f.id)">Löschen</button></div></td></tr>
            <tr v-if="!liste.length"><td colspan="5">Keine Fahrzeuge vorhanden oder passend zur Suche.</td></tr>
          </tbody></table></div>
          <form v-if="entwurf" @submit.prevent="speichern">
            <h3>{{ entwurf.id === null ? 'Fahrzeug anlegen' : 'Fahrzeug bearbeiten' }}</h3>
            <label>Langer Funkrufname<input v-model="entwurf.funkrufnameLang" placeholder="Rotkreuz Regensburg 71/1" required maxlength="100" /></label>
            <label>Kurzer Funkrufname (optional)<input v-model="entwurf.funkrufnameKurz" placeholder="RK R 71/1" maxlength="100" /></label>
            <label>Fahrzeugtyp suchen<input v-model="typenSuche" placeholder="Kennzahl, Kürzel oder Bezeichnung" /></label>
            <label>Fahrzeugtyp nach Richtlinie<select v-model="entwurf.fahrzeugArtId" :required="entwurf.id === null" @change="typWaehlen">
              <option v-if="entwurf.id !== null && !daten.fahrzeuge.find(f => f.id === entwurf.id)?.fahrzeugArtId" value="">Bisheriger Typ: {{ daten.fahrzeuge.find(f => f.id === entwurf.id)?.typ }}</option>
              <optgroup v-for="gruppe in typenGruppen" :key="gruppe.name" :label="gruppe.name"><option v-for="art in gruppe.arten" :key="art.id" :value="art.id">{{ art.kennzahl ? art.kennzahl + ' · ' : '' }}{{ art.kurz }} — {{ art.name }}</option></optgroup>
            </select></label>
            <p v-if="fahrzeugArtZu(entwurf.fahrzeugArtId)" class="typ-details"><strong>{{ fahrzeugArtZu(entwurf.fahrzeugArtId).kurz }}<template v-if="fahrzeugArtZu(entwurf.fahrzeugArtId).kennzahl"> · Kennzahl {{ fahrzeugArtZu(entwurf.fahrzeugArtId).kennzahl }}</template></strong><span>{{ fahrzeugArtZu(entwurf.fahrzeugArtId).name }}</span></p>
            <small v-if="fahrzeugArtZu(entwurf.fahrzeugArtId)?.gruppe === 'Hubschrauber'">Zusätzlicher Simulationstyp außerhalb der hochgeladenen Funkrufnamenrichtlinie. Spezielle Flug- und Transportabläufe folgen später.</small>
            <small v-else>Quelle: hochgeladene bayerische Funkrufnamenrichtlinie, Stand 30.01.2015. Kennzahlen sind Teilkennzahlen, keine automatisch erzeugten Funkrufnamen.</small>
            <label>Fachdienst<select v-model="entwurf.bereich"><option v-for="dienst in fachdienste" :key="dienst.id" :value="dienst.id">{{ dienst.name }}</option></select></label>
            <label>Funkgruppe<input v-model="entwurf.funkgruppe" maxlength="100" placeholder="z. B. RD Regensburg" /></label>
            <div class="wachen-auswahl">
              <label for="fahrzeug-wache">Stationierte Wache aus Objektliste suchen</label>
              <SuchVorschlaege id="fahrzeug-wache" v-model="wachenSuche" :laden="wachenVorschlaege" :minimum="0" :verzoegerung="0" :seitengroesse="50" @auswahl="wacheWaehlen" />
              <small>{{ wachenObjekte.length }} Objekte geladen · {{ wachenObjekte.filter(o => o.aktiv).length }} aktive Objekte auswählbar. Name, Ort oder Objekttyp eingeben; weitere Treffer über „Mehr anzeigen“.</small>
              <p v-if="wachenFehler" class="fehler" role="alert">{{ wachenFehler }}</p>
              <template v-if="entwurf.wacheId != null">
                <strong class="wachen-name">{{ gewaehlteWache?.name || entwurf.wacheName }}</strong>
                <small v-if="!gewaehlteWache || !gewaehlteWache.aktiv" class="fehler">Das verknüpfte Objekt fehlt oder ist deaktiviert. Bitte die Zuordnung ändern.</small>
                <small v-else-if="gewaehlteWache.position">Startstandort: {{ gewaehlteWache.position.lat }}, {{ gewaehlteWache.position.lng }}</small>
                <small v-else>Diese Wache hat noch keine Koordinaten. Das Fahrzeug startet ohne Kartenposition.</small>
                <button type="button" @click="wacheEntfernen">Zuordnung entfernen</button>
              </template>
              <template v-else-if="entwurf.wacheName">
                <small>Bisheriger Freitext: {{ entwurf.wacheName }}. Noch nicht mit einem Objekt verknüpft.</small>
                <button type="button" @click="wacheEntfernen">Freitext entfernen</button>
              </template>
              <small v-else>Keine Wache zugeordnet.</small>
            </div>
            <small>Der Startstandort wird beim Schichtstart aus der zugeordneten Wache übernommen.</small>
            <fieldset class="merkmale"><legend>Ausstattung und Einsatzmerkmale</legend>
              <label><input v-model="entwurf.hatNotarzt" type="checkbox" />Notarzt an Bord</label>
              <label><input v-model="entwurf.hatGps" type="checkbox" />Mit GPS ausgestattet</label>
              <label><input v-model="entwurf.istFirstResponder" type="checkbox" />First Responder</label>
              <label><input v-model="entwurf.istEhrenamtlich" type="checkbox" />Ehrenamtlich</label>
            </fieldset>
            <small>Ohne GPS bleibt das Fahrzeug auf der Karte verborgen. First Responder und Ehrenamt sind für die spätere Erstversorgungs- und Ausrücklogik hinterlegt.</small>
            <label>Status bei Schichtbeginn<select v-model="entwurf.startStatus"><option :value="1">1 – Einsatzbereit über Funk</option><option :value="2">2 – Einsatzbereit auf Wache</option><option :value="6">6 – Nicht einsatzbereit</option></select></label>
            <BeladungsEditor v-model="entwurf.beladung" @standard="standardWiederherstellen" />
            <div class="formular-aktionen"><button type="submit">Fahrzeug speichern</button><button type="button" @click="verlassen(() => {})">Abbrechen</button></div>
          </form>
        </div>
      </template>
    </section>
    <ObjektAdmin v-else-if="menue === 'Objekte / POI'" ref="objektAdmin" />
    <GebietAdmin v-else-if="menue === 'Gebiet'" ref="gebietAdmin" />
    <section v-else class="platzhalter"><h2>{{ menue }}</h2><p>Die Verwaltung dieses Bereichs folgt später.</p></section>
  </main>
</template>

<style scoped>
.wachen-auswahl { display: grid; gap: 7px; min-width: 0; }
.wachen-name { white-space: pre-wrap; overflow-wrap: anywhere; }
:global(body:has(.admin)) { min-width: 0; }
.admin { position: fixed; inset: 0; display: flex; flex-direction: column; background: #edf0f2; color: #17232c; font: 13px Arial, sans-serif; overflow-y: auto; }
.admin, .admin * { box-sizing: border-box; }
header, nav { flex-shrink: 0; }
header, nav, .werkzeugleiste { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
header { justify-content: space-between; padding: 18px 24px; background: linear-gradient(#f4f6f8, #cbd5db); border-bottom: 1px solid #9da9b1; }
h1 { margin: 5px 0 0; font-size: 23px; } h2 { font-size: 17px; margin: 0; flex: 1; } h3 { margin: 0; }
nav { padding: 10px 24px; background: #dce2e6; } nav .aktiv { background: #fff0b3; }
button, input, select { min-width: 0; max-width: 100%; font: inherit; color: inherit; padding: 8px 10px; border: 1px solid #98a4ad; border-radius: 3px; background: white; box-sizing: border-box; }
button { cursor: pointer; background: linear-gradient(#fff, #dce2e6); }
.fahrzeug-admin, .platzhalter { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; flex: 1 0 auto; min-width: 0; overflow-wrap: anywhere; }
.hinweis { color: #52636e; margin: 0; } .fehler { color: #a32323; } .werkzeugleiste input { flex: 1; min-width: 200px; }
.verwaltung { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; min-width: 0; }
.tabelle { min-width: 0; width: 100%; max-width: 860px; } table { table-layout: fixed; width: 100%; border-collapse: collapse; background: white; text-align: left; font-size: 12px; line-height: 1.35; } th, td { height: 26px; padding: 1px 6px; border-bottom: 1px solid #ced6dc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; } th { background: #dce3e8; padding-block: 3px; }
th:nth-child(2) { width: 100px; }
th:nth-child(3) { width: 220px; }
th:nth-child(4) { width: 80px; }
th:nth-child(5) { width: 140px; }
tbody tr:nth-child(even) { background: #f4f6f7; }
tbody tr:hover { background: #e8eef2; }
.zeilen-aktionen { gap: 4px; flex-wrap: nowrap; }
.zeilen-aktionen button { display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; height: 18px; min-height: 0; flex-shrink: 0; font-size: 11px; line-height: 1; }
.tabelle tbody tr, .tabelle tbody td { height: 22px; }
.tabelle tbody td { padding-block: 0; line-height: 18px; }
.aktion-symbol { display: none; }
form { order: -1; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; width: 100%; min-width: 0; padding: 24px; background: white; border: 1px solid #b4bec5; border-radius: 5px; }
form h3 { padding-bottom: 12px; border-bottom: 1px solid #dce3e8; }
label { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; gap: 7px; }
form input:not([type=checkbox]), form select { width: 100%; }
small { line-height: 1.6; color: #52636e; }
.typ-details { display: grid; gap: 6px; margin: 0; padding: 12px; background: #edf1f4; border-left: 3px solid #95a7b4; line-height: 1.5; }
.formular-aktionen, .zeilen-aktionen { display: flex; }
.formular-aktionen { flex-wrap: wrap; }
.formular-aktionen { gap: 8px; }
.formular-aktionen { border-top: 1px solid #dce3e8; padding-top: 16px; }
.formular-aktionen button[type=submit] { background: #d1e3d4; font-weight: bold; }
.merkmale { min-width: 0; display: grid; gap: 12px; border: 1px solid #b4bec5; padding: 16px; margin: 0; }
.merkmale legend { max-width: 100%; white-space: normal; }
.merkmale label { display: flex; align-items: center; gap: 8px; }
.merkmale input { flex-shrink: 0; margin: 0; width: 16px; height: 16px; }
.loeschen { padding: 12px; background: #fff0d4; }
@media(max-width: 650px) {
  header, nav, .fahrzeug-admin, .platzhalter { padding: 14px; }
  form { padding: 16px; }
  .werkzeugleiste input { min-width: 0; flex-basis: 100%; }
  th:nth-child(2) { width: 14%; }
  th:nth-child(3) { width: 20%; }
  th:nth-child(4) { width: 55px; }
  th:nth-child(5) { width: 56px; }
  .aktion-text { display: none; }
  .aktion-symbol { display: inline; }
  .zeilen-aktionen button { width: 20px; padding: 0; }
  th, td { padding-inline: 3px; }

}
</style>
