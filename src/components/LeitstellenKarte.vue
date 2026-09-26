<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  fahrzeuge: {
    type: Array,
    required: true,
  },
})

const kartenElement = ref(null)

let karte = null
let fahrzeugEbene = null

// --------------------------------------------------
// DEMO-WACHEN
//
// Die Positionen sind erstmal nur für unseren
// Prototyp gedacht.
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
// DEMO-FAHRZEUGPOSITIONEN
//
// Momentan bleibt jedes Fahrzeug an seiner
// Startposition. In einer späteren Version
// bewegen wir sie über echte Straßen.
// --------------------------------------------------

const fahrzeugPositionen = {
  1: [49.015, 12.0819],
  2: [49.0145, 12.0831],
  3: [49.0127, 12.1028],
  4: [49.0202, 12.1127],
}

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

function zeichneWachen() {
  wachen.forEach((wache) => {
    const marker = L.circleMarker(wache.position, {
      radius: 13,
      color: '#dce5eb',
      weight: 3,
      fillColor:
        wache.typ === 'Feuerwehr'
          ? '#ba454b'
          : '#357ca5',
      fillOpacity: 0.9,
    })

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

function zeichneFahrzeuge() {
  if (!fahrzeugEbene) {
    return
  }

  fahrzeugEbene.clearLayers()

  props.fahrzeuge.forEach((fahrzeug) => {
    const position =
      fahrzeugPositionen[fahrzeug.id]

    if (!position) {
      return
    }

    const farbe = statusFarbe(
      fahrzeug.status,
    )

    const marker = L.circleMarker(position, {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: farbe,
      fillOpacity: 1,
    })

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

onMounted(() => {
  karte = L.map(kartenElement.value, {
    zoomControl: true,
  }).setView(
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

  fahrzeugEbene =
    L.layerGroup().addTo(karte)

  zeichneWachen()
  zeichneFahrzeuge()

  setTimeout(() => {
    karte.invalidateSize()
  }, 100)
})

watch(
  () =>
    props.fahrzeuge.map((fahrzeug) => ({
      id: fahrzeug.id,
      status: fahrzeug.status,
      funkrufname: fahrzeug.funkrufname,
      typ: fahrzeug.typ,
    })),
  () => {
    zeichneFahrzeuge()
  },
  {
    deep: true,
  },
)

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
      <strong>Fahrzeugstatus</strong>

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

      <div>
        <span class="legende status7"></span>
        Status 7
      </div>

      <div>
        <span class="legende status8"></span>
        Status 8
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

  min-width: 125px;

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

.status7 {
  background: #8b65cc;
}

.status8 {
  background: #9b68ad;
}
</style>