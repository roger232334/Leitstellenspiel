<script setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  fahrzeuge: {
    type: Array,
    required: true,
  },

  einsaetze: {
    type: Array,
    required: true,
  },

  ausgewaehlterEinsatzId: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits([
  'einsatz-auswaehlen',
])

const kartenElement = ref(null)

let karte = null
let fahrzeugEbene = null
let einsatzEbene = null

// --------------------------------------------------
// WACHEN
// --------------------------------------------------

const wachen = [
  {
    id: 1,
    name: 'Rettungswache West',
    typ: 'Rettungsdienst',
    position: [49.0148, 12.0825],
  },
  {
    id: 2,
    name: 'Rettungswache Mitte',
    typ: 'Rettungsdienst',
    position: [49.0128, 12.1035],
  },
  {
    id: 3,
    name: 'Feuerwache Mitte',
    typ: 'Feuerwehr',
    position: [49.0205, 12.112],
  },
]

// --------------------------------------------------
// FARBEN
// --------------------------------------------------

function statusFarbe(status) {
  switch (status) {
    case 1:
      return '#3489d8'

    case 2:
      return '#39b86e'

    case 3:
      return '#e0ad39'

    case 4:
      return '#db4b52'

    case 7:
      return '#8b65cc'

    case 8:
      return '#9b68ad'

    default:
      return '#8796a1'
  }
}

function einsatzFarbe(status) {
  switch (status) {
    case 'alarmiert':
      return '#e0ad39'

    case 'abgeschlossen':
      return '#39b86e'

    case 'offen':
    default:
      return '#db4b52'
  }
}

// --------------------------------------------------
// WACHEN ZEICHNEN
// --------------------------------------------------

function zeichneWachen() {
  wachen.forEach((wache) => {
    const marker = L.circleMarker(
      wache.position,
      {
        radius: 13,
        color: '#dce5eb',
        weight: 3,

        fillColor:
          wache.typ === 'Feuerwehr'
            ? '#ba454b'
            : '#357ca5',

        fillOpacity: 0.9,
      },
    )

    marker.bindTooltip(
      `
        <strong>${wache.name}</strong><br>
        ${wache.typ}
      `,
      {
        direction: 'top',
      },
    )

    marker.addTo(karte)
  })
}

// --------------------------------------------------
// FAHRZEUGE ZEICHNEN
// --------------------------------------------------

function zeichneFahrzeuge() {
  if (!fahrzeugEbene) {
    return
  }

  fahrzeugEbene.clearLayers()

  props.fahrzeuge.forEach((fahrzeug) => {
    if (!fahrzeug.position) {
      return
    }

    const position = [
      fahrzeug.position.lat,
      fahrzeug.position.lng,
    ]

    const farbe =
      statusFarbe(fahrzeug.status)

    const marker = L.circleMarker(
      position,
      {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: farbe,
        fillOpacity: 1,
      },
    )

    marker.bindTooltip(
      `
        <strong>${fahrzeug.funkrufname}</strong><br>
        ${fahrzeug.typ}<br>
        Status ${fahrzeug.status}
      `,
      {
        direction: 'top',
      },
    )

    marker.addTo(fahrzeugEbene)
  })
}

// --------------------------------------------------
// EINSÄTZE ZEICHNEN
// --------------------------------------------------

function zeichneEinsaetze() {
  if (!einsatzEbene) {
    return
  }

  einsatzEbene.clearLayers()

  props.einsaetze.forEach((einsatz) => {
    if (!einsatz.position) {
      return
    }

    const position = [
      einsatz.position.lat,
      einsatz.position.lng,
    ]

    const istAusgewaehlt =
      einsatz.id ===
      props.ausgewaehlterEinsatzId

    const marker = L.circleMarker(
      position,
      {
        radius:
          istAusgewaehlt
            ? 13
            : 10,

        color:
          istAusgewaehlt
            ? '#ffffff'
            : '#202b33',

        weight:
          istAusgewaehlt
            ? 4
            : 2,

        fillColor:
          einsatzFarbe(einsatz.status),

        fillOpacity: 0.95,
      },
    )

    marker.bindTooltip(
      `
        <strong>Einsatz #${einsatz.id}</strong><br>
        ${einsatz.meldung}<br>
        ${einsatz.ort}<br>
        ${einsatz.stichwort || 'Kein Stichwort'}
      `,
      {
        direction: 'top',
      },
    )

    marker.on('click', () => {
      emit(
        'einsatz-auswaehlen',
        einsatz.id,
      )
    })

    marker.addTo(einsatzEbene)
  })
}

// --------------------------------------------------
// AUF EINSATZ ZENTRIEREN
// --------------------------------------------------

