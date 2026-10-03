<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { leafletFuerFenster } from '../services/fensterLeaflet.js'
import { positionPruefen } from '../data/objektVerwaltung.js'
import 'leaflet/dist/leaflet.css'
const props = defineProps({ position: { type: Object, default: null } })
const emit = defineEmits(['update:position'])
const element = ref(null), fehler = ref('')
let karte, marker, L, observer, beendet = false
function zeichnen() {
  if (!karte) return
  let p
  try { p = positionPruefen(props.position) } catch { return }
  if (!p) { marker?.remove(); marker = null; return }
  if (!marker) {
    marker = L.marker([p.lat, p.lng], { draggable: true, icon: L.divIcon({ className: 'poi-position-marker', html: '<span aria-hidden="true">📍</span>', iconSize: [28, 32], iconAnchor: [14, 30] }) }).addTo(karte)
    marker.on('dragend', () => { const { lat, lng } = marker.getLatLng().wrap(); emit('update:position', { lat, lng }) })
  } else marker.setLatLng([p.lat, p.lng])
  karte.panTo([p.lat, p.lng])
}
onMounted(async () => {
  try {
    L = await leafletFuerFenster(element.value.ownerDocument.defaultView)
    if (beendet) return
    karte = L.map(element.value).setView([49.0134, 12.1016], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(karte).on('tileerror', () => { fehler.value = 'Kartenkacheln konnten nicht geladen werden. Koordinaten können weiterhin manuell eingegeben werden.' })
    karte.on('click', e => { const { lat, lng } = e.latlng.wrap(); emit('update:position', { lat, lng }) })
    observer = new ResizeObserver(() => karte?.invalidateSize())
    observer.observe(element.value)
    zeichnen()
  } catch { fehler.value = 'Karte nicht verfügbar. Bitte Koordinaten manuell eingeben.' }
})
watch(() => props.position, zeichnen, { deep: true })
onBeforeUnmount(() => { beendet = true; observer?.disconnect(); karte?.remove(); karte = null })
</script>
<template>
  <div><div ref="element" class="positionskarte" aria-label="Objektposition: zum Setzen in die Karte klicken" />
    <small>Position durch Kartenklick setzen oder den Marker verschieben.</small>
    <p v-if="fehler" role="status">{{ fehler }}</p>
  </div>
</template>
<style scoped>
.positionskarte { height: 280px; width: 100%; border: 1px solid #a9b5be; z-index: 0; }
:deep(.poi-position-marker) { font-size: 26px; }
small, p { color: #52636e; }
</style>
