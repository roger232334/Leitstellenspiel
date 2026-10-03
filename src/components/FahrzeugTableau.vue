<script setup>
import { computed, ref, watch } from 'vue'
import { WACHEN_KEY, alteTableauKennung, neueSeite, neueWache, standardWachen, wachenLaden, fahrzeugInWache, wacheVerschieben, wachenRasterAendern } from '../data/wachenTableau.js'
const props = defineProps({ fahrzeuge: { type: Array, required: true }, verwaltungErlaubt: Boolean })
const fehler = ref('')
const meldung = ref('')
let start
try { start = wachenLaden(localStorage.getItem(WACHEN_KEY), localStorage.getItem(alteTableauKennung), props.fahrzeuge) }
catch { start = standardWachen(props.fahrzeuge); fehler.value = 'Gespeicherte Anordnung konnte nicht geladen werden. Standardseiten sind geöffnet.' }
const tableau = ref(start)
const seite = computed(() => tableau.value.seiten.find(s => s.id === tableau.value.aktiveSeiteId))
const bearbeitungsmodus = ref(false)
const bearbeiten = computed({ get: () => props.verwaltungErlaubt && bearbeitungsmodus.value, set: wert => { bearbeitungsmodus.value = props.verwaltungErlaubt && wert } })
const auswahl = ref(null)
const drag = ref(null)
const ziel = ref(null)
const suche = ref('')
const name = ref('')
const spalten = ref(4)
const zeilen = ref(4)
const wachname = ref('')
const loeschen = ref(null)
const fahrzeugMap = computed(() => new Map(props.fahrzeuge.map(f => [f.id, f])))
const vorrat = computed(() => props.fahrzeuge.filter(f => !seite.value.wachen.some(w => w.fahrzeugIds.includes(f.id)) &&
  `${f.funkrufname} ${f.typ} ${f.bereich || ''}`.toLocaleLowerCase('de').includes(suche.value.toLocaleLowerCase('de'))))
