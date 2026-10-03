import { objektPruefen } from './objektVerwaltung.js'

// Explicit adoption adapter, not an automatic import into user-owned POIs.
// Same OSM ID returns the existing user version, including edits/deactivation.
export function osmPoiUebernahmeVorbereiten(poi, ort, eigeneObjekte = []) {
  if (!poi?.id?.startsWith('osm:') || !ort || poi.gebietId !== ort.id) throw new Error('OSM-POI und Ortschaft passen nicht zusammen.')
  const vorhanden = eigeneObjekte.find(o => o.id === poi.id)
  if (vorhanden) return structuredClone(vorhanden)
  if (!poi.name?.trim()) throw new Error('Dieser OSM-POI hat keinen Namen. Vor der Übernahme bitte einen Namen ergänzen.')
  return objektPruefen({ id: poi.id, quelle: 'osm', name: poi.name, typId: poi.typId, aktiv: true, position: poi.position,
    adresse: { strasse: poi.strasse, hausnummer: poi.hausnummer, postleitzahl: poi.postleitzahl, ort: ort.ortsteil, gemeinde: ort.gemeinde },
    bemerkung: '' })
}
