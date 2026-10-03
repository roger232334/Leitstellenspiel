


<script setup>
import {
  computed,
  nextTick,
  onUnmounted,
  ref,
} from 'vue'

import { notrufSzenarien } from './data/notrufSzenarien.js'
import { gebietLaden, gebietsPruefung } from './data/gebiet.js'
import { notrufImGebiet } from './data/notruf/gebietsNotruf.js'
import { katalogFrage } from './data/notruf/frageKatalog.js'
import { antwortAufFrage } from './data/notruf/antwortLogik.js'
import { kommunikationsBeitrag, istSprachbeitrag } from './data/kommunikation.js'
import { dokumentationUebernehmen } from './data/einsatzDokumentation.js'
import { funkgruppenAusFahrzeugen, funkspruchErzeugen, fahrzeugFunkgruppeId } from './data/funk.js'
import { hinweisEntfernen, sprechwunschHinzufuegen } from './data/leitstellenHinweise.js'
import { routeBerechnen } from './services/routing.js'
import { adresseGeocodieren } from './services/geocoding.js'
import { einsatzAdresse, leereEinsatzErfassung as neueErfassung } from './data/einsatzErfassung.js'
import StartMenue from './components/StartMenue.vue'
import { einsatzFrequenzen, notrufWartezeit } from './data/schicht.js'
import { gemeinsameHinweiseAendern } from './data/einsatzHierarchie.js'
import { bedarfsTestEinsatz } from './data/bedarfsTestEinsaetze.js'
import { generiereEinsatz } from './data/einsaetze/einsatzGenerator.js'
import { phasenSprechwunschErzeugen, funkLageBekanntgeben, sprechwunschFreigeben } from './data/einsatzFunk.js'
import { simulationsUhr, simulationsGeschwindigkeiten, SIMULATIONS_TAKT_MS } from './services/simulationsZeit.js'
import { einsatzAlarmiert, fahrzeugAlarmieren, fahrzeugRouteUebernehmen, fahrzeugeFortschreiben, lebenszyklenFortschreiben } from './data/einsatzLebenszyklus.js'
import { simulationsTyp } from './data/fahrzeugArten.js'
import { stichwortKatalog } from './data/stichwortKatalog.js'
import { katalogStichwoerter, mitRdVerknuepfung } from './data/einsatzStichwoerter.js'

import LeitstellenKarte from './components/LeitstellenKarte.vue'
import FahrzeugUebersicht from './components/FahrzeugUebersicht.vue'
import FahrzeugTableau from './components/FahrzeugTableau.vue'
import EinsatzUebersicht from './components/EinsatzUebersicht.vue'
import ModulFenster from './components/ModulFenster.vue'
import { tabHerausgezogen } from './services/modulFenster.js'
import EinsatzListe from './components/EinsatzListe.vue'
import EinsatzDetails from './components/EinsatzDetails.vue'
import SystemChronik from './components/SystemChronik.vue'
import LeitstellenDesktop from './components/LeitstellenDesktop.vue'
import NotrufModul from './components/Notrufmodul.vue'
import {
  findeMeldebildNachName,
  loeseMeldebildAuf,
} from './data/meldebilder.js'
import {
  findeAaoRegel,
} from './data/aaoRegeln.js'
import {
  parseRdVerknuepfung,
} from './data/rdVerknuepfungParser.js'
// --------------------------------------------------
// UHRZEIT
// --------------------------------------------------

const uhrzeit = ref('')
const simulationGestartet = ref(false)
const simulationsZeit = ref(Date.now())
const einsatzFrequenz = ref(100)
const simulationsFaktor = ref(1)
let zentraleUhr = null
function leereEinsatzErfassung() {
  return { ...neueErfassung(), eroeffnetAm: new Date(simulationsZeit.value).toISOString() }
}
const neuesLayoutAktiv = ref(true)

function simulationsStandAnwenden({ zeit, deltaSekunden }) {
  simulationsZeit.value = zeit
  uhrzeit.value = new Date(zeit).toLocaleTimeString('de-DE')
  fahrzeugeFortschreiben(fahrzeuge.value, zeit)
  lebenszyklenFortschreiben(einsaetze.value, fahrzeuge.value, zeit, lebenszyklusEreignis)
  if (notrufDialog.value) notrufSekunden.value += deltaSekunden
  if (eingehenderNotruf.value) {
    klingelSekunden.value += deltaSekunden
    if (klingelSekunden.value >= ANRUF_TIMEOUT) notrufVerpasst()
  }
  if (naechsterNotrufAm != null && zeit >= naechsterNotrufAm) {
    naechsterNotrufAm = null
    starteEingehendenNotruf()
  }
}
function aktualisiereUhrzeit() {
  if (zentraleUhr) simulationsStandAnwenden(zentraleUhr.tick(performance.now()))
}
function geschwindigkeitAendern(event) {
  const faktor = Number(event.target.value)
  simulationsStandAnwenden(zentraleUhr.geschwindigkeit(faktor, performance.now()))
  simulationsFaktor.value = faktor
}
function lebenszyklusEreignis(event) {
  phasenSprechwunschErzeugen(event, einsaetze.value, fahrzeuge.value, leitstellenHinweise.value)
  const texte = { einsatzAlarmiert: 'Alarmiert', anfahrtGestartet: 'Anfahrt begonnen', erstesFahrzeugEingetroffen: 'Erstes geeignetes Fahrzeug eingetroffen', erkundungGestartet: 'Erkundung begonnen', erkundungAbgeschlossen: 'Erkundung abgeschlossen', massnahmenGestartet: 'Maßnahmen begonnen', einsatzAbschluss: 'Abschlussphase begonnen', einsatzBeendet: 'Einsatz beendet, Fahrzeuge freigegeben' }
  protokolliere(`Einsatz #${event.einsatzId}: ${texte[event.typ] || event.typ}`, 'einsatz', event.zeit)
}
let timer
function simulationStarten({ start, frequenz, fahrzeugDaten }) {
  if (simulationGestartet.value || !Number.isFinite(start) || !einsatzFrequenzen.includes(frequenz)) return
  fahrzeuge.value = fahrzeugDaten
  leitstellenHinweise.value = []
  zentraleUhr = simulationsUhr(start, performance.now())
  einsatzFrequenz.value = frequenz
  simulationGestartet.value = true
  aktualisiereUhrzeit()
  timer = setInterval(aktualisiereUhrzeit, SIMULATIONS_TAKT_MS)
  protokolliere('Leitstellensimulation gestartet', 'system')
  planeNaechstenNotruf()
}
onUnmounted(() => {
  clearInterval(timer)
  stoppeKlingelTon()
})

// --------------------------------------------------
// FAHRZEUGE
// --------------------------------------------------

const fahrzeuge = ref([])

// --------------------------------------------------
// EINSÄTZE
// --------------------------------------------------

const einsaetze = ref([])
const leitstellenHinweise = ref([])

const ausgewaehlterEinsatzId = ref(null)
const szenarioPositionen = {
  1: {
    lat: 49.0185,
    lng: 12.073,
  },

  2: {
    lat: 49.008,
    lng: 12.116,
  },

  3: {
    lat: 49.0045,
    lng: 12.099,
  },

  4: {
    lat: 49.033,
    lng: 12.102,
  },

  5: {
    lat: 49.023,
    lng: 12.12,
  },

  6: {
    lat: 49.006,
    lng: 12.091,
  },

  7: {
    lat: 48.995,
    lng: 12.087,
  },

  8: {
    lat: 49.016,
    lng: 12.125,
  },
}
const ausgewaehlterEinsatz = computed(() => {
  return einsaetze.value.find(
    (einsatz) => einsatz.id === ausgewaehlterEinsatzId.value,
  )
})

function einsatzAuswaehlen(id) {
  ausgewaehlterEinsatzId.value = id
}

function einsatzDokumentationAendern({ id, text }) {
  const einsatz = einsaetze.value.find(e => e.id === id)
  if (einsatz && typeof text === 'string') einsatz.dokumentationEntwurf = text
}

