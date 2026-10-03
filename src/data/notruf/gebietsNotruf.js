import { zufaelligeGebietsAdresse } from '../gebiet.js'

export function notrufImGebiet(vorlagen, daten, zufall = Math.random) {
  const adresse = zufaelligeGebietsAdresse(daten, zufall)
  if (!adresse || !vorlagen.length) return null
  const s = structuredClone(vorlagen[Math.floor(zufall() * vorlagen.length)])
  s.position = { ...adresse.position }
  s.gebietId = adresse.gebietId
  Object.assign(s.daten, { strasse: adresse.strasse, hausnummer: adresse.hausnummer, ort: adresse.ort, ortsteil: adresse.ortsteil, gebietId: adresse.gebietId })
  // Nur Legacy-Freitextantworten tragen noch Adressen in ihren Textvorlagen.
  for (const a of s.antworten ?? []) if (a.schluesselwoerter.includes('adresse')) a.antwort = `Der Einsatzort ist ${adresse.strasse} ${adresse.hausnummer}, ${adresse.ortsteil}, ${adresse.ort}.`
  return s
}
