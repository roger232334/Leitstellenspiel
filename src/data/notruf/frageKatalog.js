import { medizinFrageGruppen } from './medizin.js'

// Weitere Kategorien mit derselben Struktur ergänzen: Gruppe { id, name, fragen }.
export const frageKatalog = {
  medizin: medizinFrageGruppen,
}

export function katalogFrage(kategorie, frageId) {
  if (!Object.hasOwn(frageKatalog, kategorie)) return null
  return frageKatalog[kategorie]?.flatMap(gruppe => gruppe.fragen).find(frage => frage.id === frageId) ?? null
}
