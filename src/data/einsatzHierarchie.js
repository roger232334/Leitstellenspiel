export function haupteinsaetze(einsaetze) {
  return einsaetze.filter(e => e.typ !== 'unter' && e.parentId == null)
}

export function haupteinsatzZu(einsaetze, einsatz) {
  if (!einsatz) return null
  if (einsatz.parentId != null) return einsaetze.find(e => e.id === einsatz.parentId) || null
  return einsatz.typ === 'unter' ? null : einsatz
}

export function untereinsaetzeZu(einsaetze, haupteinsatz) {
  return haupteinsatz ? einsaetze.filter(e => e.typ === 'unter' && e.parentId === haupteinsatz.id) : []
}

export function gemeinsameHinweiseAendern(einsaetze, id, text) {
  const einsatz = einsaetze.find(e => e.id === id)
  if (!einsatz || typeof text !== 'string') return
  const haupt = haupteinsatzZu(einsaetze, einsatz) || einsatz
  // Auch die gespeicherten Kopien für andere Ansichten aktuell halten.
  for (const eintrag of [haupt, ...untereinsaetzeZu(einsaetze, haupt)]) {
    eintrag.bemerkung = text
    if (eintrag.erfassung) eintrag.erfassung.notiz = text
  }
}
