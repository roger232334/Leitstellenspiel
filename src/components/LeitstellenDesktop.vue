<script setup>
const props = defineProps({
  einsaetze: {
    type: Array,
    required: true,
  },

  ausgewaehlterEinsatzId: {
    type: Number,
    default: null,
  },

  ausgewaehlterEinsatz: {
    type: Object,
    default: null,
  },

  fahrzeuge: {
    type: Array,
    required: true,
  },

  ereignisse: {
    type: Array,
    required: true,
  },

  uhrzeit: {
    type: String,
    default: '',
  },

  istFahrzeugDeaktiviert: {
  type: Function,
  required: true,
},
})

const emit = defineEmits([
  'einsatz-auswaehlen',
  'fahrzeug-auswaehlen',
  'alarmieren',
  'schliessen',
])


// --------------------------------------------------
// FAHRZEUGSTATUS
// --------------------------------------------------

function statusText(status) {
  switch (status) {
    case 1:
      return 'Funk'

    case 2:
      return 'Wache'

    case 3:
      return 'Anfahrt'

    case 4:
      return 'Einsatzort'

    case 7:
      return 'Transport'

    case 8:
      return 'Ziel'

    default:
      return '-'
  }
}


// --------------------------------------------------
// EINSATZSTATUS
// --------------------------------------------------

function einsatzStatusText(status) {
  if (status === 'offen') {
    return 'Offen'
  }

  if (status === 'alarmiert') {
    return 'Alarmiert'
  }

  if (status === 'abgeschlossen') {
    return 'Abgeschlossen'
  }

  return status || ''
}


// --------------------------------------------------
// STATUSKÄSTCHEN
// --------------------------------------------------

const statusListe = [
  1,
  2,
  3,
  4,
  7,
  8,
]

function statusZeit(
  fahrzeug,
  status,
) {
  const zeit =
    fahrzeug.statusZeiten?.[
      status
    ]

  if (!zeit) {
    return '--:--'
  }

  return zeit.slice(0, 5)
}

function statusBeschreibung(
  status,
) {
  switch (status) {
    case 1:
      return 'Einsatzbereit über Funk'

    case 2:
      return 'Einsatzbereit auf Wache'

    case 3:
      return 'Einsatz übernommen'

    case 4:
      return 'Einsatzstelle erreicht'

    case 7:
      return 'Patient aufgenommen'

    case 8:
      return 'Transportziel erreicht'

    default:
      return ''
  }
}


// --------------------------------------------------
// STICHWÖRTER B / T / R
// --------------------------------------------------

function stichwortWert(
  einsatz,
  kategorie,
) {
  if (!einsatz) {
    return ''
  }

  const neuesStichwort =
    einsatz.stichwoerter?.[
      kategorie
    ]

  if (neuesStichwort) {
    return neuesStichwort
  }

  // Unterstützung für bisherige Einsätze,
  // die nur "stichwort" besitzen.
  const altesStichwort =
    (
      einsatz.stichwort || ''
    ).trim()

  const gross =
    altesStichwort.toUpperCase()

  // Brand
  if (
    kategorie === 'B' &&
    (
      gross.startsWith('B') ||
      gross.includes('BRAND')
    )
  ) {
    return altesStichwort
  }

  // Technische Hilfeleistung
  if (
    kategorie === 'T' &&
    (
      gross.startsWith('THL') ||
      gross.startsWith('T ')
    )
  ) {
    return altesStichwort
  }

  // Rettungsdienst
  if (
    kategorie === 'R' &&
    (
      gross.startsWith('RD') ||
      gross.startsWith('R ')
    )
  ) {
    return altesStichwort
  }

  return ''
}
function istFahrzeugAusgewaehlt(
  fahrzeug,
) {
  if (
    !props.ausgewaehlterEinsatz
  ) {
    return false
  }

  return (
    props.ausgewaehlterEinsatz
      .fahrzeuge?.includes(
        fahrzeug.id,
      ) ?? false
  )
}