const zellen = computed(() => Array.from({ length: seite.value.spalten * seite.value.zeilen }, (_, i) => ({
  spalte: i % seite.value.spalten, zeile: Math.floor(i / seite.value.spalten),
  wache: seite.value.wachen.find(w => w.spalte === i % seite.value.spalten && w.zeile === Math.floor(i / seite.value.spalten)),
})))
const sichtbareZellen = computed(() => bearbeiten.value ? zellen.value : zellen.value.filter(z => z.wache))
watch(() => tableau.value.aktiveSeiteId, () => {
  name.value = seite.value.name; spalten.value = seite.value.spalten; zeilen.value = seite.value.zeilen
  auswahl.value = null; loeschen.value = null; ziel.value = null; meldung.value = ''
}, { immediate: true })
watch(tableau, () => {
  if (!props.verwaltungErlaubt) return
  try { localStorage.setItem(WACHEN_KEY, JSON.stringify(tableau.value)); fehler.value = '' }
  catch { fehler.value = 'Die Anordnung kann nicht im Browser gespeichert werden. Änderungen bleiben nur bis zum Neuladen erhalten.' }
}, { deep: true })
watch(bearbeiten, () => { auswahl.value = null; drag.value = null; ziel.value = null; loeschen.value = null })
function seiteAnlegen() {
  if (!props.verwaltungErlaubt) return
  const s = neueSeite(`Seite ${tableau.value.seiten.length + 1}`)
  tableau.value.seiten.push(s); tableau.value.aktiveSeiteId = s.id; bearbeiten.value = true
}
function speichern() {
  if (!props.verwaltungErlaubt) return
  if (!name.value.trim()) { meldung.value = 'Bitte einen Seitennamen eingeben.'; return }
  if (!wachenRasterAendern(seite.value, Number(spalten.value), Number(zeilen.value))) {
    meldung.value = '1–20 Spalten und 1–50 Zeilen möglich. Wachen vor dem Verkleinern aus wegfallenden Zellen verschieben.'; return
  }
  seite.value.name = name.value.trim(); meldung.value = 'Seite angepasst.'
}
function wacheAnlegen(zelle = null) {
  if (!props.verwaltungErlaubt) return
  const frei = zelle || zellen.value.find(z => !z.wache)
  if (!frei || frei.wache) { meldung.value = 'Raster ist voll. Bitte weitere Zeilen hinzufügen.'; return }
  seite.value.wachen.push(neueWache(wachname.value.trim() || `Wache ${seite.value.wachen.length + 1}`, frei.spalte, frei.zeile))
  wachname.value = ''; meldung.value = 'Wache hinzugefügt. Fahrzeuge hineinziehen oder auswählen und in der Wache einsetzen.'
}
function umbenennen(wache, event) {
  if (!props.verwaltungErlaubt) return
  const text = event.target.value.trim()
  if (text) wache.name = text
  else event.target.value = wache.name
}
function entfernen() {
  if (!props.verwaltungErlaubt) return
  if (loeschen.value.art === 'seite') {
    if (tableau.value.seiten.length === 1) return
    tableau.value.seiten = tableau.value.seiten.filter(s => s.id !== seite.value.id)
    tableau.value.aktiveSeiteId = tableau.value.seiten[0].id
  } else {
    seite.value.wachen = seite.value.wachen.filter(w => w.id !== loeschen.value.id)
  }
  auswahl.value = null; loeschen.value = null
}
function dragStart(event, daten) {
  if (!bearbeiten.value) { event.preventDefault(); return }
  drag.value = daten; event.dataTransfer.setData('text/plain', JSON.stringify(daten)); event.dataTransfer.effectAllowed = 'move'
}
function dragEnde() { drag.value = null; ziel.value = null }
function einsetzen(zelle, daten = auswahl.value, vorId = null) {
  if (!bearbeiten.value || !daten) return
  if (daten.art === 'wache') wacheVerschieben(seite.value, daten.id, zelle.spalte, zelle.zeile)
  else if (zelle.wache && fahrzeugMap.value.has(daten.id)) fahrzeugInWache(seite.value, daten.id, zelle.wache.id, vorId)
  else { meldung.value = 'Bitte zuerst eine Wache in dieser Zelle anlegen.'; return }
  auswahl.value = null; meldung.value = 'Anordnung aktualisiert.'
}
function drop(event, zelle, vorId = null) { event.stopPropagation(); einsetzen(zelle, drag.value, vorId); dragEnde() }
function fahrzeugEntfernen(wache, id) { if (!props.verwaltungErlaubt) return; wache.fahrzeugIds = wache.fahrzeugIds.filter(f => f !== id); auswahl.value = null }
function statusText(status) { return { 1: 'Frei über Funk', 2: 'Frei auf Wache', 3: 'Anfahrt', 4: 'Am Einsatzort', 6: 'Nicht einsatzbereit', 7: 'Transport', 8: 'Am Transportziel' }[status] || 'Unbekannt' }
</script>

