import leaflet from 'leaflet'
import leafletUrl from 'leaflet/dist/leaflet.js?url'
const instanzen = new WeakMap()

// Leaflet bindet Mausereignisse an sein eigenes Dokument. Ein ausgelagertes
// Kartenfenster benötigt deshalb eine dort geladene Bibliotheksinstanz.
export function leafletFuerFenster(fenster) {
  if (fenster === window) return Promise.resolve(leaflet)
  if (instanzen.has(fenster)) return instanzen.get(fenster)
  const geladen = new Promise((resolve, reject) => {
    const script = fenster.document.createElement('script')
    script.src = new URL(leafletUrl, window.location.href).href
    script.onload = () => resolve(fenster.L)
    script.onerror = () => { instanzen.delete(fenster); script.remove(); reject(new Error('Kartenbibliothek konnte nicht geladen werden')) }
    fenster.document.head.append(script)
  })
  instanzen.set(fenster, geladen)
  return geladen
}