function einsatzNotizAendern({ id, text }) {
  gemeinsameHinweiseAendern(einsaetze.value, id, text)
}

function bedarfstestErstellen(art) {
  const einsatz = bedarfsTestEinsatz(art, naechsteEinsatzId())
  einsaetze.value.push(einsatz)
  einsatzAusListeOeffnen(einsatz.id)
  protokolliere(`Einsatz #${einsatz.id}: ${einsatz.meldung} angelegt`, 'einsatz')
}

function generatortestErstellen() {
  const einsatz = { ...generiereEinsatz('zimmerbrand'), id: naechsteEinsatzId(),
    quelle: 'generatortest', ort: 'Generatortest ohne Kartenposition', position: null,
    bemerkung: '[TEST] Datengetriebener Zimmerbrand. Erkundung erfolgt nach Eintreffen eines Fahrzeugs.' }
  einsaetze.value.push(einsatz)
  einsatzAusListeOeffnen(einsatz.id)
  protokolliere(`Generatortest #${einsatz.id}: Zimmerbrand angelegt`, 'einsatz')
}

function naechsteEinsatzId() {
  return Math.max(
    ...einsaetze.value.map((einsatz) => einsatz.id),
    1000,
  ) + 1
}

// --------------------------------------------------
// EINSATZSTRUKTUR / MELDEBILDER
// --------------------------------------------------

function leereStichwoerter() {
  return {
    B: null,
    T: null,
    ABC: null,
    R: null,
    SON: null,
    INF: null,
  }
}


function meldebildStichwoerter(
  meldung,
) {
  const meldebild =
    findeMeldebildNachName(
      meldung,
    )

  if (!meldebild) {
    return leereStichwoerter()
  }

  const aufgeloest =
    loeseMeldebildAuf(
      meldebild,
    )

  return {
    ...leereStichwoerter(),
    ...aufgeloest.stichwoerter,
  }
}


function hatStichwort(
  einsatz,
  bereich,
) {
  return Boolean(
    einsatz?.stichwoerter?.[
      bereich
    ],
  )
}
function autoSplitEinsatz() {
  const haupteinsatz =
    ausgewaehlterEinsatz.value

  if (!haupteinsatz) {
    return
  }

  if (
    haupteinsatz.typ !==
    'haupt'
  ) {
    alert(
      'Auto-Split ist nur bei einem Haupteinsatz möglich.',
    )
    return
  }

  if (
    haupteinsatz.autoSplitErfolgt
  ) {
    alert(
      'Dieser Einsatz wurde bereits aufgeteilt.',
    )
    return
  }

  const aufloesung = mitRdVerknuepfung(haupteinsatz.stichwoerter)
  haupteinsatz.stichwoerter = aufloesung.stichwoerter
  haupteinsatz.rdVerknuepfung = aufloesung.rdVerknuepfung
  const neueUntereinsaetze = []

  // --------------------------------
  // Feuerwehr
  // --------------------------------

  const hatFwStichwort =
    hatStichwort(
      haupteinsatz,
      'B',
    ) ||
    hatStichwort(
      haupteinsatz,
      'T',
    ) ||
    hatStichwort(
      haupteinsatz,
      'ABC',
    ) ||
    hatStichwort(
      haupteinsatz,
      'SON',
    )

  if (hatFwStichwort) {
    const id =
      naechsteEinsatzId()

    const fwEinsatz = {
      id,

      typ: 'unter',
      bereich: 'FW',

      parentId:
        haupteinsatz.id,
      schlagwort: haupteinsatz.schlagwort || Object.values(haupteinsatz.stichwoerter).find(e => e?.kennung)?.kennung || '',
      meldebildId: haupteinsatz.meldebildId,
      erfassung: haupteinsatz.erfassung ? { ...haupteinsatz.erfassung } : undefined,

      meldung:
        haupteinsatz.meldung,

      ort:
        haupteinsatz.ort,

      bemerkung:
        haupteinsatz.bemerkung,

      position:
        haupteinsatz.position
          ? {
              ...haupteinsatz.position,
            }
          : null,

      stichwoerter: {
        B:
          haupteinsatz
            .stichwoerter.B,

        T:
          haupteinsatz
            .stichwoerter.T,

        ABC:
          haupteinsatz
            .stichwoerter.ABC,

        R: null,

        SON:
          haupteinsatz
            .stichwoerter.SON,

        INF: null,
      },

      status: 'offen',
      fahrzeuge: [],

      untereinsatzIds: [],
      autoSplitErfolgt: false,
    }

    einsaetze.value.push(
      fwEinsatz,
    )

    neueUntereinsaetze.push(
      id,
    )

    protokolliere(
      `FW-Untereinsatz #${id} aus Haupteinsatz #${haupteinsatz.id} erzeugt`,
      'einsatz',
    )
  }
// --------------------------------
// Automatische RD-Verknüpfung
// aus Feuerwehr-Stichwort
// --------------------------------

const rdVerknuepfung = aufloesung.rdVerknuepfung

  // --------------------------------
  // Rettungsdienst
  // --------------------------------

  if (
  hatStichwort(
    haupteinsatz,
    'R',
  ) ||
  rdVerknuepfung
)
   {
    const id =
      naechsteEinsatzId()

    const rdEinsatz = {
      id,

      typ: 'unter',
      bereich: 'RD',

      parentId:
        haupteinsatz.id,
      schlagwort: haupteinsatz.schlagwort || Object.values(haupteinsatz.stichwoerter).find(e => e?.kennung)?.kennung || '',
      meldebildId: haupteinsatz.meldebildId,
      erfassung: haupteinsatz.erfassung ? { ...haupteinsatz.erfassung } : undefined,

      meldung:
        haupteinsatz.meldung,

      ort:
        haupteinsatz.ort,

      bemerkung:
        haupteinsatz.bemerkung,

      position:
        haupteinsatz.position
          ? {
              ...haupteinsatz.position,
            }
          : null,

      stichwoerter: {
        B: null,
        T: null,
        ABC: null,

        R:
          haupteinsatz
            .stichwoerter.R,

        SON: null,
        INF: null,
      },

  rdVerknuepfung:
    rdVerknuepfung
      ? rdVerknuepfung
      : null,

      status: 'offen',
      fahrzeuge: [],

      untereinsatzIds: [],
      autoSplitErfolgt: false,
    }

    einsaetze.value.push(
      rdEinsatz,
    )

    neueUntereinsaetze.push(
      id,
    )

    protokolliere(
      `RD-Untereinsatz #${id} aus Haupteinsatz #${haupteinsatz.id} erzeugt`,
      'einsatz',
    )
  }

  if (
    neueUntereinsaetze.length ===
    0
  ) {
    alert(
      'Für diesen Einsatz sind keine Stichwörter zum Aufteilen hinterlegt.',
    )
    return
  }

  haupteinsatz.untereinsatzIds =
    neueUntereinsaetze

  haupteinsatz.autoSplitErfolgt =
    true

  protokolliere(
    `Auto-Split für Einsatz #${haupteinsatz.id} durchgeführt`,
    'einsatz',
  )
}