function istFahrzeugAlarmiert(
  fahrzeug,
) {
  if (
    !props.ausgewaehlterEinsatz
  ) {
    return false
  }

  return (
    fahrzeug.einsatzId ===
    props.ausgewaehlterEinsatz.id
  )
}

function fahrzeugKlicken(
  fahrzeug,
) {
  if (
    props.istFahrzeugDeaktiviert(
      fahrzeug,
    )
  ) {
    return
  }

  emit(
    'fahrzeug-auswaehlen',
    fahrzeug,
  )
}

function hatNeueFahrzeuge() {
  if (
    !props.ausgewaehlterEinsatz
  ) {
    return false
  }

  return props.fahrzeuge.some(
    (fahrzeug) => {
      return (
        istFahrzeugAusgewaehlt(
          fahrzeug,
        ) &&
        !istFahrzeugAlarmiert(
          fahrzeug,
        )
      )
    },
  )
}
</script>

<template>
  <div class="els-desktop">
    <!-- OBERSTE MENÜLEISTE -->

    <header class="els-menue">
      <div class="menue-links">
        <button>Einsatz</button>
        <button>TETRA</button>
        <button>Aktuelles</button>
        <button>Extras</button>
        <button>Telefonbuch</button>
        <button>Reports</button>
        <button>ELDIS</button>
        <button>Mail</button>
        <button>Hilfe</button>
      </div>

      <div class="menue-rechts">
        <span>&lt;GIS&gt;</span>

        <button
          class="zurueck-button"
          @click="emit('schliessen')"
        >
          Altes Layout
        </button>
      </div>
    </header>

    <!-- INFOLEISTE -->

    <div class="infoleiste">
      <div class="info-symbol">
        i
      </div>

      <span>
        Informationen zum Einsatz
      </span>

      <div class="uhr">
        {{ uhrzeit }}
      </div>
    </div>

    <!-- HAUPTBEREICH -->

    <div class="els-arbeitsbereich">

      <!-- ================================= -->
      <!-- LINKS: EINSATZBEARBEITUNG -->
      <!-- ================================= -->

      <section class="fenster einsatzfenster">
        <div class="fenster-titel">
          Einsatzbearbeitung
        </div>

        <div class="einsatz-auswahl">
          <label>Einsatz</label>

          <select
            :value="ausgewaehlterEinsatzId"
            @change="
              emit(
                'einsatz-auswaehlen',
                Number($event.target.value),
              )
            "
          >
            <option
              v-for="einsatz in einsaetze"
              :key="einsatz.id"
              :value="einsatz.id"
            >
              #{{ einsatz.id }} –
              {{ einsatz.meldung }}
            </option>
          </select>
        </div>

        <template v-if="ausgewaehlterEinsatz">

          <div class="abschnitt-titel">
            Einsatzort
          </div>

        <div class="formular">
  <label>Nummer</label>

  <input
    :value="
      ausgewaehlterEinsatz.id
    "
    readonly
  />

  <label>Meldebild</label>

  <input
    class="einsatzfeld"
    :value="
      ausgewaehlterEinsatz.meldung
    "
    readonly
  />

  <label>Straße / Ort</label>

  <input
    class="einsatzfeld"
    :value="
      ausgewaehlterEinsatz.ort
    "
    readonly
  />
</div>


<!-- STICHWÖRTER -->

<div class="stichwort-bereich">

  <div class="stichwort-zeile">
    <label>STW B</label>

    <input
      :value="
        stichwortWert(
          ausgewaehlterEinsatz,
          'B',
        )
      "
      readonly
    />
  </div>

  <div class="stichwort-zeile">
    <label>STW T</label>

    <input
      :value="
        stichwortWert(
          ausgewaehlterEinsatz,
          'T',
        )
      "
      readonly
    />
  </div>

  <div class="stichwort-zeile">
    <label>STW R</label>

    <input
      :value="
        stichwortWert(
          ausgewaehlterEinsatz,
          'R',
        )
      "
      readonly
    />
  </div>

