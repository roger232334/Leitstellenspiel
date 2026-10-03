import { belegteFachdienste, tableauFachdienst } from './fachdienste.js'
export const TABLEAU_KEY = 'leitstellensimulator-fahrzeugtableau-v1'

export function neueTableauSeite(name = 'Neue Seite') {
  return { id: crypto.randomUUID(), name, spalten: 8, zeilen: 8, positionen: [] }
}

export function standardTableau(fahrzeuge) {
  const dienste = belegteFachdienste(fahrzeuge)
  const seiten = dienste.map(d => neueTableauSeite(d.name))
  for (const [index, seite] of seiten.entries()) {
    const liste = fahrzeuge.filter(f => tableauFachdienst(f) === dienste[index].id)
    seite.zeilen = Math.max(8, Math.ceil(liste.length / seite.spalten))
    seite.positionen = liste.map((f, i) => ({ fahrzeugId: f.id, spalte: i % seite.spalten, zeile: Math.floor(i / seite.spalten) }))
  }
  return { version: 1, aktiveSeiteId: seiten[0].id, seiten }
}

export function tableauLaden(text, fahrzeuge) {
  if (!text) return standardTableau(fahrzeuge)
  const daten = JSON.parse(text)
  if (daten?.version !== 1 || !Array.isArray(daten.seiten) || !daten.seiten.length) throw new Error('Ungültiges Tableau')
  const ids = new Set()
  for (const s of daten.seiten) {
    if (typeof s.id !== 'string' || ids.has(s.id) || typeof s.name !== 'string' || !s.name.trim() ||
      !Number.isInteger(s.spalten) || s.spalten < 2 || s.spalten > 20 ||
      !Number.isInteger(s.zeilen) || s.zeilen < 2 || s.zeilen > 50 || !Array.isArray(s.positionen)) throw new Error('Ungültige Seite')
    ids.add(s.id)
    const fahrzeugIds = new Set()
    const zellen = new Set()
    s.positionen = s.positionen.filter(p => fahrzeuge.some(f => f.id === p.fahrzeugId))
    for (const p of s.positionen) {
      const key = `${p.spalte}:${p.zeile}`
      if (!Number.isInteger(p.spalte) || !Number.isInteger(p.zeile) || p.spalte < 0 || p.spalte >= s.spalten ||
        p.zeile < 0 || p.zeile >= s.zeilen || fahrzeugIds.has(p.fahrzeugId) || zellen.has(key)) throw new Error('Ungültige Position')
      fahrzeugIds.add(p.fahrzeugId)
      zellen.add(key)
    }
  }
  if (!ids.has(daten.aktiveSeiteId)) daten.aktiveSeiteId = daten.seiten[0].id
  return daten
}

export function fahrzeugPlatzieren(seite, fahrzeugId, spalte, zeile) {
  if (spalte < 0 || spalte >= seite.spalten || zeile < 0 || zeile >= seite.zeilen) return false
  const bisher = seite.positionen.find(p => p.fahrzeugId === fahrzeugId)
  const belegt = seite.positionen.find(p => p.spalte === spalte && p.zeile === zeile)
  if (belegt && !bisher) return false
  if (belegt && belegt !== bisher) {
    belegt.spalte = bisher.spalte
    belegt.zeile = bisher.zeile
  }
  if (bisher) Object.assign(bisher, { spalte, zeile })
  else seite.positionen.push({ fahrzeugId, spalte, zeile })
  return true
}

export function rasterAendern(seite, spalten, zeilen) {
  if (!Number.isInteger(spalten) || !Number.isInteger(zeilen) || spalten < 2 || spalten > 20 || zeilen < 2 || zeilen > 50 ||
    seite.positionen.some(p => p.spalte >= spalten || p.zeile >= zeilen)) return false
  Object.assign(seite, { spalten, zeilen })
  return true
}