function vorschlagErzeugen() {
  const einsatz =
    ausgewaehlterEinsatz.value
    console.log(
  'RD-Verknüpfung:',
  einsatz?.rdVerknuepfung,
)

  if (!einsatz) {
    return
  }

  if (einsatz.typ !== 'unter') {
    alert(
      'Ein Einsatzmittelvorschlag wird für einen Untereinsatz erstellt.',
    )

    return
  }

  if (
    einsatz.status ===
    'abgeschlossen'
  ) {
    return
  }

  let bedarf = []

  // =================================
  // RD-UNTEREINSATZ
  // =================================

  if (
    einsatz.bereich === 'RD' &&
    einsatz.rdVerknuepfung
  ) {
    bedarf =
      parseRdVerknuepfung(
        einsatz.rdVerknuepfung,
      )

    console.log(
      'RD-Bedarf:',
      bedarf,
    )
  }

  // =================================
  // NORMALE STICHWORT-AAO
  // z.B. Feuerwehr
  // =================================

  else {
    const relevanteStichwoerter = []

    if (
      einsatz.bereich === 'FW'
    ) {
      const fwBereiche = [
        'B',
        'T',
        'ABC',
        'SON',
      ]

      fwBereiche.forEach(
        (bereich) => {
          const stichwort =
            einsatz
              .stichwoerter?.[
                bereich
              ]

          if (stichwort) {
            relevanteStichwoerter.push(
              stichwort,
            )
          }
        },
      )
    }

    if (
      einsatz.bereich === 'RD' &&
      einsatz.stichwoerter?.R
    ) {
      relevanteStichwoerter.push(
        einsatz.stichwoerter.R,
      )
    }

    relevanteStichwoerter.forEach(
      (stichwort) => {
        const regel =
          findeAaoRegel(
            stichwort,
          )

        regel.forEach(
          (anforderung) => {
            const vorhanden =
              bedarf.find(
                (eintrag) =>
                  eintrag.typ ===
                  anforderung.typ,
              )

            if (vorhanden) {
              vorhanden.anzahl +=
                anforderung.anzahl
            } else {
              bedarf.push({
                ...anforderung,
              })
            }
          },
        )
      },
    )
  }

  // =================================
  // unbekannte Bestandteile
  // =================================

  const unbekannte =
    bedarf.filter(
      (eintrag) =>
        eintrag.unbekannt,
    )

  unbekannte.forEach(
    (eintrag) => {
      console.warn(
        'Noch nicht unterstützte RD-Komponente:',
        eintrag.grund,
      )
    },
  )

  const echterBedarf =
  bedarf.filter(
    (eintrag) =>
      eintrag.typ &&
      eintrag.anzahl > 0 &&
      !eintrag.platzhalter &&
      !eintrag.variabel,
  )

einsatz.platzhalterbedarf =
  bedarf.filter(
    (eintrag) =>
      eintrag.platzhalter ||
      eintrag.variabel,
  )
  if (
    echterBedarf.length === 0
  ) {
    alert(
      'Für diesen Einsatz konnte noch kein Fahrzeugbedarf ermittelt werden.',
    )

    return
  }

  // =================================
  // vorhandene Alarmierungen behalten
  // =================================

  const bereitsAlarmierteIds =
    einsatz.fahrzeuge.filter(
      (fahrzeugId) => {
        const fahrzeug =
          fahrzeuge.value.find(
            (f) =>
              f.id ===
              fahrzeugId,
          )

        return (
          fahrzeug?.einsatzId ===
          einsatz.id
        )
      },
    )

  const vorgeschlageneIds = []
  const fehlbedarf = []

  // =================================
  // Fahrzeuge suchen
  // =================================

echterBedarf.forEach(
  (anforderung) => {
    const erlaubteTypen = [
      anforderung.typ,
      ...(
        anforderung
          .alternativeTypen ??
        []
      ),
    ]

    const zielBereich =
      anforderung.bereich ??
      einsatz.bereich

    const kandidaten =
      fahrzeuge.value.filter(
        (fahrzeug) => {
          return (
            (erlaubteTypen.includes(fahrzeug.typ) || erlaubteTypen.includes(simulationsTyp(fahrzeug))) &&

            (
              !zielBereich ||
              fahrzeug.bereich ===
                zielBereich
            ) &&

            (
              fahrzeug.status === 1 ||
              fahrzeug.status === 2
            ) &&

            fahrzeug.einsatzId ===
              null &&

            !vorgeschlageneIds.includes(
              fahrzeug.id,
            )
          )
        },
      )

    const ausgewaehlt =
      kandidaten.slice(
        0,
        anforderung.anzahl,
      )

    ausgewaehlt.forEach(
      (fahrzeug) => {
        vorgeschlageneIds.push(
          fahrzeug.id,
        )
      },
    )

    const fehlen =
      anforderung.anzahl -
      ausgewaehlt.length

    if (fehlen > 0) {
      fehlbedarf.push({
        typ:
          anforderung.bezeichnung ??
          anforderung.typ,

        anzahl:
          fehlen,

        grund:
          anforderung.grund ??
          '',
      })
    }
  },
)

  // =================================
  // Einsatz aktualisieren
  // =================================

  einsatz.fahrzeuge = [
    ...new Set([
      ...bereitsAlarmierteIds,
      ...vorgeschlageneIds,
    ]),
  ]

  einsatz.fehlbedarf =
    fehlbedarf

  einsatz.vorschlagErstellt =
    true

  // =================================
  // Protokoll
  // =================================

  protokolliere(
    `Einsatzmittelvorschlag für Einsatz #${einsatz.id} erstellt`,
    'einsatz',
  )

  if (
    fehlbedarf.length > 0
  ) {
    const text =
      fehlbedarf
        .map(
          (eintrag) =>
            `${eintrag.anzahl} × ${eintrag.typ}`,
        )
        .join(', ')

    protokolliere(
      `Fehlbedarf Einsatz #${einsatz.id}: ${text}`,
      'einsatz',
    )
  }
}
// --------------------------------------------------
// NOTRUF
// --------------------------------------------------

const notrufDialog = ref(false)
const notrufSekunden = ref(0)

// Klingelnder, noch nicht angenommener Notruf
const eingehenderNotruf = ref(false)
const klingelSekunden = ref(0)

// Szenario, das hinter dem aktuell klingelnden Anruf steckt
const wartendesSzenario = ref(null)
// --------------------------------------------------
// SYSTEMCHRONIK + AUDIO
// --------------------------------------------------

const ereignisse = ref([])
const verpassteAnrufe = ref(0)
const geocodierungLaeuft = ref(false)

async function findeEinsatzPosition(
  adresse,
) {
  const text = adresse.trim()

  if (!text) {
    return null
  }

  // Zuerst genau die eingegebene Adresse suchen
  let treffer =
    await adresseGeocodieren(text)

  if (treffer) {
    return treffer
  }

  // Für unseren aktuellen Regensburg-Prototyp:
  // Falls nur Straße + Hausnummer eingegeben wurden,
  // versuchen wir es nochmal mit Regensburg.
  if (
    !text.toLowerCase()
      .includes('regensburg')
  ) {
    treffer =
      await adresseGeocodieren(
        `${text}, Regensburg, Deutschland`,
      )
  }

  return treffer
}

const tonAktiv = ref(false)

const ANRUF_TIMEOUT = 20

let audioContext = null
let klingelTonIntervall = null

function protokolliere(text, typ = 'info', zeit = simulationsZeit.value) {
  ereignisse.value.unshift({
    id: `${Date.now()}-${Math.random()}`,
    zeit: new Date(zeit).toLocaleTimeString('de-DE'),
    text,
    typ,
  })

  // Maximal 50 Einträge behalten
  if (ereignisse.value.length > 50) {
    ereignisse.value = ereignisse.value.slice(0, 50)
  }
}

async function tonAktivieren() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  tonAktiv.value = true

  protokolliere(
    'Akustische Signalisierung aktiviert',
    'system',
  )

  if (eingehenderNotruf.value) {
    starteKlingelTon()
  }
}

function kurzerTon(frequenz, startOffset) {
  if (!audioContext || !tonAktiv.value) {
    return
  }

  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  const start =
    audioContext.currentTime + startOffset

  oscillator.type = 'sine'
  oscillator.frequency.value = frequenz

  gain.gain.setValueAtTime(0.0001, start)

  gain.gain.exponentialRampToValueAtTime(
    0.08,
    start + 0.02,
  )

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + 0.22,
  )

  oscillator.connect(gain)
  gain.connect(audioContext.destination)

  oscillator.start(start)
  oscillator.stop(start + 0.25)
}

function spieleKlingelTon() {
  if (!tonAktiv.value || !audioContext) {
    return
  }

  kurzerTon(880, 0)
  kurzerTon(660, 0.28)
}