</div>


<!-- EINSATZSTATUS -->

<div class="status-zeile">
  <label>Status</label>

  <div
    class="einsatz-statusfeld"
    :class="
      'einsatz-status-' +
      ausgewaehlterEinsatz.status
    "
  >
    {{
      einsatzStatusText(
        ausgewaehlterEinsatz.status,
      )
    }}
  </div>
</div>

          <div class="abschnitt-titel">
            Hinweise
          </div>

          <textarea
            class="hinweisfeld"
            readonly
            :value="
              ausgewaehlterEinsatz.bemerkung
            "
          ></textarea>

          <div class="untere-buttons">
            <button>Neu</button>
            <button>Öffnen</button>
            <button>Beenden</button>
            <button>Schließen</button>
            <button>Storno</button>
            <button>Protokoll</button>
          </div>
        </template>

        <div
          v-else
          class="kein-einsatz"
        >
          Kein Einsatz ausgewählt.
        </div>
      </section>

      <!-- ================================= -->
      <!-- RECHTS OBEN: DISPOSITION -->
      <!-- ================================= -->

      <section class="fenster dispo">
        <div class="fenster-titel">
          Dispoliste
        </div>

        <div class="tabellen-container">
          <table>
           <thead>
  <tr>
    <th>Funkrufname</th>
    <th>Typ</th>
    <th class="statusfolge-spalte">
      Fahrzeugstatus
    </th>
    <th>Einsatz</th>
    <th>Alarm</th>
  </tr>
</thead>

        <tbody>
  <tr
  v-for="fahrzeug in fahrzeuge"
  :key="fahrzeug.id"
  :class="{
    ausgewaehlt:
      istFahrzeugAusgewaehlt(
        fahrzeug,
      ),

    'alarmiert-fuer-einsatz':
      istFahrzeugAlarmiert(
        fahrzeug,
      ),

    gesperrt:
      istFahrzeugDeaktiviert(
        fahrzeug,
      ),
  }"
  @click="
    fahrzeugKlicken(
      fahrzeug,
    )
  "
>
    <td class="funkrufname-zelle">
      <strong>
        {{ fahrzeug.funkrufname }}
      </strong>
    </td>

    <td class="typ-zelle">
      {{ fahrzeug.typ }}
    </td>

    <td class="statusfolge-zelle">
      <div class="statusfolge">

        <div
          v-for="status in statusListe"
          :key="status"
          class="statuskasten"
          :class="{
            aktiv:
              fahrzeug.status === status,
          }"
          :title="
            statusBeschreibung(status)
          "
        >
          <span class="statusnummer">
            {{ status }}
          </span>

          <span class="statuszeit">
            {{
              statusZeit(
                fahrzeug,
                status,
              )
            }}
          </span>
        </div>

      </div>
    </td>

    <td class="einsatz-zelle">
      <strong
        v-if="fahrzeug.einsatzId"
      >
        #{{ fahrzeug.einsatzId }}
      </strong>
    </td>

    <td class="alarm-zelle">
      {{
        fahrzeug.einsatzId
          ? 'X'
          : ''
      }}
    </td>
  </tr>
</tbody>
          </table>
        </div>

        <div class="funktionsleiste">
          <button
  class="primaer"
  :disabled="
    !ausgewaehlterEinsatz ||
    ausgewaehlterEinsatz.status ===
      'alarmiert' ||
    !hatNeueFahrzeuge()
  "
  @click="emit('alarmieren')"
>
  Alarmieren
</button>

<button
  :disabled="
    !ausgewaehlterEinsatz ||
    ausgewaehlterEinsatz.status !==
      'alarmiert' ||
    !hatNeueFahrzeuge()
  "
  @click="emit('alarmieren')"
>
  Nachalarm.
