import { gebietLaden } from '../data/gebiet.js'
import { osmStammdaten } from '../data/osmStammdaten.js'

export const suchWoerter = text => [...new Set(String(text ?? '').toLocaleLowerCase('de').replaceAll('ß', 'ss').normalize('NFD').replace(/\p{M}/gu, '').match(/[\p{L}\p{N}]+/gu) || [])]

// Sorted token dictionary + posting lists. Prefix lookup uses binary search, not a record scan.
export function erstelleSuchindex(eintraege, textFuer) {
  const index = new Map()
  eintraege.forEach((e, i) => {
    for (const wort of suchWoerter(textFuer(e))) {
      if (!index.has(wort)) index.set(wort, [])
      index.get(wort).push(i)
    }
  })
  const woerter = [...index.keys()].sort()
  function praefix(p) {
    let l = 0, r = woerter.length
    while (l < r) { const m = (l + r) >>> 1; if (woerter[m] < p) l = m + 1; else r = m }
    const ids = new Set()
    const zahl = /^\d/.test(p)
    for (let i = l; i < woerter.length && woerter[i].startsWith(p); i++) {
      // House number 1 must not geocode to 12. Text prefixes remain partial.
      if (!zahl || woerter[i] === p) for (const id of index.get(woerter[i])) ids.add(id)
    }
    return ids
  }
  return (text, erlaubt = () => true, limit = 8) => {
    const tokens = suchWoerter(text)
    if (!tokens.length) return []
    const sets = tokens.map(praefix).sort((a, b) => a.size - b.size)
    const result = []
    for (const id of sets[0]) {
      if (sets.every(s => s.has(id)) && erlaubt(eintraege[id])) result.push(eintraege[id])
      if (result.length >= limit) break
    }
    return result
  }
}

let cache
export function lokalSuchen(text, { feld = 'alle', ort = '', limit = 8 } = {}) {
  const daten = gebietLaden()
  const basis = osmStammdaten()
  if (cache?.basis !== basis || cache?.adressen !== daten.adressen || cache?.orte !== daten.ortschaften) {
    const orte = new Map(daten.ortschaften.map(o => [o.id, o]))
    const textFuer = e => { const o = orte.get(e.gebietId); return [e.strasse, e.hausnummer, e.name, e.postleitzahl, e.adressOrt, e.ortsangabe, o?.postleitzahl, o?.gemeinde, o?.ortsteil, ...(o?.aliases || [])].filter(Boolean).join(' ') }
    const adressen = daten.adressen.map(a => ({ ...a, art: 'adresse' }))
    const strassen = (basis?.strassen || []).map(s => ({ ...s, strasse: s.name, art: 'strasse' }))
    const ortsliste = daten.ortschaften.map(o => ({ id: o.id, gebietId: o.id, position: o.position, name: o.ortsteil, art: 'ort' }))
    cache = { basis, adressen: daten.adressen, orte: daten.ortschaften, orteIndex: orte,
      adresse: erstelleSuchindex([...adressen, ...strassen, ...ortsliste], textFuer),
      strasse: erstelleSuchindex([...strassen, ...adressen], textFuer), ort: erstelleSuchindex(ortsliste, textFuer),
      ortDirekt: erstelleSuchindex(ortsliste, e => [e.name, ...(orte.get(e.gebietId)?.aliases || [])].join(' ')) }
  }
  const aktiv = new Set(daten.ortschaften.filter(o => o.aktiv).map(o => o.id))
  const suchen = feld === 'strasse' ? cache.strasse : ['ort', 'ortsteil'].includes(feld) ? cache.ort : cache.adresse
  const q = [text, ort].filter(Boolean).join(' '), erlaubt = e => aktiv.has(e.gebietId)
  const direkt = feld === 'strasse' ? [] : cache.ortDirekt(q, erlaubt, limit)
  const treffer = [...new Map([...direkt, ...suchen(q, erlaubt, limit)].map(e => [e.id, e])).values()].slice(0, limit)
  return treffer.map(e => {
    const o = cache.orteIndex.get(e.gebietId)
    const strasse = e.strasse || '', hausnummer = e.hausnummer || ''
    const plz = e.postleitzahl || o.postleitzahl || ''
    const label = [strasse, hausnummer].filter(Boolean).join(' ') || e.adressOrt || o.ortsteil
    const detail = [...new Set([plz, o.ortsteil, o.gemeinde].filter(Boolean))].join(', ')
    return { id: e.id, gebietId: e.gebietId, art: e.art, quelle: 'lokal', label, detail, displayName: [...new Set([label, detail])].join(', '),
      objekt: '', strasse, hausnummer, ort: o.gemeinde, gemeinde: o.gemeinde, ortsteil: o.ortsteil, postleitzahl: plz,
      lat: e.position?.lat, lng: e.position?.lng }
  })
}