function starteKlingelTon() {
  stoppeKlingelTon()

  spieleKlingelTon()

  klingelTonIntervall = setInterval(() => {
    spieleKlingelTon()
  }, 1600)
}

function stoppeKlingelTon() {
  if (klingelTonIntervall) {
    clearInterval(klingelTonIntervall)
    klingelTonIntervall = null
  }
}

// Timer bis zum nächsten Anruf
let naechsterNotrufAm = null

const aktuellesSzenario = ref(null)

const gespraech = ref([])
const funk = ref({ aktiveGruppeId: null, teilnehmerId: null, vorbereiteteMeldung: null })
function sprechwunschUebernehmen(id, bestaetigen) {
  try {
    sprechwunschFreigeben(id, leitstellenHinweise.value, fahrzeuge.value, funk.value, einsaetze.value, gespraech.value, simulationsZeit.value)
    bestaetigen?.({})
  } catch (fehler) { bestaetigen?.({ fehler: fehler.message }) }
}
function funkteilnehmerAuswaehlen(id) {
  funk.value.teilnehmerId = fahrzeuge.value.some(f => f.id === id && fahrzeugFunkgruppeId(f) === funk.value.aktiveGruppeId) ? id : null
}
function sprechwunschErzeugen({ fahrzeugId, prioritaet }, bestaetigen) {
  try {
    const fahrzeug = fahrzeuge.value.find(f => f.id === fahrzeugId)
    if (!fahrzeug) throw new Error('Fahrzeug nicht gefunden.')
    sprechwunschHinzufuegen(leitstellenHinweise.value, fahrzeug, prioritaet, simulationsZeit.value)
    bestaetigen?.({})
  } catch (fehler) { bestaetigen?.({ fehler: fehler.message }) }
}
const funkgruppen = computed(() => funkgruppenAusFahrzeugen(fahrzeuge.value))
function funkgruppeAuswaehlen(id) {
  if (id !== funk.value.aktiveGruppeId) funk.value.teilnehmerId = null
  funk.value.aktiveGruppeId = funkgruppen.value.some(g => g.id === id) ? id : null
}
function funkspruchSenden({ gruppeId, fahrzeugId, text, meldungId }, bestaetigen) {
  try {
    const fahrzeug = fahrzeugId == null ? null : fahrzeuge.value.find(f => f.id === fahrzeugId)
    if (fahrzeugId != null && !fahrzeug) throw new Error('Fahrzeug nicht gefunden.')
    if (gruppeId !== funk.value.aktiveGruppeId) throw new Error('Bitte die aktive Funkgruppe prüfen.')
    const meldung = meldungId ? funk.value.vorbereiteteMeldung : null
    if (meldungId && (!meldung || meldung.id !== meldungId || meldung.gruppeId !== gruppeId || meldung.fahrzeugId !== fahrzeugId)) throw new Error('Die angenommene Meldung ist nicht mehr verfügbar.')
    gespraech.value.push(funkspruchErzeugen({ gruppeId, gruppen: funkgruppen.value, fahrzeug, text: meldung ? meldung.text : text, zeit: simulationsZeit.value }))
    if (meldung) {
      funkLageBekanntgeben(meldung, einsaetze.value)
      funk.value.vorbereiteteMeldung = null
    }
    bestaetigen?.({})
  } catch (fehler) { bestaetigen?.({ fehler: fehler.message }) }
}
const telefonGespraech = computed(() => gespraech.value.filter(e => istSprachbeitrag(e) && e.kanal === 'telefon'))
const frage = ref('')

const chatFenster = ref(null)

const notrufDaten = ref(leereEinsatzErfassung())
const manuelleErfassungAktiv = ref(false)
const manuelleErfassungDaten = ref(leereEinsatzErfassung())

function manuelleErfassungStarten() {
  if (geocodierungLaeuft.value) return
  if (!manuelleErfassungAktiv.value) {
    manuelleErfassungDaten.value = leereEinsatzErfassung()
  }
  manuelleErfassungAktiv.value = true
}

function manuelleErfassungAbbrechen() {
  if (geocodierungLaeuft.value) return
  manuelleErfassungAktiv.value = false
  manuelleErfassungDaten.value = leereEinsatzErfassung()
}

const notrufDauer = computed(() => {
  const minuten = Math.floor(notrufSekunden.value / 60)
  const sekunden = Math.floor(notrufSekunden.value) % 60

  return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`
})

const klingelDauer = computed(() => {
  const minuten = Math.floor(klingelSekunden.value / 60)
  const sekunden = Math.floor(klingelSekunden.value) % 60

  return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`
})

function zufaelligesSzenario() {
  try { return notrufImGebiet(notrufSzenarien, gebietLaden()) }
  catch (e) { protokolliere(`Gebietsdaten nicht verfügbar: ${e.message}`, 'warnung'); return null }
}

function zufaelligeWartezeit() {
  return notrufWartezeit(einsatzFrequenz.value)
}

function planeNaechstenNotruf() {
  naechsterNotrufAm = null
  if (!simulationGestartet.value || notrufDialog.value || eingehenderNotruf.value) return
  naechsterNotrufAm = simulationsZeit.value + zufaelligeWartezeit() * 1000
}

function starteEingehendenNotruf() {
  if (
    notrufDialog.value ||
    eingehenderNotruf.value
  ) {
    return
  }

  naechsterNotrufAm = null
  wartendesSzenario.value =
    zufaelligesSzenario()

  if (!wartendesSzenario.value) {
    protokolliere('Kein automatischer Notruf: aktive Ortschaften mit Faktor über 0 und importierte Adressen fehlen.', 'warnung')
    planeNaechstenNotruf()
    return
  }

  klingelSekunden.value = 0
  eingehenderNotruf.value = true

  protokolliere(
    'Eingehender Notruf auf Leitung 112',
    'notruf',
  )

  starteKlingelTon()
}

function notrufVerpasst() {
  if (!eingehenderNotruf.value) {
    return
  }

  stoppeKlingelTon()

  eingehenderNotruf.value = false
  klingelSekunden.value = 0
  wartendesSzenario.value = null

  verpassteAnrufe.value++

  protokolliere(
    'Notruf nicht angenommen – Anruf verpasst',
    'warnung',
  )

  planeNaechstenNotruf()
}

// Nur zum Testen während der Entwicklung
function testNotrufJetzt() {
  naechsterNotrufAm = null
  starteEingehendenNotruf()
}

function notrufAnnehmen() {
  if (!eingehenderNotruf.value || notrufDialog.value) return
  const annahmezeit = klingelDauer.value

stoppeKlingelTon()

protokolliere(
  `Notruf nach ${annahmezeit} angenommen`,
  'erfolg',
)
  if (wartendesSzenario.value) {
    aktuellesSzenario.value = wartendesSzenario.value
  } else {
    aktuellesSzenario.value = zufaelligesSzenario()
  }

  if (!aktuellesSzenario.value) { eingehenderNotruf.value = false; planeNaechstenNotruf(); return }

  eingehenderNotruf.value = false
  klingelSekunden.value = 0
  wartendesSzenario.value = null

  notrufDaten.value = leereEinsatzErfassung()

  frage.value = ''
  notrufSekunden.value = 0

  gespraech.value = gespraech.value.filter(e => e.kanal !== 'telefon')
  gespraech.value.push(kommunikationsBeitrag({
    kanal: 'telefon', rolle: 'anrufer',
    text: aktuellesSzenario.value.startText, zeit: simulationsZeit.value,
  }))

  notrufDialog.value = true

  scrollChatNachUnten()
}



