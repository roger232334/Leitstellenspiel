<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import { notrufSzenarien } from './data/notrufSzenarien.js'
import { routeBerechnen } from './services/routing.js'

import LeitstellenKarte from './components/LeitstellenKarte.vue'
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

  // Laufendes Notrufgespräch
  if (notrufDialog.value) {
    notrufSekunden.value++
  }

  // Eingehender, noch nicht angenommener Notruf
  if (eingehenderNotruf.value) {
    klingelSekunden.value++

    if (klingelSekunden.value >= ANRUF_TIMEOUT) {
      notrufVerpasst()
    }
  }
}

let timer
let fahrzeugTimer

onMounted(() => {
  aktualisiereUhrzeit()

  // Uhr und Notruf-Timer
  timer = setInterval(
    aktualisiereUhrzeit,
    1000,
  )

  // Eigener Fahrzeug-Timer
  fahrzeugTimer = setInterval(
    aktualisiereFahrzeugEinsaetze,
    1000,
  )

  protokolliere(
    'Leitstellensimulation gestartet',
    'system',
  )

  planeNaechstenNotruf()
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(fahrzeugTimer)

  stoppeKlingelTon()

  if (naechsterNotrufTimer) {
    clearTimeout(naechsterNotrufTimer)
  }
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
    einsatzId: null,
    naechsterStatusIn: 0,

    position: {
      lat: 49.0148,
      lng: 12.0825,
    },

    route: [],
    routeSchritt: 0,
    routeSchritte: 0,
  },

  {
    id: 2,
    funkrufname: 'RK Regensburg 71/2',
    typ: 'RTW',
    status: 2,
    einsatzId: null,
    naechsterStatusIn: 0,

    position: {
      lat: 49.0146,
      lng: 12.083,
    },

    route: [],
    routeSchritt: 0,
    routeSchritte: 0,
  },

  {
    id: 3,
    funkrufname: 'RK Regensburg 76/1',
    typ: 'NEF',
    status: 1,
    einsatzId: null,
    naechsterStatusIn: 0,

    position: {
      lat: 49.0128,
      lng: 12.1035,
    },

    route: [],
    routeSchritt: 0,
    routeSchritte: 0,
  },

  {
    id: 4,
    funkrufname: 'Florian Regensburg 40/1',
    typ: 'HLF',
    status: 2,
    einsatzId: null,
    naechsterStatusIn: 0,

    position: {
      lat: 49.0205,
      lng: 12.112,
    },

    route: [],
    routeSchritt: 0,
    routeSchritte: 0,
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

  position: {
    lat: 49.0255,
    lng: 12.0955,
  },
},
 {
  id: 1002,
  meldung: 'Verkehrsunfall',
  ort: 'Hauptstraße 48',
  stichwort: 'THL 1',
  bemerkung: 'Zwei Pkw beteiligt. Lage noch unklar.',
  status: 'offen',
  fahrzeuge: [],

  position: {
    lat: 49.007,
    lng: 12.118,
  },
},
])

const ausgewaehlterEinsatzId = ref(1001)
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

const tonAktiv = ref(false)

const ANRUF_TIMEOUT = 20

let audioContext = null
let klingelTonIntervall = null