function zentriereAufEinsatz() {
  if (!karte) {
    return
  }

  const einsatz =
    props.einsaetze.find(
      (eintrag) =>
        eintrag.id ===
        props.ausgewaehlterEinsatzId,
    )

  if (!einsatz?.position) {
    return
  }

  karte.flyTo(
    [
      einsatz.position.lat,
      einsatz.position.lng,
    ],
    15,
    {
      duration: 0.7,
    },
  )
}

// --------------------------------------------------
// KARTE STARTEN
// --------------------------------------------------

onMounted(() => {
  karte = L.map(
    kartenElement.value,
    {
      zoomControl: true,
    },
  ).setView(
    [49.0134, 12.1016],
    13,
  )

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,

      attribution:
        '&copy; OpenStreetMap contributors',
    },
  ).addTo(karte)

  einsatzEbene =
    L.layerGroup().addTo(karte)

  fahrzeugEbene =
    L.layerGroup().addTo(karte)

  zeichneWachen()
  zeichneEinsaetze()
  zeichneFahrzeuge()

  setTimeout(() => {
    karte.invalidateSize()
  }, 100)
})

// --------------------------------------------------
// FAHRZEUGE BEOBACHTEN
// --------------------------------------------------

watch(
  () =>
    props.fahrzeuge.map(
      (fahrzeug) => ({
        id: fahrzeug.id,
        status: fahrzeug.status,

        lat:
          fahrzeug.position?.lat,

        lng:
          fahrzeug.position?.lng,
      }),
    ),

  () => {
    zeichneFahrzeuge()
  },

  {
    deep: true,
  },
)

// --------------------------------------------------
// EINSÄTZE BEOBACHTEN
// --------------------------------------------------

watch(
  () =>
    props.einsaetze.map(
      (einsatz) => ({
        id: einsatz.id,
        status: einsatz.status,

        lat:
          einsatz.position?.lat,

        lng:
          einsatz.position?.lng,

        meldung:
          einsatz.meldung,
      }),
    ),

  () => {
    zeichneEinsaetze()
  },

  {
    deep: true,
  },
)

// --------------------------------------------------
// AUSGEWÄHLTEN EINSATZ BEOBACHTEN
// --------------------------------------------------

watch(
  () =>
    props.ausgewaehlterEinsatzId,

  () => {
    zeichneEinsaetze()
    zentriereAufEinsatz()
  },
)

// --------------------------------------------------
// AUFRÄUMEN
// --------------------------------------------------

onBeforeUnmount(() => {
  if (karte) {
    karte.remove()
    karte = null
  }
})
</script>

<template>
  <div class="karten-wrapper">
    <div
      ref="kartenElement"
      class="karte"
    ></div>

    <div class="karten-legende">
      <strong>Fahrzeuge</strong>

      <div>
        <span class="legende status1"></span>
        Status 1
      </div>

      <div>
        <span class="legende status2"></span>
        Status 2
      </div>

      <div>
        <span class="legende status3"></span>
        Status 3
      </div>

      <div>
        <span class="legende status4"></span>
        Status 4
      </div>

      <div class="legenden-trenner"></div>

      <strong>Einsätze</strong>

      <div>
        <span class="legende einsatz-offen"></span>
        Offen
      </div>

      <div>
        <span class="legende einsatz-alarmiert"></span>
        Alarmiert
      </div>

      <div>
        <span class="legende einsatz-abgeschlossen"></span>
        Abgeschlossen
      </div>
    </div>
  </div>
</template>

<style scoped>
.karten-wrapper {
  position: relative;

  width: 100%;
  height: 430px;

  overflow: hidden;

  border: 1px solid #354754;
  border-radius: 5px;
}

.karte {
  width: 100%;
  height: 100%;
}

.karten-legende {
  position: absolute;

  right: 12px;
  bottom: 25px;

  z-index: 1000;

  min-width: 140px;

  padding: 10px;

  background: rgba(18, 27, 34, 0.92);
  color: #dce5eb;

  border: 1px solid #455a68;
  border-radius: 5px;

  font-size: 10px;
}

.karten-legende strong {
  display: block;

  margin-bottom: 7px;

  font-size: 10px;
  text-transform: uppercase;
}

.karten-legende div {
  display: flex;
  align-items: center;

  gap: 6px;

  margin-top: 4px;
}

.legende {
  display: inline-block;

  width: 10px;
  height: 10px;

  flex-shrink: 0;

  border-radius: 50%;
}

.status1 {
  background: #3489d8;
}

.status2 {
  background: #39b86e;
}

.status3 {
  background: #e0ad39;
}

.status4 {
  background: #db4b52;
}

.einsatz-offen {
  background: #db4b52;
}

.einsatz-alarmiert {
  background: #e0ad39;
}

.einsatz-abgeschlossen {
  background: #39b86e;
}

.legenden-trenner {
  height: 1px;

  margin: 8px 0 !important;

  background: #41515c;
}
</style>