function notrufBeenden() {
  if (geocodierungLaeuft.value) return
  stoppeKlingelTon()

  notrufDialog.value = false
  notrufSekunden.value = 0
  aktuellesSzenario.value = null
  gespraech.value = gespraech.value.filter(e => e.kanal !== 'telefon')
  frage.value = ''

  protokolliere(
    'Notrufgespräch ohne Einsatzeröffnung beendet',
    'info',
  )

  planeNaechstenNotruf()
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

async function telefonFrageSenden(frageText, frageId = null) {
  const text = frageText?.trim()
  if (!text || !notrufDialog.value || !aktuellesSzenario.value) return
  const antwort = frageId ? antwortAufFrage(aktuellesSzenario.value, frageId) : passendeAntwort(text)
  // Beide Inhalte vor dem UI-await erzeugen: kein Wechsel des Anrufers dazwischen.
  const beitraege = [
    kommunikationsBeitrag({ kanal: 'telefon', rolle: 'disponent', text, zeit: simulationsZeit.value }),
    kommunikationsBeitrag({ kanal: 'telefon', rolle: 'anrufer', text: antwort, zeit: simulationsZeit.value }),
  ]
  gespraech.value.push(...beitraege)
  await scrollChatNachUnten()
}
async function frageSenden() {
  const text = frage.value
  frage.value = ''
  await telefonFrageSenden(text)
}
async function frageAusKatalogSenden({ kategorie, frageId } = {}) {
  const katalogEintrag = katalogFrage(kategorie, frageId)
  if (!katalogEintrag) return
  await telefonFrageSenden(katalogEintrag.text, katalogEintrag.id)
}

async function einsatzAusNotrufErstellen() {
  return einsatzAusErfassungErstellen('notruf')
}

async function einsatzAusErfassungErstellen(quelle) {
  const manuell = quelle === 'manuell'
  if (geocodierungLaeuft.value || !(manuell ? manuelleErfassungAktiv.value : notrufDialog.value)) return
  const daten = { ...(manuell ? manuelleErfassungDaten.value : notrufDaten.value) }

  if (daten.meldung.trim() === '') {
    alert('Bitte ein Meldebild eingeben.')
    return
  }

  if (
    daten.strasse.trim() === '' &&
    daten.ort.trim() === '' &&
    daten.ortsteil.trim() === '' &&
    daten.objekt.trim() === ''
  ) {
    alert('Bitte mindestens einen Einsatzort eingeben.')
    return
  }

  const adressText = einsatzAdresse(daten)
  const adresseTeile = [daten.objekt, daten.station, adressText].filter(Boolean)

  const bemerkungen = []

  if (daten.anrufer.trim() !== '') {
    bemerkungen.push(
      `Anrufer: ${daten.anrufer.trim()}`,
    )
  }

  if (daten.rueckrufnummer.trim() !== '') {
    bemerkungen.push(
      `Rückrufnummer: ${daten.rueckrufnummer.trim()}`,
    )
  }

  if (daten.notiz.trim() !== '') {
    bemerkungen.push(
      daten.notiz.trim(),
    )
  }


const szenarioId =
  manuell ? null : aktuellesSzenario.value?.id
const szenarioAdressePasst = !manuell && ['strasse', 'hausnummer', 'ort', 'ortsteil'].every(f => (daten[f] || '') === (aktuellesSzenario.value?.daten?.[f] || ''))

const suchadresse =
  [daten.objekt, adressText].filter(Boolean).join(', ')

let geocode = null

geocodierungLaeuft.value = true

try {
  geocode =
    daten.position || await findeEinsatzPosition(
      suchadresse,
    )
} catch (fehler) {
  console.error(
    'Geocodingfehler:',
    fehler,
  )
} finally {
  geocodierungLaeuft.value = false
}

// Wenn die echte Adresse gefunden wurde:
// echte Koordinaten benutzen.
//
// Falls nicht:
// bisherige Szenario-Position als Fallback.
const position = geocode
  ? {
      lat: geocode.lat,
      lng: geocode.lng,
    }
  : (
      !szenarioAdressePasst ? null : aktuellesSzenario.value?.position ?? szenarioPositionen[
        szenarioId
      ] ?? null
    )

let gebietsErgebnis
try { gebietsErgebnis = gebietsPruefung({ ...daten, position, gebietId: daten.gebietId || (szenarioAdressePasst && aktuellesSzenario.value?.gebietId) || null }) }
catch { gebietsErgebnis = { erlaubt: false, grund: 'Gebietsdaten konnten nicht geprüft werden.' } }
if (!gebietsErgebnis.erlaubt && !confirm(`${gebietsErgebnis.grund} Einsatz dennoch manuell anlegen?`)) return

const stichwoerter =
  meldebildStichwoerter(
    daten.meldung.trim(),
  )

const katalogEintrag = stichwortKatalog.find(e => e.id === daten.meldebildId)
const aufloesung = katalogEintrag
  ? katalogStichwoerter(katalogEintrag)
  : mitRdVerknuepfung(stichwoerter)
Object.assign(stichwoerter, aufloesung.stichwoerter)
const neueId = naechsteEinsatzId()
einsaetze.value.push({
  id: neueId,
  erfassung: { ...daten, position },
  gebietId: gebietsErgebnis.erlaubt ? gebietsErgebnis.ort.id : null,
  quelle,
  schlagwort: katalogEintrag?.kennung || '',
  rdVerknuepfung: aufloesung.rdVerknuepfung,
  meldebildId: daten.meldebildId,
  sondersignal: daten.sondersignal,
  prioritaet: daten.prioritaet,

  typ: 'haupt',
  bereich: null,
  parentId: null,

  meldung:
    daten.meldung.trim(),

  ort:
    adresseTeile.join(', '),

  bemerkung:
    bemerkungen.join('\n'),

  position,

  stichwoerter,

  status: 'offen',

  fahrzeuge: [],

  untereinsatzIds: [],

  autoSplitErfolgt: false,
})

  ausgewaehlterEinsatzId.value = neueId
  aktivesModul.value = 'einsatz'

  protokolliere(
  `Einsatz #${neueId} eröffnet – ${daten.meldung.trim()}`,
  'einsatz',
)

  if (manuell) {
    manuelleErfassungAktiv.value = false
    manuelleErfassungDaten.value = leereEinsatzErfassung()
  } else {
    notrufDialog.value = false
    notrufSekunden.value = 0
    aktuellesSzenario.value = null
    gespraech.value = gespraech.value.filter(e => e.kanal !== 'telefon')
    planeNaechstenNotruf()
  }
}

// --------------------------------------------------
// MANUELLER EINSATZ
// --------------------------------------------------

const neuerEinsatzDialog = ref(false)
const bearbeiteterEinsatzId = ref(null)

const neuerEinsatzDaten = ref({
  meldung: '',
  ort: '',
  stichwort: '',
  bemerkung: '',
})

function neuerEinsatz() {
  bearbeiteterEinsatzId.value = null

  neuerEinsatzDaten.value = {
    meldung: '',
    ort: '',
    stichwort: '',
    bemerkung: '',
  }

  neuerEinsatzDialog.value = true
}
function einsatzBearbeiten(einsatz) {
  if (!einsatz) {
    return
  }

  bearbeiteterEinsatzId.value =
    einsatz.id

  neuerEinsatzDaten.value = {
    meldung: einsatz.meldung,
    ort: einsatz.ort,
    stichwort: einsatz.stichwort,
    bemerkung: einsatz.bemerkung,
  }

  neuerEinsatzDialog.value = true
}

async function einsatzAnlegen() {
  if (
    neuerEinsatzDaten.value.meldung.trim() === '' ||
    neuerEinsatzDaten.value.ort.trim() === ''
  ) {
    alert(
      'Bitte Meldebild und Einsatzort eingeben.',
    )

    return
  }

  geocodierungLaeuft.value = true

  let geocode = null

  try {
    geocode =
      await findeEinsatzPosition(
        neuerEinsatzDaten.value.ort,
      )
  } catch (fehler) {
    console.error(
      'Geocodingfehler:',
      fehler,
    )

    protokolliere(
      'Adresssuche nicht verfügbar.',
      'warnung',
    )
  } finally {
    geocodierungLaeuft.value = false
  }

  const position = geocode
    ? {
        lat: geocode.lat,
        lng: geocode.lng,
      }
    : null

  // ------------------------------------------
  // BESTEHENDEN EINSATZ BEARBEITEN
  // ------------------------------------------

  let gebietsWarnung = ''
  try { const pruefung = gebietsPruefung(geocode || { position }); if (!pruefung.erlaubt) gebietsWarnung = pruefung.grund }
  catch { gebietsWarnung = 'Gebietsdaten konnten nicht geprüft werden.' }
  if (gebietsWarnung && !confirm(`${gebietsWarnung} Eingabe dennoch manuell übernehmen?`)) return

  if (bearbeiteterEinsatzId.value !== null) {
    const einsatz =
      einsaetze.value.find(
        (eintrag) =>
          eintrag.id ===
          bearbeiteterEinsatzId.value,
      )

    if (!einsatz) {
      return
    }

    einsatz.meldung =
      neuerEinsatzDaten.value.meldung.trim()

    einsatz.ort =
      neuerEinsatzDaten.value.ort.trim()

    einsatz.stichwort =
      neuerEinsatzDaten.value.stichwort.trim()

    einsatz.bemerkung =
      neuerEinsatzDaten.value.bemerkung.trim()

    // Nur ersetzen, wenn eine neue Position
    // erfolgreich gefunden wurde.
    if (position) {
      einsatz.position = position
    }

    protokolliere(
      `Einsatz #${einsatz.id} bearbeitet`,
      'einsatz',
    )

    neuerEinsatzDialog.value = false
    bearbeiteterEinsatzId.value = null

    return
  }

  // ------------------------------------------
  // NEUEN EINSATZ ANLEGEN
  // ------------------------------------------

  const neueId = naechsteEinsatzId()

const stichwoerter =
  meldebildStichwoerter(
    neuerEinsatzDaten.value.meldung,
  )

einsaetze.value.push({
  id: neueId,

  typ: 'haupt',
  bereich: null,
  parentId: null,

  meldung:
    neuerEinsatzDaten.value.meldung,

  ort:
    neuerEinsatzDaten.value.ort,

  bemerkung:
    neuerEinsatzDaten.value.bemerkung,

  position,

  stichwoerter,

  status: 'offen',

  fahrzeuge: [],

  untereinsatzIds: [],

  autoSplitErfolgt: false,
})

ausgewaehlterEinsatzId.value =
  neueId

protokolliere(
  `Haupteinsatz #${neueId} manuell eröffnet – ${neuerEinsatzDaten.value.meldung}`,
  'einsatz',
)

neuerEinsatzDialog.value = false
  ausgewaehlterEinsatzId.value =
    neueId

  protokolliere(
    `Einsatz #${neueId} manuell eröffnet – ${neuerEinsatzDaten.value.meldung}`,
    'einsatz',
  )

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
// FAHRZEUGSTATUS + ZEITSTEMPEL
// --------------------------------------------------

// --------------------------------------------------
// DISPOSITION
// --------------------------------------------------

function fahrzeugAuswaehlen(fahrzeug) {
  const einsatz =
    ausgewaehlterEinsatz.value

  if (!einsatz) {
    return
  }

  if (
    einsatz.status ===
    'abgeschlossen'
  ) {
    return
  }

  // Bereits alarmierte Fahrzeuge können
  // nicht mehr abgewählt werden.
  if (
    fahrzeug.einsatzId ===
    einsatz.id
  ) {
    return
  }

  const bereitsAusgewaehlt =
    einsatz.fahrzeuge.includes(
      fahrzeug.id,
    )

  // Noch nicht alarmiertes Fahrzeug
  // wieder aus der Auswahl entfernen
  if (bereitsAusgewaehlt) {
    einsatz.fahrzeuge =
      einsatz.fahrzeuge.filter(
        (id) =>
          id !== fahrzeug.id,
      )

    return
  }

  if (
    !istFahrzeugVerfuegbar(
      fahrzeug,
    )
  ) {
    return
  }

  einsatz.fahrzeuge.push(
    fahrzeug.id,
  )
}

function istFahrzeugAusgewaehlt(fahrzeugId) {
  return ausgewaehlterEinsatz.value?.fahrzeuge.includes(
    fahrzeugId,
  )
}

function istFahrzeugDeaktiviert(fahrzeug) {
  const einsatz =
    ausgewaehlterEinsatz.value

  if (!einsatz) {
    return true
  }

  // Abgeschlossene Einsätze nicht mehr bearbeiten
  if (einsatz.status === 'abgeschlossen') {
    return true
  }

  // Fahrzeug wurde für genau diesen Einsatz
  // bereits alarmiert.
  // Es bleibt sichtbar, kann aber nicht mehr
  // abgewählt werden.
  if (
    fahrzeug.einsatzId === einsatz.id
  ) {
    return true
  }

  // Gerade neu ausgewähltes Fahrzeug darf
  // wieder abgewählt werden.
  if (
    istFahrzeugAusgewaehlt(
      fahrzeug.id,
    )
  ) {
    return false
  }

  // Sonstige verfügbare Fahrzeuge können
  // auch bei einem bereits alarmierten Einsatz
  // nachalarmiert werden.
  return !istFahrzeugVerfuegbar(
    fahrzeug,
  )
}

// --------------------------------------------------
// FAHRZEUG-LEBENSZYKLUS
// --------------------------------------------------

async function alarmieren() {
  const einsatz = ausgewaehlterEinsatz.value
  if (!einsatz || einsatz.status === 'abgeschlossen') return
  aktualisiereUhrzeit()
  if (einsatz.status === 'abgeschlossen') return
  const neu = fahrzeuge.value.filter(f => einsatz.fahrzeuge.includes(f.id) && f.einsatzId == null && [1, 2].includes(f.status))
  if (!neu.length) { alert('Bitte mindestens ein weiteres verfügbares Fahrzeug auswählen.'); return }
  einsatzAlarmiert(einsaetze.value, einsatz, simulationsZeit.value, lebenszyklusEreignis)
  einsatz.status = 'alarmiert'
  for (const f of neu) fahrzeugAlarmieren(f, einsatz.id, simulationsZeit.value)
  protokolliere(`Einsatz #${einsatz.id}: ${neu.map(f => f.funkrufname).join(', ')} alarmiert`, 'alarm')
  await Promise.all(neu.map(async f => {
    const fahrt = f.fahrt
    if (!f.position || !einsatz.position) return
    try {
      const route = await routeBerechnen(f.position, einsatz.position)
      if (fahrzeugRouteUebernehmen(f, fahrt, route)) {
        protokolliere(`${f.funkrufname}: Route ${(route.distanzMeter / 1000).toFixed(1)} km, ${Math.ceil(route.dauerSekunden / 60)} Simulationsminuten`, 'fahrzeug')
      }
    } catch {
      if (f.fahrt === fahrt && f.status === 3) protokolliere(`${f.funkrufname}: Routing nicht verfügbar, verwende Standard-Anfahrtszeit`, 'warnung')
    }
  }))
}
function katalogMeldebildAuswaehlen(
  eintrag,
) {
  const einsatz =
    ausgewaehlterEinsatz.value

  if (!einsatz) {
    return
  }

  if (einsatz.typ !== 'haupt') {
    return
  }

  if (einsatz.autoSplitErfolgt) {
    alert(
      'Das Meldebild kann nach dem Auto-Split nicht mehr geändert werden.',
    )

    return
  }

  const aufloesung = katalogStichwoerter(eintrag)
  const stichwoerter = aufloesung.stichwoerter
  einsatz.schlagwort = eintrag.kennung
  einsatz.rdVerknuepfung = aufloesung.rdVerknuepfung

  einsatz.meldebildId =
    eintrag.id

  einsatz.meldung =
    eintrag.schlagwort ||
    eintrag.stichwort

  einsatz.stichwoerter =
    stichwoerter

  protokolliere(
    `Meldebild für Einsatz #${einsatz.id} geändert: ${eintrag.kennung}`,
    'einsatz',
  )
}
const kartenAnsicht = ref(null)
const aktivesModul =
  ref('einsatz')
const notrufKategorie =
  ref(null)


function notrufKategorieAuswaehlen(
  kategorieId,
) {
  notrufKategorie.value =
    kategorieId
}

const leitstellenModule = [
  { id: 'einsatzliste', name: 'Einsatzliste' },
  {
    id: 'einsatz',
    name: 'Einsatzbearbeitung',
  },
  {
    id: 'notruf',
    name: 'Notrufannahme',
  },
  {
    id: 'karte',
    name: 'Karte',
  },
  {
    id: 'fahrzeuge',
    name: 'Fahrzeuge',
  },
  {
    id: 'chronik',
    name: 'Chronik',
  },
]


const besuchteModule = ref(new Set(['einsatz']))
const einsatzOeffnung = ref(0)
function einsatzAusListeOeffnen(id) {
  einsatzAuswaehlen(id)
  einsatzOeffnung.value++
  modulOeffnen('einsatz')
}
const ausgelagerteModule = ref({})
const modulFensterRefs = new Map()
const fensterMeldung = ref('')
const tabZiehen = ref(null)
const tabAuslagernBereit = ref(false)
let klickUnterdruecken = false

function modulOeffnen(modulId) {
  besuchteModule.value.add(modulId)
  aktivesModul.value = modulId
  if (ausgelagerteModule.value[modulId]) modulFensterRefs.get(modulId)?.fokussieren()
}
function modulFensterStatus(modulId, extern) {
  ausgelagerteModule.value[modulId] = extern
  if (!extern) aktivesModul.value = modulId
}
async function modulAuslagern(modulId, position) {
  fensterMeldung.value = ''
  besuchteModule.value.add(modulId)
  await nextTick()
  modulFensterRefs.get(modulId)?.auslagern(position)
}
function tabPointerStart(event, modulId) {
  if (event.button !== 0) return
  tabZiehen.value = { modulId, clientX: event.clientX, clientY: event.clientY,
    leiste: event.currentTarget.closest('nav').getBoundingClientRect() }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function tabPointerBewegen(event) {
  tabAuslagernBereit.value = tabHerausgezogen(tabZiehen.value, event, tabZiehen.value?.leiste)
}
function tabPointerEnde(event) {
  const start = tabZiehen.value
  const herausgezogen = tabHerausgezogen(start, event, start?.leiste)
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  tabZiehen.value = null
  tabAuslagernBereit.value = false
  if (herausgezogen) {
    klickUnterdruecken = true
    void modulAuslagern(start.modulId, { screenX: event.screenX, screenY: event.screenY })
    setTimeout(() => { klickUnterdruecken = false }, 0)
  }
}
function tabKlick(modulId) { if (!klickUnterdruecken) modulOeffnen(modulId) }
// --------------------------------------------------
// STATUS
// --------------------------------------------------

</script>

<template>
<StartMenue v-if="!simulationGestartet" @starten="simulationStarten" />
<div v-else class="leitstelle">
  <div
  v-if="neuesLayoutAktiv"
  class="leitstellen-hauptansicht"
>

  <nav class="leitstellen-module" aria-label="Module">
    <div v-for="modul in leitstellenModule" :key="modul.id" class="modul-tabgruppe">
      <button type="button" class="leitstellen-modul"
        :class="{ aktiv: aktivesModul === modul.id, ausgelagert: ausgelagerteModule[modul.id] }"
        title="Zum Auslagern aus der Tab-Leiste ziehen oder doppelklicken"
        @click="tabKlick(modul.id)" @dblclick="modulAuslagern(modul.id)"
        @pointerdown="tabPointerStart($event, modul.id)" @pointermove="tabPointerBewegen"
        @pointerup="tabPointerEnde" @pointercancel="tabZiehen = null; tabAuslagernBereit = false">
        {{ modul.name }}{{ ausgelagerteModule[modul.id] ? ' ↗' : '' }}
      </button>
      <button type="button" class="modul-auslagern-button" :aria-label="modul.name + ' in eigenem Fenster öffnen'" title="In eigenem Fenster öffnen" @click="modulAuslagern(modul.id)">↗</button>
    </div>
    <label class="simulations-tempo">Tempo <select :value="simulationsFaktor" @change="geschwindigkeitAendern"><option v-for="faktor in simulationsGeschwindigkeiten" :key="faktor" :value="faktor">{{ faktor }}×</option></select></label>
    <span class="modul-tab-hilfe">{{ new Date(simulationsZeit).toLocaleDateString('de-DE') }} · {{ uhrzeit }} · {{ einsatzFrequenz }} % · Tabs herausziehen oder ↗ klicken</span>
  </nav>
  <div v-if="fensterMeldung" class="fenster-meldung" role="alert">{{ fensterMeldung }} <button type="button" @click="fensterMeldung = ''">OK</button></div>
  <div v-if="tabAuslagernBereit" class="tab-zieh-hinweis">Loslassen, um das Modul in einem eigenen Fenster zu öffnen.</div>
  <div v-if="ausgelagerteModule[aktivesModul]" class="modul-ausgelagert-hinweis">
    <strong>{{ leitstellenModule.find(m => m.id === aktivesModul)?.name }} ist in einem eigenen Fenster geöffnet.</strong>
    <p>Das Fenster an seiner Titelleiste auf den gewünschten Bildschirm ziehen. Das Hauptfenster muss geöffnet bleiben.</p>
    <div><button type="button" @click="modulFensterRefs.get(aktivesModul)?.fokussieren()">Fenster anzeigen</button>
      <button type="button" @click="modulFensterRefs.get(aktivesModul)?.andocken()">Hier wieder anzeigen</button></div>
  </div>
  <template v-for="modul in leitstellenModule" :key="modul.id">
    <ModulFenster v-if="besuchteModule.has(modul.id)" v-slot="{ extern }"
      :ref="instanz => instanz ? modulFensterRefs.set(modul.id, instanz) : modulFensterRefs.delete(modul.id)"
      :titel="modul.name" :aktiv="aktivesModul === modul.id"
      @ausgelagert="modulFensterStatus(modul.id, $event)" @fehler="fensterMeldung = $event">
  <LeitstellenDesktop
    :leitstellen-hinweise="leitstellenHinweise"
    @hinweis-entfernen="hinweisEntfernen(leitstellenHinweise, $event)"
    @sprechwunsch-annehmen="sprechwunschUebernehmen"
  
    v-if="modul.id === 'einsatz'"
    :notruf-aktiv="notrufDialog"
    :einsatz-oeffnung="einsatzOeffnung"
    :manuelle-erfassung-aktiv="manuelleErfassungAktiv"
    v-model:manuelle-erfassung-daten="manuelleErfassungDaten"
    @manuellen-einsatz-starten="manuelleErfassungStarten"
    @manuellen-einsatz-abbrechen="manuelleErfassungAbbrechen"
    @manuellen-einsatz-erstellen="einsatzAusErfassungErstellen('manuell')"
    v-model:notruf-daten="notrufDaten"
    :geocodierung-laeuft="geocodierungLaeuft"
    @notruf-beenden="notrufBeenden"
    @einsatz-erstellen="einsatzAusNotrufErstellen"
    :key="'leitstellen-desktop'"
    :einsaetze="einsaetze"
    :ausgewaehlter-einsatz-id="ausgewaehlterEinsatzId"
    :ausgewaehlter-einsatz="ausgewaehlterEinsatz"
    :fahrzeuge="fahrzeuge"
    :uhrzeit="uhrzeit"
    :simulations-zeit="simulationsZeit"
    :ist-fahrzeug-deaktiviert="istFahrzeugDeaktiviert"
    @einsatz-auswaehlen="einsatzAuswaehlen"
    @fahrzeug-auswaehlen="fahrzeugAuswaehlen"
    @meldebild-auswaehlen="katalogMeldebildAuswaehlen"
    @einsatz-notiz-aendern="einsatzNotizAendern"
    @einsatz-dokumentation-aendern="einsatzDokumentationAendern"
    @einsatz-dokumentation-uebernehmen="id => dokumentationUebernehmen(einsaetze.find(e => e.id === id), simulationsZeit)"
    @bedarfstest-erstellen="bedarfstestErstellen"
    @generatortest-erstellen="generatortestErstellen"
    @alarmieren="alarmieren"
    @auto-split="autoSplitEinsatz"
    @vorschlag="vorschlagErzeugen"
  />
 <EinsatzUebersicht v-else-if="modul.id === 'einsatzliste'"
   :einsaetze="einsaetze" :fahrzeuge="fahrzeuge" :ausgewaehlter-einsatz-id="ausgewaehlterEinsatzId"
   @einsatz-oeffnen="einsatzAusListeOeffnen" />
 <NotrufModul
  :funkgruppen="funkgruppen"
  :aktive-funkgruppe-id="funk.aktiveGruppeId"
  :funkteilnehmer-id="funk.teilnehmerId"
  :vorbereitete-funkmeldung="funk.vorbereiteteMeldung"
  @funkteilnehmer-auswaehlen="funkteilnehmerAuswaehlen"
  :fahrzeuge="fahrzeuge"
  @funkgruppe-auswaehlen="funkgruppeAuswaehlen"
  @funkspruch-senden="funkspruchSenden"
  @sprechwunsch-erzeugen="sprechwunschErzeugen"
  v-else-if="
    modul.id === 'notruf'
  "

  @einsatz-erfassen="modulOeffnen('einsatz')"
  :aktive-kategorie="
    notrufKategorie
  "

  :uhrzeit="uhrzeit"

  :eingehender-notruf="
    eingehenderNotruf
  "

  :klingel-dauer="
    klingelDauer
  "

  :notruf-aktiv="
    notrufDialog
  "

  :gespraech="
    gespraech
  "

  @kategorie-auswaehlen="
    notrufKategorieAuswaehlen
  "

  @notruf-annehmen="
    notrufAnnehmen
  "

  @test-notruf="
    testNotrufJetzt
  "

  @frage-senden="
    frageAusKatalogSenden
  "
/>

<section
  v-else-if="
    modul.id === 'karte'
  "
  class="karten-modul"
>
  <div class="karten-modul-kopf">
    <span>
      Lagekarte
    </span>

    <span class="karten-modul-status">
      OpenStreetMap
    </span>
  </div>

  <div class="karten-modul-inhalt">
    <LeitstellenKarte
      :key="extern ? 'karte-extern' : 'karte-intern'"
      v-model:ansicht="kartenAnsicht"
      :fahrzeuge="fahrzeuge"
      :einsaetze="einsaetze"
      :ausgewaehlter-einsatz-id="
        ausgewaehlterEinsatzId
      "
      @einsatz-auswaehlen="
        einsatzAuswaehlen
      "
    />
  </div>
</section>


<FahrzeugTableau
  v-else-if="modul.id === 'fahrzeuge'"
  :fahrzeuge="fahrzeuge"
/>


<div v-else-if="modul.id === 'chronik'" class="chronik-modul">
  <SystemChronik :ereignisse="ereignisse" />
</div>
    </ModulFenster>
  </template>
</div>
    <header
  v-if="!neuesLayoutAktiv"
  class="kopfzeile"
>
      <div>
        <h1>ILS SIMULATOR</h1>
        <span>Integrierte Leitstelle</span>
      </div>

      <div class="systemstatus">
  
  <button
    class="tonbutton"
    :class="{ aktiv: tonAktiv }"
    @click="tonAktivieren"
  >
    {{
      tonAktiv
        ? '🔊 Ton aktiv'
        : '🔇 Ton aktivieren'
    }}
  </button>

  <span
    v-if="verpassteAnrufe > 0"
    class="verpasst-badge"
  >
    Verpasst: {{ verpassteAnrufe }}
  </span>

  <span class="onlinepunkt"></span>

  ONLINE

  <strong>{{ uhrzeit }}</strong>
</div>
    </header>

    <main
  v-if="!neuesLayoutAktiv"
  class="arbeitsbereich"
>

  <SystemChronik
  :ereignisse="ereignisse"
/>
      <!-- EINSÄTZE -->

      <section class="panel">
        <div class="panel-kopf">
          <h2>Einsätze</h2>

          <span class="zaehler">
            {{ einsaetze.length }}
          </span>
        </div>

      <div
  v-if="eingehenderNotruf"
  class="eingehender-anruf"
>
  <div class="anruf-kopf">
    <span class="anruf-punkt"></span>
    Eingehender Notruf
  </div>

  <div class="anruf-info">
    <span class="telefon-symbol">☎</span>

    <div>
      <strong>112</strong>
      <span>Klingelt seit {{ klingelDauer }}</span>
    </div>
  </div>

  <button
    class="annehmenbutton"
    @click="notrufAnnehmen"
  >
    Notruf annehmen
  </button>
</div>

<div
  v-else
  class="leitungsstatus"
>
  <span class="bereit-punkt"></span>

  <div>
    <strong>Notrufleitung bereit</strong>
    <span>Warte auf eingehenden Anruf...</span>
  </div>
</div>

<button
  class="testnotrufbutton"
  @click="testNotrufJetzt"
>
  Testanruf jetzt
</button>

    <EinsatzListe
  :einsaetze="einsaetze"
  :ausgewaehlter-einsatz-id="ausgewaehlterEinsatzId"
  @einsatz-auswaehlen="einsatzAuswaehlen"
  @neuer-einsatz="neuerEinsatz"
/>
      </section>

      <!-- EINSATZDETAILS -->

<EinsatzDetails
  v-if="ausgewaehlterEinsatz"
  :einsatz="ausgewaehlterEinsatz"
  :fahrzeuge="fahrzeuge"
  :fahrzeug-hinweis="fahrzeugHinweis"
  @bearbeiten="einsatzBearbeiten"
  @fahrzeug-auswaehlen="fahrzeugAuswaehlen"
  @alarmieren="alarmieren"
/>

   <!-- FAHRZEUGE -->

<FahrzeugUebersicht
  :fahrzeuge="fahrzeuge"
/>
<!-- LAGEKARTE -->

<section class="panel karten-panel">
  <div class="panel-kopf">
    <h2>Lagekarte</h2>

    <span class="karten-status">
      OpenStreetMap
    </span>
  </div>

  <LeitstellenKarte
    :fahrzeuge="fahrzeuge"
    :einsaetze="einsaetze"
    :ausgewaehlter-einsatz-id="ausgewaehlterEinsatzId"
    @einsatz-auswaehlen="einsatzAuswaehlen"
  />
</section>
    </main>

    <!-- SIMULIERTER NOTRUF -->

    <div
      v-if="notrufDialog && !neuesLayoutAktiv"
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
                v-for="nachricht in telefonGespraech"
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
  :disabled="geocodierungLaeuft"
  @click="einsatzAusNotrufErstellen"
>
  {{
    geocodierungLaeuft
      ? 'Adresse wird gesucht...'
      : 'Einsatz aus Notruf erstellen'
  }}
</button>
        </div>
      </div>
    </div>

    <!-- MANUELLER EINSATZ -->

    <div
      v-if="neuerEinsatzDialog"
      class="dialog-hintergrund"
      @click.self="
        neuerEinsatzDialog = false;
        bearbeiteterEinsatzId = null     
         "
    >
      <div class="dialog">
        <div class="dialog-kopf">
          <h2>
  {{
    bearbeiteterEinsatzId !== null
      ? `Einsatz #${bearbeiteterEinsatzId} bearbeiten`
      : 'Manuellen Einsatz anlegen'
  }}
</h2>

          <button
            class="dialog-schliessen"
            @click="
              neuerEinsatzDialog = false;
              bearbeiteterEinsatzId = null
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
  :disabled="geocodierungLaeuft"
  @click="einsatzAnlegen"
>
  {{
    geocodierungLaeuft
      ? 'Adresse wird gesucht...'
      : bearbeiteterEinsatzId !== null
        ? 'Änderungen speichern'
        : 'Einsatz anlegen'
  }}
</button>
        </div>
      </div>
    </div>
  </div>
</template>