</button>

          <button>
            Hinweis
          </button>

          <button>
            Hinzuf.
          </button>

          <button>
            Entf.
          </button>

          <button>
            Status setzen
          </button>

          <button>
            Zeiten ändern
          </button>

          <button>
            Protokoll
          </button>
        </div>
      </section>

      <!-- ================================= -->
      <!-- MITTE UNTEN: RÜCKMELDUNGEN -->
      <!-- ================================= -->

      <section class="fenster rueckmeldungen">
        <div class="fenster-titel">
          Rückmeldungen erfassen
        </div>

        <div class="rueckmeldung-kopf">
          <span>Zeit</span>
          <span>Text</span>
        </div>

        <div class="rueckmeldung-liste">
          <div
            v-for="ereignis in ereignisse.slice(0, 25)"
            :key="ereignis.id"
            class="rueckmeldung"
          >
            <span class="zeit">
              {{ ereignis.zeit }}
            </span>

            <span>
              {{ ereignis.text }}
            </span>
          </div>
        </div>

        <div class="funktionsleiste">
          <button>Neu</button>
          <button>Übernehmen</button>
          <button>SDS</button>
          <button>Vergrößern</button>
        </div>
      </section>

      <!-- ================================= -->
      <!-- RECHTS UNTEN: MASSNAHMEN -->
      <!-- ================================= -->

      <section class="fenster massnahmen">
        <div class="fenster-titel">
          Maßnahmen / Aktion
        </div>

        <table>
          <thead>
            <tr>
              <th>Maßnahme / Aktion</th>
              <th>St.</th>
              <th>Start</th>
              <th>Ende</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colspan="4">
              </td>
            </tr>
          </tbody>
        </table>

        <div class="massnahmen-buttons">
          <button class="primaer">
            Ausführen
          </button>

          <button>Entf.</button>
          <button>Details</button>
          <button>Merke</button>
          <button>Abbrechen</button>
          <button>Neu Berechn.</button>
        </div>
      </section>
    </div>

    <!-- STATUSLEISTE -->

    <footer class="statusleiste">
      <span>
        Leitstellensimulator
      </span>

      <span>
        {{
          ausgewaehlterEinsatz
            ? `Einsatz #${ausgewaehlterEinsatz.id}`
            : 'Kein Einsatz'
        }}
      </span>

      <span>
        {{ fahrzeuge.length }} Einsatzmittel
      </span>

      <span>
        {{ uhrzeit }}
      </span>
    </footer>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.els-desktop {
  position: fixed;
  inset: 0;
  z-index: 10000;

  display: flex;
  flex-direction: column;

  background: #d7dce0;

  color: #111;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 11px;
}

/* MENÜ */

.els-menue {
  height: 28px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 5px;

  background: #eef1f3;

  border-bottom:
    1px solid #89939c;
}

.menue-links {
  display: flex;
}

.els-menue button {
  border: 0;
  background: transparent;

  padding: 5px 7px;

  font-size: 11px;

  cursor: pointer;
}

.els-menue button:hover {
  background: #c7d5e1;
}

