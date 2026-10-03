import { ausruestungsKatalog } from './ausruestungsKatalog.js'
import { fahrzeugArtZu } from '../fahrzeugArten.js'

// Anpassbare Beispielvorlagen für die Simulation, keine DIN-/Normzusicherung.
const loeschBasis = ['feuerloeschpumpe', 'schnellangriff', 'beleuchtung', 'stromerzeuger', 'kettensaege', 'sanitaetsmaterial']
const hlfBasis = [...loeschBasis, 'schneidSpreizwerkzeug', 'tuerOeffnungsset', 'gasExWarner', 'waermebildkamera', 'belueftungsgeraet', 'wasserschadenausruestung']
const vorlagen = {
  HLF20: [1600, 120, 4, hlfBasis], HLF10: [1000, 60, 4, hlfBasis],
  HLF: [1600, 120, 4, hlfBasis], LF: [1000, 60, 4, loeschBasis],
  TLF: [2000, 120, 2, ['feuerloeschpumpe', 'schnellangriff']],
  TLF2000: [2000, 120, 2, ['feuerloeschpumpe', 'schnellangriff']],
  TLF3000: [3000, 120, 2, ['feuerloeschpumpe', 'schnellangriff']],
  TLF4000: [4000, 120, 2, ['feuerloeschpumpe', 'schnellangriff']],
  RW: [0, 0, 2, ['schneidSpreizwerkzeug', 'kettensaege', 'hebekissen', 'beleuchtung', 'stromerzeuger']],
  RTW: [0, 0, 0, ['notfallversorgung', 'patiententransport', 'sanitaetsmaterial']],
  KTW: [0, 0, 0, ['krankentransport', 'patiententransport', 'sanitaetsmaterial']],
  NEF: [0, 0, 0, ['notfallversorgung', 'sanitaetsmaterial']],
}
export function leereBeladung() {
  return { version: 1, ressourcen: Object.fromEntries(ausruestungsKatalog.filter(e => e.typ === 'number').map(e => [e.id, 0])),
    ausruestung: Object.fromEntries(ausruestungsKatalog.filter(e => e.typ === 'boolean').map(e => [e.id, false])) }
}
export function standardbeladungFuer(fahrzeug) {
  const art = fahrzeugArtZu(fahrzeug.fahrzeugArtId)
  const typ = art?.kurz.toUpperCase() || fahrzeug.typ?.toUpperCase()
  // Exakte Vorlage zuerst; ältere/grobe Klassen bleiben kompatibel.
  const vorlage = vorlagen[typ] || vorlagen[art?.basis]
  const b = leereBeladung()
  if (vorlage) {
    const [wasserLiter, schaummittelLiter, atemschutzgeraete, ausruestung] = vorlage
    Object.assign(b.ressourcen, { wasserLiter, schaummittelLiter, atemschutzgeraete })
    for (const id of ausruestung) b.ausruestung[id] = true
  }
  return b
}
