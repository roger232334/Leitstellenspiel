import { tableauLaden as altesTableauLaden } from './fahrzeugTableau.js'
import { belegteFachdienste, tableauFachdienst } from './fachdienste.js'
export const WACHEN_KEY = 'leitstellensimulator-wachentableau-v2'
export const alteTableauKennung = 'leitstellensimulator-fahrzeugtableau-v1'
export const neueWache = (name, spalte, zeile) => ({ id: crypto.randomUUID(), name, spalte, zeile, fahrzeugIds: [] })
export const neueSeite = (name = 'Neue Seite') => ({ id: crypto.randomUUID(), name, spalten: 4, zeilen: 4, wachen: [] })

export function standardWachen(fahrzeuge) {
  const dienste = belegteFachdienste(fahrzeuge)
  const seiten = dienste.map(d => neueSeite(d.name))
  seiten.forEach((s, i) => {
    const w = neueWache(dienste[i].wache, 0, 0)
    w.fahrzeugIds = fahrzeuge.filter(f => tableauFachdienst(f) === dienste[i].id).map(f => f.id)
    s.wachen.push(w)
  })
  return { version: 2, aktiveSeiteId: seiten[0].id, seiten }
}

export function wachenLaden(text, alt, fahrzeuge) {
  if (!text && !alt) return standardWachen(fahrzeuge)
  let daten
  if (!text) {
    const vorher = altesTableauLaden(alt, fahrzeuge)
    daten = { version: 2, aktiveSeiteId: vorher.aktiveSeiteId, seiten: vorher.seiten.map(s => ({
      id: s.id, name: s.name, spalten: s.spalten, zeilen: s.zeilen,
      wachen: s.positionen.map((p, i) => ({ ...neueWache(`Wache ${i + 1}`, p.spalte, p.zeile), fahrzeugIds: [p.fahrzeugId] })),
    })) }
  } else daten = JSON.parse(text)
  if (daten?.version !== 2 || !Array.isArray(daten.seiten) || !daten.seiten.length) throw new Error('Ungültiges Tableau')
  const seitenIds = new Set()
  for (const s of daten.seiten) {
    if (!s || typeof s.id !== 'string' || seitenIds.has(s.id) || typeof s.name !== 'string' || !s.name.trim() ||
      !Number.isInteger(s.spalten) || s.spalten < 1 || s.spalten > 20 || !Number.isInteger(s.zeilen) || s.zeilen < 1 || s.zeilen > 50 || !Array.isArray(s.wachen)) throw new Error('Ungültige Seite')
    seitenIds.add(s.id)
    const ids = new Set(), zellen = new Set(), fahrzeugIds = new Set()
    for (const w of s.wachen) {
      if (!w || typeof w.id !== 'string' || ids.has(w.id) || typeof w.name !== 'string' || !w.name.trim() || !Array.isArray(w.fahrzeugIds) ||
        !Number.isInteger(w.spalte) || !Number.isInteger(w.zeile) || w.spalte < 0 || w.spalte >= s.spalten || w.zeile < 0 || w.zeile >= s.zeilen || zellen.has(`${w.spalte}:${w.zeile}`)) throw new Error('Ungültige Wache')
      ids.add(w.id); zellen.add(`${w.spalte}:${w.zeile}`)
      w.fahrzeugIds = w.fahrzeugIds.filter(id => fahrzeuge.some(f => f.id === id))
      for (const id of w.fahrzeugIds) {
        if (fahrzeugIds.has(id)) throw new Error('Doppelte Fahrzeugzuordnung')
        fahrzeugIds.add(id)
      }
    }
  }
  if (!seitenIds.has(daten.aktiveSeiteId)) daten.aktiveSeiteId = daten.seiten[0].id
  return daten
}

export function fahrzeugInWache(seite, id, wacheId, vorId = null) {
  const ziel = seite.wachen.find(w => w.id === wacheId)
  if (!ziel || vorId === id) return false
  for (const w of seite.wachen) w.fahrzeugIds = w.fahrzeugIds.filter(f => f !== id)
  const index = ziel.fahrzeugIds.indexOf(vorId)
  ziel.fahrzeugIds.splice(index < 0 ? ziel.fahrzeugIds.length : index, 0, id)
  return true
}

export function wacheVerschieben(seite, id, spalte, zeile) {
  const w = seite.wachen.find(w => w.id === id)
  if (!w || !Number.isInteger(spalte) || !Number.isInteger(zeile) || spalte < 0 || spalte >= seite.spalten || zeile < 0 || zeile >= seite.zeilen) return false
  const andere = seite.wachen.find(a => a.spalte === spalte && a.zeile === zeile)
  if (andere && andere !== w) Object.assign(andere, { spalte: w.spalte, zeile: w.zeile })
  Object.assign(w, { spalte, zeile })
  return true
}

export function wachenRasterAendern(seite, spalten, zeilen) {
  if (!Number.isInteger(spalten) || !Number.isInteger(zeilen) || spalten < 1 || spalten > 20 || zeilen < 1 || zeilen > 50 || seite.wachen.some(w => w.spalte >= spalten || w.zeile >= zeilen)) return false
  Object.assign(seite, { spalten, zeilen })
  return true
}