<template>
  <section class="wachen-tableau" :class="{ 'admin-kompakt': verwaltungErlaubt }">
    <nav class="seiten" aria-label="Tableau-Seiten">
      <button v-for="s in tableau.seiten" :key="s.id" type="button" :class="{ aktiv: s.id === seite.id }" :aria-current="s.id === seite.id ? 'page' : undefined" @click="tableau.aktiveSeiteId = s.id">{{ s.name }}</button>
      <button v-if="verwaltungErlaubt" type="button" @click="seiteAnlegen">+ Neue Seite</button>
    </nav>
    <header class="tableau-kopf"><div><span class="tableau-label">FAHRZEUGTABLEAU</span><strong>{{ seite.name }}</strong><span class="tableau-zahlen">{{ seite.wachen.length }} Wachen · {{ seite.wachen.reduce((summe, w) => summe + w.fahrzeugIds.length, 0) }} Fahrzeuge</span></div><button v-if="verwaltungErlaubt" type="button" :aria-pressed="bearbeiten" @click="bearbeiten = !bearbeiten">{{ bearbeiten ? 'Bearbeitung beenden' : 'Seite bearbeiten' }}</button></header>
    <form v-if="bearbeiten" class="einstellungen" @submit.prevent="speichern">
      <label>Seitenname <input v-model="name" required maxlength="60" /></label>
      <label>Spalten <input v-model.number="spalten" type="number" min="1" max="20" required /></label>
      <label>Zeilen <input v-model.number="zeilen" type="number" min="1" max="50" required /></label>
      <button type="submit">Übernehmen</button>
      <button type="button" :disabled="tableau.seiten.length === 1" @click="loeschen = { art: 'seite', name: seite.name }">Seite löschen</button>
    </form>
    <div v-if="loeschen" class="hinweis">„{{ loeschen.name }}“ und die zugehörige Anordnung löschen? Fahrzeuge bleiben verfügbar.
      <button type="button" @click="entfernen">Löschen</button><button type="button" @click="loeschen = null">Abbrechen</button>
    </div>
    <div v-if="fehler" class="hinweis" role="alert">{{ fehler }}</div>
    <div class="inhalt" :class="{ bearbeiten }">
      <aside v-if="bearbeiten" class="werkzeuge">
        <form @submit.prevent="wacheAnlegen()"><label for="wachen-name">Neue Wache</label><input id="wachen-name" v-model="wachname" placeholder="z. B. RTW Regensburg" maxlength="60" /><button type="submit">+ Wache hinzufügen</button></form>
        <h3>Fahrzeuge hinzufügen</h3><input v-model="suche" aria-label="Fahrzeuge suchen" placeholder="Funkrufname, Typ …" />
        <p>Fahrzeuge in eine Wache ziehen. Zum Sortieren auf eine Fahrzeugzeile ziehen. Wachen am Kopf verschieben.</p>
        <button v-for="f in vorrat" :key="f.id" type="button" draggable="true" class="vorrat" :class="{ ausgewaehlt: auswahl?.id === f.id && auswahl?.art === 'fahrzeug' }"
          @dragstart="dragStart($event, { art: 'fahrzeug', id: f.id })" @dragend="dragEnde" @click="auswahl = { art: 'fahrzeug', id: f.id }"><strong>{{ f.funkrufname }}</strong><span>{{ f.typ }}</span></button>
        <p v-if="!vorrat.length">Keine weiteren passenden Fahrzeuge für diese Seite.</p>
        <p>Alternativ: Fahrzeug auswählen und „Hier einsetzen“ anklicken. Die Zuordnung gilt nur für diese Tableau-Seite.</p>
        <button v-if="auswahl" type="button" @click="auswahl = null">Auswahl aufheben</button>
      </aside>
      <div class="tableau-scroll">
        <div v-if="!seite.wachen.length && !bearbeiten" class="leer">Keine Wachen auf dieser Seite hinterlegt.</div>
        <div class="wachen-raster" :style="{ gridTemplateColumns: `repeat(${seite.spalten}, minmax(260px, 1fr))` }">
          <div v-for="zelle in sichtbareZellen" :key="`${zelle.spalte}:${zelle.zeile}`" class="wachen-karte" :class="{ ziel: ziel === `${zelle.spalte}:${zelle.zeile}`, 'leer-zelle': !zelle.wache }"
            :style="{ gridColumn: zelle.spalte + 1, gridRow: zelle.zeile + 1 }"
            @dragover.prevent="bearbeiten && drag && (ziel = `${zelle.spalte}:${zelle.zeile}`)" @drop.prevent="drop($event, zelle)">
            <template v-if="zelle.wache">
              <header class="wachen-kopf" :draggable="bearbeiten" @dragstart="dragStart($event, { art: 'wache', id: zelle.wache.id })" @dragend="dragEnde">
                <input v-if="bearbeiten" :value="zelle.wache.name" aria-label="Wache umbenennen" maxlength="60" @change="umbenennen(zelle.wache, $event)" @mousedown.stop />
                <strong v-else>{{ zelle.wache.name }}</strong><span class="wachen-anzahl" :title="`${zelle.wache.fahrzeugIds.length} Fahrzeuge`">{{ zelle.wache.fahrzeugIds.length }}</span>
                <template v-if="bearbeiten"><button type="button" :aria-label="`${zelle.wache.name} verschieben`" @click="auswahl = { art: 'wache', id: zelle.wache.id }">↔</button><button type="button" :aria-label="`${zelle.wache.name} löschen`" @click="loeschen = { art: 'wache', id: zelle.wache.id, name: zelle.wache.name }">×</button></template>
              </header>
              <div v-for="id in zelle.wache.fahrzeugIds" :key="id" class="fahrzeug-zeile" :class="{ ausgewaehlt: auswahl?.art === 'fahrzeug' && auswahl.id === id }"
                :draggable="bearbeiten" @dragstart.stop="dragStart($event, { art: 'fahrzeug', id })" @dragend="dragEnde" @dragover.prevent.stop @drop.prevent="drop($event, zelle, id)">
                <b class="fms" :class="`fms-${fahrzeugMap.get(id)?.status}`" :title="statusText(fahrzeugMap.get(id)?.status)">{{ fahrzeugMap.get(id)?.status }}</b>
                <button type="button" class="fahrzeug-name" :disabled="!bearbeiten" :title="`${statusText(fahrzeugMap.get(id)?.status)}${fahrzeugMap.get(id)?.einsatzId ? ' · Einsatz #' + fahrzeugMap.get(id).einsatzId : ''}`" @click="auswahl = { art: 'fahrzeug', id }">{{ fahrzeugMap.get(id)?.funkrufname }}</button>
                <span class="fahrzeug-typ">{{ fahrzeugMap.get(id)?.typ }}</span>
                <button v-if="bearbeiten" class="entfernen" type="button" :aria-label="`${fahrzeugMap.get(id)?.funkrufname} aus Wache entfernen`" @click="fahrzeugEntfernen(zelle.wache, id)">×</button>
              </div>
              <button v-if="bearbeiten" class="ablage" type="button" @click="einsetzen(zelle)">{{ auswahl ? 'Hier einsetzen' : 'Fahrzeug hierher ziehen' }}</button>
              <p v-else-if="!zelle.wache.fahrzeugIds.length" class="leer">Keine Fahrzeuge zugeordnet.</p>
            </template>
            <template v-else><span class="koordinate">{{ String.fromCharCode(65 + zelle.spalte) }}{{ zelle.zeile + 1 }}</span><button type="button" @click="auswahl?.art === 'wache' ? einsetzen(zelle) : wacheAnlegen(zelle)">{{ auswahl?.art === 'wache' ? 'Wache hier einsetzen' : '+ Wache' }}</button></template>
          </div>
        </div>
      </div>
    </div>
    <footer role="status">{{ meldung || (bearbeiten ? 'Wachen und Fahrzeuge anordnen · Änderungen werden lokal gespeichert.' : 'Live-Fahrzeugstatus') }}</footer>
  </section>