function aktuelleZeit() {
  return new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function protokolliere(text, typ = 'info') {
  ereignisse.value.unshift({
    id: `${Date.now()}-${Math.random()}`,
    zeit: aktuelleZeit(),
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
let naechsterNotrufTimer = null

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

const klingelDauer = computed(() => {
  const minuten = Math.floor(klingelSekunden.value / 60)
  const sekunden = klingelSekunden.value % 60

  return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`
})

function zufaelligesSzenario() {
  const index = Math.floor(
    Math.random() * notrufSzenarien.length,
  )

  return notrufSzenarien[index]
}

function zufaelligeWartezeit() {
  // Zufällige Wartezeit zwischen 20 und 60 Sekunden
  return Math.floor(Math.random() * 41) + 20
}

function planeNaechstenNotruf() {
  // Alten Timer sicherheitshalber entfernen
  if (naechsterNotrufTimer) {
    clearTimeout(naechsterNotrufTimer)
  }

  // Während eines Gesprächs oder klingelnden Anrufs
  // keinen weiteren Anruf erzeugen
  if (notrufDialog.value || eingehenderNotruf.value) {
    return
  }

  const wartezeit = zufaelligeWartezeit()

  console.log(`Nächster Notruf in ${wartezeit} Sekunden`)

  naechsterNotrufTimer = setTimeout(() => {
    starteEingehendenNotruf()
  }, wartezeit * 1000)
}

function starteEingehendenNotruf() {
  if (
    notrufDialog.value ||
    eingehenderNotruf.value
  ) {
    return
  }

  wartendesSzenario.value =
    zufaelligesSzenario()

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
  if (naechsterNotrufTimer) {
    clearTimeout(naechsterNotrufTimer)
  }

  starteEingehendenNotruf()
}

function notrufAnnehmen() {
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

  eingehenderNotruf.value = false
  klingelSekunden.value = 0
  wartendesSzenario.value = null

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
  stoppeKlingelTon()

  notrufDialog.value = false
  notrufSekunden.value = 0
  aktuellesSzenario.value = null
  gespraech.value = []
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

 const szenarioId =
  aktuellesSzenario.value?.id

const position =
  szenarioPositionen[szenarioId] ?? null

einsaetze.value.push({
  id: neueId,
  meldung: notrufDaten.value.meldung.trim(),
  ort: adresseTeile.join(', '),
  stichwort: notrufDaten.value.stichwort.trim(),
  bemerkung: bemerkungen.join('\n'),
  status: 'offen',
  fahrzeuge: [],
  position,
})

  ausgewaehlterEinsatzId.value = neueId

  protokolliere(
  `Einsatz #${neueId} eröffnet – ${notrufDaten.value.meldung.trim()}`,
  'einsatz',
)

  notrufDialog.value = false
  notrufSekunden.value = 0
  aktuellesSzenario.value = null
  gespraech.value = []

  planeNaechstenNotruf()
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
// FAHRZEUG-LEBENSZYKLUS
// --------------------------------------------------

function zufallsSekunden(min, max) {
  return (
    Math.floor(Math.random() * (max - min + 1)) +
    min
  )
}

function aktualisiereFahrzeugEinsaetze() {
  fahrzeuge.value.forEach((fahrzeug) => {
    if (fahrzeug.einsatzId === null) {
      return
    }

    // STATUS 3: Fahrt zum Einsatzort
    if (
      fahrzeug.status === 3 &&
      fahrzeug.route.length > 0
    ) {
      fahrzeug.routeSchritt++

      const fortschritt =
        fahrzeug.routeSchritt /
        fahrzeug.routeSchritte

      const index = Math.min(
        fahrzeug.route.length - 1,
        Math.floor(
          fortschritt *
            (fahrzeug.route.length - 1),
        ),
      )

      const punkt = fahrzeug.route[index]

      fahrzeug.position = {
        lat: punkt.lat,
        lng: punkt.lng,
      }

      fahrzeug.naechsterStatusIn =
        Math.max(
          0,
          fahrzeug.routeSchritte -
            fahrzeug.routeSchritt,
        )

      // Einsatzort erreicht
      if (
        fahrzeug.routeSchritt >=
        fahrzeug.routeSchritte
      ) {
        const letzterPunkt =
          fahrzeug.route[
            fahrzeug.route.length - 1
          ]

        fahrzeug.position = {
          lat: letzterPunkt.lat,
          lng: letzterPunkt.lng,
        }

        fahrzeug.route = []
        fahrzeug.routeSchritt = 0
        fahrzeug.routeSchritte = 0

        fahrzeug.status = 4

        fahrzeug.naechsterStatusIn =
          zufallsSekunden(15, 30)

        protokolliere(
          `${fahrzeug.funkrufname} meldet Status 4 – Einsatzstelle erreicht`,
          'fahrzeug',
        )
      }

      return
    }

    // STATUS 3 ohne verfügbare Route:
    // normaler Countdown als Fallback
    if (
      fahrzeug.status === 3 &&
      fahrzeug.route.length === 0
    ) {
      if (fahrzeug.naechsterStatusIn > 0) {
        fahrzeug.naechsterStatusIn--
      }

      if (fahrzeug.naechsterStatusIn <= 0) {
        fahrzeug.status = 4

        fahrzeug.naechsterStatusIn =
          zufallsSekunden(15, 30)

        protokolliere(
          `${fahrzeug.funkrufname} meldet Status 4 – Einsatzstelle erreicht`,
          'fahrzeug',
        )
      }

      return
    }

    // Alle anderen Statusphasen
    if (fahrzeug.naechsterStatusIn > 0) {
      fahrzeug.naechsterStatusIn--
    }

    if (fahrzeug.naechsterStatusIn <= 0) {
      naechsteFahrzeugPhase(fahrzeug)
    }
  })
}
function naechsteFahrzeugPhase(fahrzeug) {
  // RTW: Status 4 -> Status 7
  if (
    fahrzeug.status === 4 &&
    fahrzeug.typ === 'RTW'
  ) {
    fahrzeug.status = 7

    fahrzeug.naechsterStatusIn =
      zufallsSekunden(12, 25)

    protokolliere(
      `${fahrzeug.funkrufname} meldet Status 7 – Patient aufgenommen`,
      'fahrzeug',
    )

    return
  }

  // NEF / Feuerwehr nach Einsatzstelle wieder frei
  if (fahrzeug.status === 4) {
    fahrzeugEinsatzBeenden(fahrzeug)
    return
  }

  // RTW: Status 7 -> Status 8
  if (fahrzeug.status === 7) {
    fahrzeug.status = 8

    fahrzeug.naechsterStatusIn =
      zufallsSekunden(10, 20)

    protokolliere(
      `${fahrzeug.funkrufname} meldet Status 8 – Transportziel erreicht`,
      'fahrzeug',
    )

    return
  }

  // RTW nach Status 8 wieder frei
  if (fahrzeug.status === 8) {
    fahrzeugEinsatzBeenden(fahrzeug)
  }
}

function fahrzeugEinsatzBeenden(fahrzeug) {
  const einsatzId = fahrzeug.einsatzId

  const einsatz = einsaetze.value.find(
    (eintrag) => eintrag.id === einsatzId,
  )

  // RD-Fahrzeuge werden über Funk einsatzbereit.
  // Feuerwehr kehrt auf Status 2 zurück.
  if (
    fahrzeug.typ === 'RTW' ||
    fahrzeug.typ === 'NEF' ||
    fahrzeug.typ === 'KTW'
  ) {
    fahrzeug.status = 1
  } else {
    fahrzeug.status = 2
  }

  fahrzeug.einsatzId = null
  fahrzeug.naechsterStatusIn = 0

  protokolliere(
    `${fahrzeug.funkrufname} wieder einsatzbereit – Status ${fahrzeug.status}`,
    'fahrzeug',
  )

  if (!einsatz) {
    return
  }

  // Fahrzeug aus den aktuell gebundenen
  // Einsatzmitteln entfernen
  einsatz.fahrzeuge =
    einsatz.fahrzeuge.filter(
      (id) => id !== fahrzeug.id,
    )

  // Wenn kein Fahrzeug mehr an den Einsatz
  // gebunden ist, gilt er als beendet.
  if (
    einsatz.status === 'alarmiert' &&
    einsatz.fahrzeuge.length === 0
  ) {
    einsatz.status = 'abgeschlossen'

    protokolliere(
      `Einsatz #${einsatz.id} abgeschlossen`,
      'erfolg',
    )
  }
}
// --------------------------------------------------
// ALARMIERUNG
// --------------------------------------------------

async function alarmieren() {
  const einsatz =
    ausgewaehlterEinsatz.value

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

  const alarmierteFahrzeuge =
    fahrzeuge.value.filter((fahrzeug) =>
      einsatz.fahrzeuge.includes(
        fahrzeug.id,
      ),
    )

  alarmierteFahrzeuge.forEach(
    (fahrzeug) => {
      fahrzeug.status = 3
      fahrzeug.einsatzId = einsatz.id

      // Fallback
      fahrzeug.naechsterStatusIn = 10
    },
  )

  const fahrzeugNamen =
    alarmierteFahrzeuge
      .map(
        (fahrzeug) =>
          fahrzeug.funkrufname,
      )
      .join(', ')

  protokolliere(
    `Einsatz #${einsatz.id}: ${fahrzeugNamen} alarmiert`,
    'alarm',
  )

  // Keine Koordinaten?
  // Dann funktioniert weiterhin der alte Countdown.
  if (!einsatz.position) {
    protokolliere(
      `Einsatz #${einsatz.id}: keine Kartenposition vorhanden`,
      'warnung',
    )

    return
  }

  await Promise.all(
    alarmierteFahrzeuge.map(
      async (fahrzeug) => {
        try {
          const route =
            await routeBerechnen(
              fahrzeug.position,
              einsatz.position,
            )

          fahrzeug.route = route.punkte
          fahrzeug.routeSchritt = 0

          /*
           * Die echte Fahrzeit wäre für Tests zu lang.
           *
           * OSRM liefert z.B. 420 Sekunden.
           * Wir beschleunigen das Spiel ungefähr
           * um Faktor 20.
           */
          const simulierteFahrzeit =
            Math.round(
              route.dauerSekunden / 20,
            )

          fahrzeug.routeSchritte =
            Math.max(
              8,
              Math.min(
                35,
                simulierteFahrzeit,
              ),
            )

          fahrzeug.naechsterStatusIn =
            fahrzeug.routeSchritte

          const kilometer =
            (
              route.distanzMeter / 1000
            ).toFixed(1)

          protokolliere(
            `${fahrzeug.funkrufname}: Route ${kilometer} km – simulierte Fahrzeit ${fahrzeug.routeSchritte} s`,
            'fahrzeug',
          )
        } catch (fehler) {
          console.error(
            'Routingfehler:',
            fehler,
          )

          fahrzeug.route = []
          fahrzeug.routeSchritt = 0
          fahrzeug.routeSchritte = 0

          // Falls OSRM nicht erreichbar ist:
          fahrzeug.naechsterStatusIn = 10

          protokolliere(
            `${fahrzeug.funkrufname}: Routing nicht verfügbar – verwende simulierte Fahrzeit`,
            'warnung',
          )
        }
      },
    ),
  )
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
      return 'Einsatz übernommen / Anfahrt'

    case 4:
      return 'Am Einsatzort'

    case 7:
      return 'Patient aufgenommen / Transport'

    case 8:
      return 'Am Transportziel'

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

    <main class="arbeitsbereich">

      <section class="ereignisprotokoll">
  <div class="ereignis-kopf">
    <h2>Systemchronik</h2>

    <span>
      {{ ereignisse.length }} Ereignisse
    </span>
  </div>

  <div class="ereignisliste">
    <div
      v-if="ereignisse.length === 0"
      class="keine-ereignisse"
    >
      Noch keine Ereignisse vorhanden.
    </div>

    <div
      v-for="ereignis in ereignisse"
      :key="ereignis.id"
      class="ereigniszeile"
      :class="ereignis.typ"
    >
      <span class="ereigniszeit">
        {{ ereignis.zeit }}
      </span>

      <span>
        {{ ereignis.text }}
      </span>
    </div>
  </div>
</section>
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
    :class="'status-' + fahrzeug.status"
  >
    {{ fahrzeug.status }}
  </span>

  <div class="fahrzeugstatus-text">
    <span>
      {{ statusText(fahrzeug.status) }}
    </span>

    <small
      v-if="
        fahrzeug.einsatzId &&
        fahrzeug.naechsterStatusIn > 0
      "
    >
      Nächste Meldung in
      {{ fahrzeug.naechsterStatusIn }} s
    </small>
  </div>
</div>
          </div>
        </div>
      </section>
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
  />
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