.menue-rechts {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zurueck-button {
  border: 1px solid #74818a !important;
  background: #e4e8eb !important;
}

/* INFO */

.infoleiste {
  height: 40px;

  display: flex;
  align-items: center;

  gap: 8px;

  padding: 4px;

  background: #dfe5e9;

  border-bottom:
    1px solid #8b969d;
}

.info-symbol {
  width: 28px;
  height: 28px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 3px;

  background: #1762a8;

  color: white;

  font-family: Georgia, serif;
  font-weight: bold;
  font-size: 20px;
}

.infoleiste > span {
  flex: 1;

  height: 28px;

  display: flex;
  align-items: center;

  padding: 0 8px;

  border: 1px solid #a0a9af;

  background: #edf0f2;
}

.uhr {
  padding: 6px 10px;

  border: 1px solid #a0a9af;

  background: white;

  font-family: monospace;
}

/* HAUPTBEREICH */

.els-arbeitsbereich {
  flex: 1;

  min-height: 0;

  display: grid;

 grid-template-columns:
  430px
  minmax(500px, 1fr)
  minmax(340px, 0.75fr);

  grid-template-rows:
    minmax(300px, 1fr)
    260px;

  gap: 3px;

  padding: 3px;
}

/* FENSTER */

.fenster {
  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  background: #edf0f2;

  border: 1px solid #89939c;
}

.fenster-titel {
  min-height: 23px;

  padding: 4px 6px;

  background:
    linear-gradient(
      #d8e2e8,
      #c2ccd3
    );

  border-bottom:
    1px solid #89939c;

  color: #334653;

  font-size: 10px;
}

/* LINKES FENSTER */

.einsatzfenster {
  grid-column: 1;
  grid-row: 1 / 3;
}

.einsatz-auswahl {
  display: grid;

  grid-template-columns:
    68px 1fr;

  gap: 4px;

  align-items: center;

  padding: 6px;
}

.einsatz-auswahl select {
  width: 100%;

  height: 22px;

  border: 1px solid #929ca3;

  background: white;

  font-size: 11px;
}

.abschnitt-titel {
  padding: 3px 6px;

  border-top:
    1px solid #89939c;

  border-bottom:
    1px solid #aab1b6;

  background: #d8dee2;

  font-weight: bold;

  color: #324956;
}

.formular {
  display: grid;

  grid-template-columns:
    70px 1fr;

  gap: 3px 5px;

  padding: 6px;
}

.formular label {
  display: flex;
  align-items: center;
}

.formular input {
  min-width: 0;

  height: 22px;

  padding: 2px 4px;

  border:
    1px solid #929ca3;

  background: white;

  font-size: 11px;
}

.formular .einsatzfeld {
  background: #fffda9;
}

.formular .wichtig {
  background: #ffec7d;

  font-weight: bold;
}

.hinweisfeld {
  flex: 1;

  min-height: 100px;

  margin: 6px;

  padding: 6px;

  resize: none;

  border:
    1px solid #929ca3;

  background: white;

  font-family: Arial, sans-serif;

  font-size: 11px;
}

.kein-einsatz {
  padding: 20px;

  text-align: center;

  color: #666;
}

/* TABELLEN */

.tabellen-container {
  flex: 1;

  min-height: 0;

  overflow: auto;

  background: white;
}

table {
  width: 100%;

  border-collapse: collapse;

  background: white;

  font-size: 10px;
}

th {
  height: 21px;

  padding: 2px 4px;

  text-align: left;

  white-space: nowrap;

  background:
    linear-gradient(
      #f5f7f8,
      #d5dadd
    );

  border:
    1px solid #9ca4a9;

  font-weight: normal;
}

td {
  height: 22px;

  padding: 2px 4px;

  border:
    1px solid #c4c9cc;
}

tbody tr:hover {
  background: #d8ecfb;
}

tbody tr.zugeordnet {
  background: #bde4ff;
}

/* STATUS */

.status-zelle {
  width: 35px;

  text-align: center;

  font-weight: bold;
}

.status-1 {
  background: #dff1ff;
}

.status-2 {
  background: #dcf5df;
}

.status-3 {
  background: #ffe7a8;
}

.status-4 {
  background: #ffc4c4;
}

.status-7 {
  background: #e2d3ff;
}

.status-8 {
  background: #ead9f4;
}

/* POSITIONEN */

.dispo {
  grid-column: 2 / 4;
  grid-row: 1;
}

.rueckmeldungen {
  grid-column: 2;
  grid-row: 2;
}

.massnahmen {
  grid-column: 3;
  grid-row: 2;
}

/* BUTTONLEISTEN */

.funktionsleiste,
.untere-buttons,
.massnahmen-buttons {
  display: flex;
  flex-wrap: wrap;

  gap: 3px;

  padding: 4px;

  background: #d9dee1;

  border-top:
    1px solid #929ca3;
}

.untere-buttons {
  margin-top: auto;
}

.funktionsleiste button,
.untere-buttons button,
.massnahmen-buttons button {
  min-height: 24px;

  padding: 3px 10px;

  border:
    1px solid #92999e;

  background:
    linear-gradient(
      #f9fafb,
      #d7dadd
    );

  color: #111;

  font-size: 10px;

  cursor: pointer;
}

.funktionsleiste button:hover,
.untere-buttons button:hover,
.massnahmen-buttons button:hover {
  background: #cbdde8;
}

button.primaer {
  background: #fff69a;

  border-color: #b4a94a;

  font-weight: bold;
}

/* RÜCKMELDUNGEN */

.rueckmeldung-kopf {
  display: grid;

  grid-template-columns:
    70px 1fr;

  background: #d7dcdf;

  border-bottom:
    1px solid #9ba3a8;
}

.rueckmeldung-kopf span {
  padding: 3px 5px;

  border-right:
    1px solid #aaa;
}

.rueckmeldung-liste {
  flex: 1;

  min-height: 0;

  overflow-y: auto;

  background: white;
}

.rueckmeldung {
  display: grid;

  grid-template-columns:
    70px 1fr;

  min-height: 21px;

  border-bottom:
    1px solid #d4d7d9;
}

.rueckmeldung span {
  padding: 3px 5px;
}

.rueckmeldung .zeit {
  color: #236ca2;

  border-right:
    1px solid #d4d7d9;

  font-family: monospace;
}

/* MASSNAHMEN */

.massnahmen table {
  flex: 1;
}

.massnahmen tbody {
  height: 100%;
}

.massnahmen td {
  height: 180px;
}

/* STATUS UNTEN */

.statusleiste {
  min-height: 22px;

  display: flex;

  border-top:
    1px solid #8f989e;

  background: #e8ebed;
}

.statusleiste span {
  padding: 3px 10px;

  border-right:
    1px solid #adb4b9;
}

.statusleiste span:first-child {
  flex: 1;
}
.statusfolge-spalte {
  min-width: 340px;
}

.statusfolge {
  display: flex;
  gap: 3px;
  white-space: nowrap;
}

.statuskasten {
  width: 50px;
  height: 38px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  border: 1px solid #8d969c;

  background:
    linear-gradient(
      #f4f5f6,
      #d5d9dc
    );

  color: #444;
}

.statuskasten .statusnummer {
  font-size: 12px;
  font-weight: bold;
  line-height: 14px;
}

.statuskasten .statuszeit {
  margin-top: 2px;

  font-family: monospace;
  font-size: 9px;

  color: #555;
}

/* aktueller Fahrzeugstatus */

.statuskasten.aktiv {
  border: 2px solid #716600;

  background: #fff08a;

  color: #000;
}

.statuskasten.aktiv .statuszeit {
  color: #111;
  font-weight: bold;
}

.funkrufname-zelle {
  min-width: 145px;
}

.einsatz-zelle {
  width: 65px;

  text-align: center;
}

.alarm-zelle {
  width: 45px;

  text-align: center;

  font-weight: bold;
}
.dispo tbody tr {
  cursor: pointer;
}

.dispo tbody tr:hover {
  background: #d7ecfa;
}

/* Fahrzeug nur disponiert,
   aber noch nicht alarmiert */

.dispo tbody tr.ausgewaehlt {
  background: #fff3a6;
}

/* Fahrzeug wurde bereits
   für diesen Einsatz alarmiert */

.dispo tbody tr.alarmiert-fuer-einsatz {
  background: #b8dcf4;
}

/* Nicht verfügbares Fahrzeug */

.dispo tbody tr.gesperrt {
  cursor: default;
  color: #737a7e;
}

.dispo tbody tr.gesperrt:not(
  .alarmiert-fuer-einsatz
) {
  background: #e4e6e7;
}

/* deaktivierte Funktionsbuttons */

.funktionsleiste button:disabled {
  opacity: 0.45;
  cursor: default;
  background: #d5d7d8;
}
</style>