</template>

<style scoped>
.wachen-tableau { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: #edf0f2; color: #111111; font: 12px Arial, sans-serif; }
button, input { font: inherit; color: inherit; border: 1px solid #929ca3; border-radius: 5px; padding: 7px 10px; background: linear-gradient(#ffffff, #dce1e4); }
button { cursor: pointer; } button:disabled { cursor: default; } button:hover:not(:disabled) { background: #e2e7eb; }
button:focus-visible, input:focus-visible { outline: 2px solid #677780; outline-offset: -2px; }
input { min-width: 0; background: #ffffff; } input[type=number] { width: 55px; }
.seiten { border-bottom: 1px solid #aab3ba; display: flex; flex-wrap: wrap; gap: 2px; padding: 4px; background: #cbd4da; flex-shrink: 0; max-height: 120px; overflow: auto; }
.seiten button { border: 0; background: transparent; color: #46545e; padding: 10px; }
.seiten .aktiv { background: #fff29a; color: #111; box-shadow: inset 0 -2px #aa9637; }
.tableau-kopf { flex-shrink: 0; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(#edf1f3, #cbd5db); color: #111111; border-bottom: 1px solid #aab3ba; }
.einstellungen { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 0 8px 8px; }
.einstellungen label { display: flex; align-items: center; gap: 5px; }
.hinweis { padding: 8px; background: #fff6cf; color: #594a16; }
.inhalt { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0,1fr); grid-template-rows: minmax(0, 1fr); overflow: hidden; }
.inhalt.bearbeiten { grid-template-columns: 235px minmax(0,1fr); }
.werkzeuge { padding: 10px; overflow: auto; background: #e4e8eb; border-right: 1px solid #929ca3; }
.werkzeuge form { display: grid; gap: 7px; }
.werkzeuge h3 { font-size: 12px; margin-top: 20px; }
.werkzeuge > input { width: 100%; }
.werkzeuge p { line-height: 1.5; color: #52636e; }
.vorrat { display: flex; flex-direction: column; gap: 5px; width: 100%; margin-top: 7px; text-align: left; cursor: grab; }
.tableau-scroll { min-width: 0; min-height: 0; overflow: auto; padding: 18px; scrollbar-gutter: stable; }
.wachen-raster { display: grid; gap: 18px; align-items: start; align-content: start; grid-auto-rows: max-content; padding-bottom: 18px; }
.wachen-karte { min-width: 0; height: auto; max-height: none; overflow: visible; background: #ffffff; border: 1px solid #aab3ba; border-radius: 8px; box-shadow: 0 4px 12px #25354014; }
.wachen-kopf { display: flex; align-items: center; gap: 7px; min-height: 46px; padding: 10px 12px; border-bottom: 1px solid #aab3ba; background: linear-gradient(#e6ecef, #d0dade); border-radius: 8px 8px 0 0; }
.wachen-kopf[draggable=true] { cursor: grab; }
.wachen-kopf input { flex: 1; width: 100%; }
.wachen-kopf button { padding: 3px 6px; }
.fahrzeug-zeile { display: flex; align-items: center; min-height: 48px; height: auto; flex-shrink: 0; padding: 4px 8px; gap: 5px; border-bottom: 1px solid #e0e5e8; }
.fahrzeug-zeile[draggable=true] { cursor: grab; }
.fms { min-width: 32px; height: 30px; flex-shrink: 0; border-radius: 5px; display: grid; place-items: center; color: white; background: #435264; font-size: 14px; }
.fms-1 { background: #ffff69; color: #111; } .fms-2 { background: #078315; } .fms-3 { background: #ef9c00; color: #111; } .fms-4 { background: #ff0909; } .fms-6 { background: #52616c; } .fms-7 { background: #b13caf; } .fms-8 { background: #1905ff; }
.fahrzeug-name { flex: 1; min-width: 0; text-align: left; border: 0; background: transparent; font-size: 11px; font-weight: bold; overflow-wrap: anywhere; }
.fahrzeug-name:disabled { color: #202b33; opacity: 1; }
.fahrzeug-typ { padding: 10px 8px; color: #52636e; font-size: 11px; }
.entfernen { border: 0; padding: 3px 7px; }
.ablage { width: 100%; border: 1px dashed #9ca8b0; background: #f1f4f6; color: #52636e; min-height: 35px; }
.leer-zelle { min-height: 110px; border: 1px dashed #b5bfc6; background: transparent; display: flex; align-items: center; justify-content: center; gap: 8px; }
.koordinate { color: #64747f; }
.ziel, .ausgewaehlt { outline: 2px solid #677780; outline-offset: -2px; }
.leer { padding: 12px; color: #52636e; }
footer { flex-shrink: 0; padding: 7px 10px; border-top: 1px solid #aab3ba; color: #46545e; }
.tableau-kopf > div { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; }
.tableau-label { width: 100%; font-size: 10px; font-weight: bold; letter-spacing: 1.5px; color: #52636e; }
.tableau-kopf strong { font-size: 20px; }
.tableau-zahlen { color: #52636e; font-size: 12px; }
.wachen-kopf > strong { flex: 1; overflow-wrap: anywhere; font-size: 13px; }
.wachen-anzahl { padding: 3px 7px; border-radius: 12px; color: #334653; background: #e4eaee; font-size: 11px; }
.fahrzeug-zeile:last-of-type { border-bottom: 0; }
.fahrzeug-zeile:hover { background: #f0f3f5; }
.fahrzeug-typ { font-size: 10px; font-weight: bold; color: #52636e; padding: 4px 5px; }
.ablage { border-radius: 0 0 7px 7px; padding: 10px; }
.wachen-karte.leer-zelle { box-shadow: none; border-color: #b5bfc6; }
.einstellungen, .hinweis { flex-shrink: 0; }
.einstellungen { padding: 12px 18px; background: #e4e8eb; }
.werkzeuge { padding: 16px; }
.admin-kompakt .fahrzeug-zeile { height: 26px; min-height: 26px; padding: 1px 5px; gap: 4px; }
.admin-kompakt .fms { height: 20px; min-width: 25px; font-size: 12px; border-radius: 2px; }
.admin-kompakt .fahrzeug-name { padding: 0 4px; height: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.admin-kompakt .fahrzeug-typ { padding: 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 30%; }
.admin-kompakt .entfernen { height: 20px; padding: 0 4px; }
.admin-kompakt .wachen-kopf { min-height: 30px; padding: 4px 8px; }
.admin-kompakt .vorrat { margin-top: 3px; padding: 3px 6px; gap: 2px; }
</style>
