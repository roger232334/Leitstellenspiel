<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import { notrufSzenarien } from './data/notrufSzenarien.js'

// --------------------------------------------------
// UHRZEIT
// --------------------------------------------------

const uhrzeit = ref('')

function aktualisiereUhrzeit() {
  uhrzeit.value = new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  if (notrufDialog.value) {
    notrufSekunden.value++
  }
}

let timer

onMounted(() => {
  aktualisiereUhrzeit()
  timer = setInterval(aktualisiereUhrzeit, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

// --------------------------------------------------
// FAHRZEUGE
// --------------------------------------------------

const fahrzeuge = ref([
  {
    id: 1,
    funkrufname: 'RK Regensburg 71/1',
    typ: 'RTW',
    status: 2,
  },
  {
    id: 2,
    funkrufname: 'RK Regensburg 71/2',
    typ: 'RTW',
    status: 2,
  },
  {
    id: 3,
    funkrufname: 'RK Regensburg 76/1',
    typ: 'NEF',
    status: 1,
  },
  {
    id: 4,
    funkrufname: 'Florian Regensburg 40/1',
    typ: 'HLF',
    status: 2,
  },
])

// --------------------------------------------------
// EINSÄTZE
// --------------------------------------------------

const einsaetze = ref([
  {
    id: 1001,
    meldung: 'Bewusstlose Person',
    ort: 'Musterstraße 12',
    stichwort: 'RD2',
    bemerkung: 'Person nicht ansprechbar, Atmung vorhanden.',
    status: 'offen',
    fahrzeuge: [],
  },
  {
    id: 1002,
    meldung: 'Verkehrsunfall',
    ort: 'Hauptstraße 48',
    stichwort: 'THL 1',
    bemerkung: 'Zwei Pkw beteiligt. Lage noch unklar.',
    status: 'offen',
    fahrzeuge: [],
  },
])

const ausgewaehlterEinsatzId = ref(1001)

const ausgewaehlterEinsatz = computed(() => {
  return einsaetze.value.find(
    (einsatz) => einsatz.id === ausgewaehlterEinsatzId.value,
  )
})

function einsatzAuswaehlen(id) {
  ausgewaehlterEinsatzId.value = id
}

function naechsteEinsatzId() {
  return Math.max(
    ...einsaetze.value.map((einsatz) => einsatz.id),
    1000,
  ) + 1
}

// --------------------------------------------------
// NOTRUF
// --------------------------------------------------

const notrufDialog = ref(false)
const notrufSekunden = ref(0)

const aktuellesSzenario = ref(null)

const gespraech = ref([])
const frage = ref('')

const chatFenster = ref(null)

const notrufDaten = ref({
  anrufer: '',
  rueckrufnummer: '',
  ort: '',
  strasse: '',
  hausnummer: '',
  meldung: '',
  stichwort: '',
  notiz: '',
})

const notrufDauer = computed(() => {
  const minuten = Math.floor(notrufSekunden.value / 60)
  const sekunden = notrufSekunden.value % 60

  return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`
})

function zufaelligesSzenario() {
  const index = Math.floor(
    Math.random() * notrufSzenarien.length,
  )

  return notrufSzenarien[index]
}

function notrufAnnehmen() {
  aktuellesSzenario.value = zufaelligesSzenario()

  notrufDaten.value = {
    anrufer: '',
    rueckrufnummer: '',
    ort: '',
    strasse: '',
    hausnummer: '',
    meldung: '',
    stichwort: '',
    notiz: '',
  }

  frage.value = ''
  notrufSekunden.value = 0

  gespraech.value = [
    {
      id: Date.now(),
      rolle: 'anrufer',
      text: aktuellesSzenario.value.startText,
    },
  ]

  notrufDialog.value = true

  scrollChatNachUnten()
}

function notrufBeenden() {
  notrufDialog.value = false
  notrufSekunden.value = 0
  aktuellesSzenario.value = null
  gespraech.value = []
  frage.value = ''
}

async function scrollChatNachUnten() {
  await nextTick()

  if (chatFenster.value) {
    chatFenster.value.scrollTop =
      chatFenster.value.scrollHeight
  }
}

function passendeAntwort(frageText) {
  const text = frageText.toLowerCase()

  const treffer = aktuellesSzenario.value.antworten.find(
    (antwort) => {
      return antwort.schluesselwoerter.some(
        (schluesselwort) =>
          text.includes(schluesselwort.toLowerCase()),
      )
    },
  )

  if (treffer) {
    return treffer.antwort
  }

  const standardAntworten =
    aktuellesSzenario.value.standardAntworten

  const index = Math.floor(
    Math.random() * standardAntworten.length,
  )

  return standardAntworten[index]
}

async function frageSenden() {
  const text = frage.value.trim()

  if (
    text === '' ||
    !aktuellesSzenario.value
  ) {
    return
  }

  gespraech.value.push({
    id: Date.now(),
    rolle: 'disponent',
    text,
  })

  frage.value = ''

  await scrollChatNachUnten()

  const antwort = passendeAntwort(text)

  gespraech.value.push({
    id: Date.now() + 1,
    rolle: 'anrufer',
    text: antwort,
  })

  await scrollChatNachUnten()
}

function einsatzAusNotrufErstellen() {
  if (notrufDaten.value.meldung.trim() === '') {
    alert('Bitte ein Meldebild eingeben.')
    return
  }

  if (
    notrufDaten.value.strasse.trim() === '' &&
    notrufDaten.value.ort.trim() === ''
  ) {
    alert('Bitte mindestens einen Einsatzort eingeben.')
    return
  }

  const adresseTeile = []

  if (notrufDaten.value.strasse.trim() !== '') {
    let strasse = notrufDaten.value.strasse.trim()

    if (notrufDaten.value.hausnummer.trim() !== '') {
      strasse += ` ${notrufDaten.value.hausnummer.trim()}`
    }

    adresseTeile.push(strasse)
  }

  if (notrufDaten.value.ort.trim() !== '') {
    adresseTeile.push(notrufDaten.value.ort.trim())
  }

  const bemerkungen = []

  if (notrufDaten.value.anrufer.trim() !== '') {
    bemerkungen.push(
      `Anrufer: ${notrufDaten.value.anrufer.trim()}`,
    )
  }

  if (notrufDaten.value.rueckrufnummer.trim() !== '') {
    bemerkungen.push(
      `Rückrufnummer: ${notrufDaten.value.rueckrufnummer.trim()}`,
    )
  }

  if (notrufDaten.value.notiz.trim() !== '') {
    bemerkungen.push(
      notrufDaten.value.notiz.trim(),
    )
  }

  const neueId = naechsteEinsatzId()

  einsaetze.value.push({
    id: neueId,
    meldung: notrufDaten.value.meldung.trim(),
    ort: adresseTeile.join(', '),
    stichwort: notrufDaten.value.stichwort.trim(),
    bemerkung: bemerkungen.join('\n'),
    status: 'offen',
    fahrzeuge: [],
  })

  ausgewaehlterEinsatzId.value = neueId

  notrufDialog.value = false
  notrufSekunden.value = 0
  aktuellesSzenario.value = null
  gespraech.value = []
}

// --------------------------------------------------
// MANUELLER EINSATZ
// --------------------------------------------------

const neuerEinsatzDialog = ref(false)

const neuerEinsatzDaten = ref({
  meldung: '',
  ort: '',
  stichwort: '',
  bemerkung: '',
})

function neuerEinsatz() {
  neuerEinsatzDaten.value = {
    meldung: '',
    ort: '',
    stichwort: '',
    bemerkung: '',
  }

  neuerEinsatzDialog.value = true
}

function einsatzAnlegen() {
  if (
    neuerEinsatzDaten.value.meldung.trim() === '' ||
    neuerEinsatzDaten.value.ort.trim() === ''
  ) {
    alert('Bitte Meldebild und Einsatzort eingeben.')
    return
  }

  const neueId = naechsteEinsatzId()

  einsaetze.value.push({
    id: neueId,
    meldung: neuerEinsatzDaten.value.meldung,
    ort: neuerEinsatzDaten.value.ort,
    stichwort: neuerEinsatzDaten.value.stichwort,
    bemerkung: neuerEinsatzDaten.value.bemerkung,
    status: 'offen',
    fahrzeuge: [],
  })

  ausgewaehlterEinsatzId.value = neueId
  neuerEinsatzDialog.value = false
}

// --------------------------------------------------
// FAHRZEUGVERFÜGBARKEIT
// --------------------------------------------------

function andererEinsatzMitFahrzeug(fahrzeugId) {
  return einsaetze.value.find((einsatz) => {
    return (
      einsatz.id !== ausgewaehlterEinsatzId.value &&
      einsatz.fahrzeuge.includes(fahrzeugId)
    )
  })
}

function istFahrzeugVerfuegbar(fahrzeug) {
  const andererEinsatz =
    andererEinsatzMitFahrzeug(fahrzeug.id)

  if (andererEinsatz) {
    return false
  }

  return (
    fahrzeug.status === 1 ||
    fahrzeug.status === 2
  )
}

function fahrzeugHinweis(fahrzeug) {
  const andererEinsatz =
    andererEinsatzMitFahrzeug(fahrzeug.id)

  if (andererEinsatz) {
    return `Für Einsatz #${andererEinsatz.id} disponiert`
  }

  if (
    fahrzeug.status === 1 ||
    fahrzeug.status === 2
  ) {
    return 'Verfügbar'
  }

  if (fahrzeug.status === 3) {
    return 'Einsatz übernommen'
  }

  if (fahrzeug.status === 4) {
    return 'Am Einsatzort'
  }

  return 'Nicht verfügbar'
}

// --------------------------------------------------
// DISPOSITION
// --------------------------------------------------

function fahrzeugAuswaehlen(fahrzeug) {
  const einsatz = ausgewaehlterEinsatz.value

  if (
    !einsatz ||
    einsatz.status === 'alarmiert'
  ) {
    return
  }

  const bereitsAusgewaehlt =
    einsatz.fahrzeuge.includes(fahrzeug.id)

  if (bereitsAusgewaehlt) {
    einsatz.fahrzeuge =
      einsatz.fahrzeuge.filter(
        (id) => id !== fahrzeug.id,
      )

    return
  }

  if (!istFahrzeugVerfuegbar(fahrzeug)) {
    return
  }

  einsatz.fahrzeuge.push(fahrzeug.id)
}

function istFahrzeugAusgewaehlt(fahrzeugId) {
  return ausgewaehlterEinsatz.value?.fahrzeuge.includes(
    fahrzeugId,
  )
}

function istFahrzeugDeaktiviert(fahrzeug) {
  if (!ausgewaehlterEinsatz.value) {
    return true
  }

  if (
    ausgewaehlterEinsatz.value.status ===
    'alarmiert'
  ) {
    return true
  }

  if (istFahrzeugAusgewaehlt(fahrzeug.id)) {
    return false
  }

  return !istFahrzeugVerfuegbar(fahrzeug)
}

// --------------------------------------------------
// ALARMIERUNG
// --------------------------------------------------

function alarmieren() {
  const einsatz = ausgewaehlterEinsatz.value

  if (!einsatz) {
    return
  }

  if (einsatz.fahrzeuge.length === 0) {
    alert(
      'Bitte zuerst mindestens ein Fahrzeug auswählen.',
    )
    return
  }

  einsatz.status = 'alarmiert'

  fahrzeuge.value.forEach((fahrzeug) => {
    if (
      einsatz.fahrzeuge.includes(fahrzeug.id)
    ) {
      fahrzeug.status = 3
    }
  })
}

// --------------------------------------------------
// STATUS
// --------------------------------------------------

function statusText(status) {
  switch (status) {
    case 1:
      return 'Einsatzbereit über Funk'
    case 2:
      return 'Einsatzbereit auf Wache'
    case 3:
      return 'Einsatz übernommen'
    case 4:
      return 'Am Einsatzort'
    default:
      return 'Unbekannt'
  }
}
</script>

<template>
  <div class="leitstelle">
    <header class="kopfzeile">
      <div>
        <h1>ILS SIMULATOR</h1>
        <span>Integrierte Leitstelle</span>
      </div>

      <div class="systemstatus">
        <span class="onlinepunkt"></span>
        ONLINE
        <strong>{{ uhrzeit }}</strong>
      </div>
    </header>

    <main class="arbeitsbereich">
      <!-- EINSÄTZE -->

      <section class="panel">
        <div class="panel-kopf">
          <h2>Einsätze</h2>

          <span class="zaehler">
            {{ einsaetze.length }}
          </span>
        </div>

        <button
          class="notrufbutton"
          @click="notrufAnnehmen"
        >
          <span class="telefon-symbol">☎</span>

          <div>
            <strong>Notruf annehmen</strong>
            <span>112</span>
          </div>
        </button>

        <div class="einsatzliste">
          <button
            v-for="einsatz in einsaetze"
            :key="einsatz.id"
            class="einsatz"
            :class="{
              aktiv:
                einsatz.id ===
                ausgewaehlterEinsatzId,
            }"
            @click="einsatzAuswaehlen(einsatz.id)"
          >
            <div class="einsatznummer">
              #{{ einsatz.id }}
            </div>

            <strong>
              {{ einsatz.meldung }}
            </strong>

            <span>
              {{ einsatz.ort }}
            </span>

            <span
              class="einsatzstatus"
              :class="einsatz.status"
            >
              {{ einsatz.status }}
            </span>
          </button>
        </div>

        <button
          class="hauptbutton"
          @click="neuerEinsatz"
        >
          + Manueller Einsatz
        </button>
      </section>

      <!-- EINSATZDETAILS -->

      <section
        v-if="ausgewaehlterEinsatz"
        class="panel einsatzdetails"
      >
        <div class="panel-kopf">
          <h2>
            Einsatz #{{ ausgewaehlterEinsatz.id }}
          </h2>

          <span
            v-if="ausgewaehlterEinsatz.stichwort"
            class="stichwort-badge"
          >
            {{ ausgewaehlterEinsatz.stichwort }}
          </span>
        </div>

        <div class="detailblock">
          <label>Einsatzstichwort</label>

          <strong>
            {{
              ausgewaehlterEinsatz.stichwort ||
              'Nicht vergeben'
            }}
          </strong>
        </div>

        <div class="detailblock">
          <label>Meldebild</label>

          <strong>
            {{ ausgewaehlterEinsatz.meldung }}
          </strong>
        </div>

        <div class="detailblock">
          <label>Einsatzort</label>

          <strong>
            {{ ausgewaehlterEinsatz.ort }}
          </strong>
        </div>

        <div class="detailblock">
          <label>Bemerkung</label>

          <div class="detailtext">
            {{
              ausgewaehlterEinsatz.bemerkung ||
              'Keine weiteren Informationen vorhanden.'
            }}
          </div>
        </div>

        <h3>Fahrzeuge disponieren</h3>

        <div class="fahrzeugauswahl">
          <button
            v-for="fahrzeug in fahrzeuge"
            :key="fahrzeug.id"
            class="fahrzeug"
            :class="{
              ausgewaehlt:
                istFahrzeugAusgewaehlt(
                  fahrzeug.id,
                ),

              'nicht-verfuegbar':
                istFahrzeugDeaktiviert(fahrzeug),
            }"
            :disabled="
              istFahrzeugDeaktiviert(fahrzeug)
            "
            @click="fahrzeugAuswaehlen(fahrzeug)"
          >
            <div>
              <strong>
                {{ fahrzeug.funkrufname }}
              </strong>

              <span>
                {{ fahrzeug.typ }}
              </span>
            </div>

            <div class="fahrzeug-rechts">
              <div class="status">
                Status {{ fahrzeug.status }}
              </div>

              <div
                class="verfuegbarkeit"
                :class="{
                  verfuegbar:
                    istFahrzeugVerfuegbar(
                      fahrzeug,
                    ) ||
                    istFahrzeugAusgewaehlt(
                      fahrzeug.id,
                    ),
                }"
              >
                {{ fahrzeugHinweis(fahrzeug) }}
              </div>
            </div>
          </button>
        </div>

        <button
          class="alarmbutton"
          :disabled="
            ausgewaehlterEinsatz.status ===
            'alarmiert'
          "
          @click="alarmieren"
        >
          {{
            ausgewaehlterEinsatz.status ===
            'alarmiert'
              ? 'Alarmierung erfolgt'
              : 'Fahrzeuge alarmieren'
          }}
        </button>
      </section>

      <!-- FAHRZEUGE -->

      <section class="panel">
        <div class="panel-kopf">
          <h2>Fahrzeugübersicht</h2>
        </div>

        <div class="fahrzeugliste">
          <div
            v-for="fahrzeug in fahrzeuge"
            :key="fahrzeug.id"
            class="fahrzeugkarte"
          >
            <div>
              <strong>
                {{ fahrzeug.funkrufname }}
              </strong>

              <span>
                {{ fahrzeug.typ }}
              </span>
            </div>

            <div class="fahrzeugstatus">
              <span
                class="statusnummer"
                :class="
                  'status-' + fahrzeug.status
                "
              >
                {{ fahrzeug.status }}
              </span>

              {{ statusText(fahrzeug.status) }}
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- SIMULIERTER NOTRUF -->

    <div
      v-if="notrufDialog"
      class="dialog-hintergrund"
    >
      <div class="dialog notruf-dialog">
        <div class="notruf-kopf">
          <div class="notruf-titel">
            <span class="telefonpunkt"></span>

            <div>
              <h2>Notruf 112</h2>
              <span>Gespräch aktiv</span>
            </div>
          </div>

          <div class="notruf-zeit">
            {{ notrufDauer }}
          </div>
        </div>

        <div class="notruf-arbeitsbereich">
          <!-- GESPRÄCH -->

          <section class="gespraechsbereich">
            <h3>Gespräch</h3>

            <div
              ref="chatFenster"
              class="chatfenster"
            >
              <div
                v-for="nachricht in gespraech"
                :key="nachricht.id"
                class="nachricht"
                :class="nachricht.rolle"
              >
                <span class="nachricht-rolle">
                  {{
                    nachricht.rolle ===
                    'anrufer'
                      ? 'Anrufer'
                      : 'Disponent'
                  }}
                </span>

                <div class="nachricht-text">
                  {{ nachricht.text }}
                </div>
              </div>
            </div>

            <div class="fragebereich">
              <input
                v-model="frage"
                type="text"
                placeholder="Frage an den Anrufer..."
                @keyup.enter="frageSenden"
              />

              <button @click="frageSenden">
                Senden
              </button>
            </div>
          </section>

          <!-- EINSATZERFASSUNG -->

          <section class="notruf-erfassung">
            <h3>Einsatzerfassung</h3>

            <div class="formular-zeile">
              <div class="formularfeld">
                <label>Name des Anrufers</label>

                <input
                  v-model="notrufDaten.anrufer"
                  type="text"
                />
              </div>

              <div class="formularfeld">
                <label>Rückrufnummer</label>

                <input
                  v-model="
                    notrufDaten.rueckrufnummer
                  "
                  type="text"
                />
              </div>
            </div>

            <div class="formularfeld">
              <label>Ort</label>

              <input
                v-model="notrufDaten.ort"
                type="text"
              />
            </div>

            <div
              class="formular-zeile adresse-zeile"
            >
              <div class="formularfeld">
                <label>Straße</label>

                <input
                  v-model="notrufDaten.strasse"
                  type="text"
                />
              </div>

              <div class="formularfeld">
                <label>Hausnummer</label>

                <input
                  v-model="
                    notrufDaten.hausnummer
                  "
                  type="text"
                />
              </div>
            </div>

            <div class="formular-zeile">
              <div class="formularfeld">
                <label>Meldebild *</label>

                <input
                  v-model="notrufDaten.meldung"
                  type="text"
                />
              </div>

              <div class="formularfeld">
                <label>Einsatzstichwort</label>

                <input
                  v-model="
                    notrufDaten.stichwort
                  "
                  type="text"
                />
              </div>
            </div>

            <div class="formularfeld">
              <label>Gesprächsnotiz</label>

              <textarea
                v-model="notrufDaten.notiz"
                rows="5"
              ></textarea>
            </div>
          </section>
        </div>

        <div class="notruf-buttons">
          <button
            class="notruf-beenden"
            @click="notrufBeenden"
          >
            Gespräch beenden
          </button>

          <button
            class="einsatz-erstellen"
            @click="einsatzAusNotrufErstellen"
          >
            Einsatz aus Notruf erstellen
          </button>
        </div>
      </div>
    </div>

    <!-- MANUELLER EINSATZ -->

    <div
      v-if="neuerEinsatzDialog"
      class="dialog-hintergrund"
      @click.self="
        neuerEinsatzDialog = false
      "
    >
      <div class="dialog">
        <div class="dialog-kopf">
          <h2>
            Manuellen Einsatz anlegen
          </h2>

          <button
            class="dialog-schliessen"
            @click="
              neuerEinsatzDialog = false
            "
          >
            ×
          </button>
        </div>

        <div class="formularfeld">
          <label>Meldebild *</label>

          <input
            v-model="
              neuerEinsatzDaten.meldung
            "
            type="text"
          />
        </div>

        <div class="formularfeld">
          <label>Einsatzort *</label>

          <input
            v-model="neuerEinsatzDaten.ort"
            type="text"
          />
        </div>

        <div class="formularfeld">
          <label>Einsatzstichwort</label>

          <input
            v-model="
              neuerEinsatzDaten.stichwort
            "
            type="text"
          />
        </div>

        <div class="formularfeld">
          <label>Bemerkung</label>

          <textarea
            v-model="
              neuerEinsatzDaten.bemerkung
            "
            rows="4"
          ></textarea>
        </div>

        <div class="dialog-buttons">
          <button
            class="abbrechenbutton"
            @click="
              neuerEinsatzDialog = false
            "
          >
            Abbrechen
          </button>

          <button
            class="speichernbutton"
            @click="einsatzAnlegen"
          >
            Einsatz anlegen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>