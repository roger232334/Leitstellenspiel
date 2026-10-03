import { findeRdVerknuepfung } from './rdVerknuepfungen.js'

export function mitRdVerknuepfung(stichwoerter = {}) {
  const verknuepfung = [stichwoerter.B, stichwoerter.T, stichwoerter.ABC]
    .filter(Boolean).map(findeRdVerknuepfung).find(Boolean)
  const rdText = verknuepfung?.verknuepfungNeu || null
  return {
    stichwoerter: {
      B: null, T: null, ABC: null, R: null, SON: null, INF: null,
      ...stichwoerter,
      R: stichwoerter.R || (rdText ? {
        id: `verknuepfung-${verknuepfung.id}`,
        bereich: 'RD', stichwort: rdText,
        verknuepfungId: verknuepfung.id,
      } : null),
    },
    rdVerknuepfung: rdText,
  }
}

export function katalogStichwoerter(eintrag) {
  const bereich = { B: 'B', THL: 'T', ABC: 'ABC', RD: 'R', SON: 'SON', INF: 'INF' }[eintrag?.bereich]
  return mitRdVerknuepfung(bereich ? { [bereich]: eintrag } : {})
}

export const stichwortFelder = [
  { id: 'ab', label: 'STW A-B', bereiche: ['ABC', 'B'] },
  { id: 't', label: 'STW T', bereiche: ['T'] },
  { id: 'r', label: 'STW R', bereiche: ['R'] },
  { id: 's', label: 'STW S', bereiche: ['SON', 'INF'] },
]

export function stichwortFeldText(stichwoerter, bereiche) {
  return bereiche.map(b => stichwoerter?.[b])
    .filter(Boolean).map(e => typeof e === 'string' ? e : e.stichwort)
    .filter(Boolean).join(' / ')
}
