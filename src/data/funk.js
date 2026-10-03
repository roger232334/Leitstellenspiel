import { kommunikationsBeitrag } from './kommunikation.js'

// Übergang zum späteren Gruppenkatalog: bestehende Fahrzeug-Stammdaten verwenden.
export function fahrzeugFunkgruppeId(fahrzeug) {
  const name = fahrzeug?.funkgruppe?.trim()
  return name ? `funk:${encodeURIComponent(name.normalize('NFC').toLocaleLowerCase('de'))}` : null
}

export function funkgruppenAusFahrzeugen(fahrzeuge) {
  const gruppen = new Map()
  for (const f of fahrzeuge) {
    const id = fahrzeugFunkgruppeId(f)
    if (id && !gruppen.has(id)) gruppen.set(id, { id, name: f.funkgruppe.trim() })
  }
  return [...gruppen.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function funkspruchErzeugen({ gruppeId, gruppen, fahrzeug = null, text, zeit }) {
  const gruppe = gruppen.find(g => g.id === gruppeId)
  if (!gruppe) throw new Error('Bitte eine gültige Funkgruppe auswählen.')
  if (fahrzeug && fahrzeugFunkgruppeId(fahrzeug) !== gruppe.id) throw new Error('Das Fahrzeug gehört nicht zur gewählten Funkgruppe.')
  const absender = fahrzeug ? fahrzeug.funkrufnameLang || fahrzeug.funkrufname : 'Leitstelle'
  return {
    ...kommunikationsBeitrag({ kanal: 'funk', rolle: fahrzeug ? 'funkstelle' : 'disponent', absender, text, zeit }),
    funkgruppeId: gruppe.id, funkgruppeName: gruppe.name, fahrzeugId: fahrzeug?.id ?? null,
  }
}
