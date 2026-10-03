// Rein synthetische Testgrenzen; kein produktiver Ortsbestand.
import { GEBIET_KEY } from '../src/data/gebiet.js'
export function testGebiet() {
  return { version: 1, ortschaften: [{ id: 'test-ort', bundesland: 'Bayern', kreisId: 'stadt-regensburg', gemeinde: 'Regensburg', ortsteil: 'Nord', postleitzahl: '', aktiv: true, einsatzaufkommenFaktor: 1,
    geometry: { type: 'Polygon', coordinates: [[[11.9,48.9],[12.2,48.9],[12.2,49.1],[11.9,49.1],[11.9,48.9]]] } }],
    adressen: [{ id: 'test-adresse', gebietId: 'test-ort', strasse: 'Teststraße', hausnummer: '1', position: { lat: 49, lng: 12 } }] }
}
export function installTestGebiet() {
  const original = globalThis.localStorage
  const map = new Map([[GEBIET_KEY, JSON.stringify(testGebiet())]])
  globalThis.localStorage = { getItem: key => map.get(key) ?? null, setItem: (key, wert) => map.set(key, wert) }
  return () => { globalThis.localStorage = original }
}
