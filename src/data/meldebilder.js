import {
  findeStichwortNachId,
} from './stichwortKatalog.js'


export const meldebilder = [
    {
  id: 'person-in-hoehe',

  name: 'Person in Höhe',

  stichwortIds: {
    B: null,

    T: 'THL-20-13',

    ABC: null,
    R: null,
    SON: null,
    INF: null,
  },

  aktiv: true,
  systemEintrag: true,
},
  {
    id: 'zimmerbrand',
    name: 'Zimmerbrand',

    stichwortIds: {
      B: 'B-11-23',
      T: null,
      ABC: null,
      R: null,
      SON: null,
      INF: null,
    },

    aktiv: true,
    systemEintrag: true,
  },

  {
    id: 'bewusstlose-person',
    name: 'Bewusstlose Person',

    stichwortIds: {
      B: null,
      T: null,
      ABC: null,
      R: 'RD-10-10',
      SON: null,
      INF: null,
    },

    aktiv: true,
    systemEintrag: true,
  },
]


export function findeMeldebildNachId(id) {
  return (
    meldebilder.find(
      (meldebild) =>
        meldebild.id === id,
    ) ?? null
  )
}


export function findeMeldebildNachName(name) {
  const suchtext =
    (name ?? '')
      .trim()
      .toLowerCase()

  return (
    meldebilder.find(
      (meldebild) =>
        meldebild.name
          .toLowerCase() ===
        suchtext,
    ) ?? null
  )
}


export function loeseMeldebildAuf(
  meldebild,
) {
  if (!meldebild) {
    return null
  }

  const stichwoerter = {}

  for (
    const [
      bereich,
      stichwortId,
    ]
    of Object.entries(
      meldebild.stichwortIds,
    )
  ) {
    stichwoerter[bereich] =
      stichwortId
        ? findeStichwortNachId(
            stichwortId,
          )
        : null
  }

  return {
    ...meldebild,
    stichwoerter,
  }
}