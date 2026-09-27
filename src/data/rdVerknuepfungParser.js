// rdVerknuepfungParser.js
//
// Grundlage:
// - Tabellenblatt "ABeK RDB R FW", Spalte "Verknüpfung RD NEU"
// - RD-Stufen aus "ABeK RDB R RD", Spalte
//   "Vorschlag für die Integrierte Leitstelle Regensburg"
// - Sonderfälle Wassernot aus "ABeK RDB R WR"
//
// Der Parser deckt alle 32 unterschiedlichen, aktuell in
// "Verknüpfung RD NEU" vorkommenden Texte ab.

export const unterstuetzteRdVerknuepfungen = [
  '2 RTW + ELRD',
  'RD 2 + ELRD',
  'RD 4 + SanEL',
  'RD 3 + SanEL + Fachberater CBRN(E)',
  'RD 3',
  'RD 1 + ELRD',
  'RD 0 + ELRD',
  'RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter',
  'RD 0',
  'Wassernot 0',
  'RD 4 + SanEL + SEG Beh',
  'RD 4 + SanEL + WR',
  'ELRD',
  'MANV 10-15',
  'RD 3 + WR',
  'RD 3 + SanEL',
  'RD 5',
  'RD 4',
  'RD 0 + ELRD + EL-BW',
  'RD 0 + ELRD + EL-WR',
  '2 RTW + ELRD + WR',
  'RD 1 + ELRD + EL-BW',
  'RD Amok',
  'RD 2 + ELRD + EL-BW',
  'RD 1 + ELRD + BW',
  'RD 2 + ELRD + BW',
  'MANV 10-15 + SEG Beh + SEG Betr',
  'Wassernot 3',
  'MANV 16-25',
  'SanEL',
  'RD 4 + SanEL + Fachberater CBRN(E)',
  'RD 1',
]

function erstelleAnforderung(
  typ,
  anzahl = 1,
  optionen = {},
) {
  return {
    typ,
    anzahl,

    bezeichnung:
      optionen.bezeichnung ??
      typ,

    bereich:
      optionen.bereich ??
      'RD',

    alternativeTypen:
      optionen.alternativeTypen ??
      [],

    grund:
      optionen.grund ??
      typ,

    platzhalter:
      optionen.platzhalter ??
      false,

    variabel:
      optionen.variabel ??
      false,

    stichwort:
      optionen.stichwort ??
      null,

    unbekannt:
      false,
  }
}


function unbekannteAnforderung(
  text,
) {
  return {
    typ: null,
    anzahl: 0,
    bezeichnung: text,
    bereich: null,
    alternativeTypen: [],
    grund: text,
    platzhalter: false,
    variabel: false,
    stichwort: null,
    unbekannt: true,
  }
}


function normalisiereToken(text) {
  return String(text ?? '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}


// --------------------------------
// RD-STUFEN
// --------------------------------

function rd0() {
  return [
    erstelleAnforderung(
      'REF',
      1,
      {
        grund: 'RD 0',
      },
    ),
  ]
}


function rd1() {
  return [
    erstelleAnforderung(
      'RTW',
      1,
      {
        grund: 'RD 1',
      },
    ),
  ]
}


function rd2() {
  return [
    erstelleAnforderung(
      'RTW',
      1,
      {
        grund: 'RD 2',
      },
    ),

    // Die Tabelle fordert "1 NA".
    // In unserem Simulator kann diese
    // Funktion aktuell durch ein NEF
    // oder ein Einsatzmittel vom Typ NA
    // erfüllt werden.
    erstelleAnforderung(
      'NA',
      1,
      {
        bezeichnung: 'NA',
        alternativeTypen: [
          'NEF',
          'NA',
        ],
        grund: 'RD 2',
      },
    ),
  ]
}


function rd3() {
  return [
    erstelleAnforderung(
      'RTW',
      2,
      {
        grund: 'RD 3',
      },
    ),

    erstelleAnforderung(
      'NA',
      1,
      {
        bezeichnung: 'NA',
        alternativeTypen: [
          'NEF',
          'NA',
        ],
        grund: 'RD 3',
      },
    ),

    erstelleAnforderung(
      'ELRD',
      1,
      {
        grund: 'RD 3',
      },
    ),
  ]
}


function rd4() {
  return [
    erstelleAnforderung(
      'RTW',
      4,
      {
        grund: 'RD 4',
      },
    ),

    erstelleAnforderung(
      'NA',
      1,
      {
        bezeichnung: 'NA',
        alternativeTypen: [
          'NEF',
          'NA',
        ],
        grund: 'RD 4',
      },
    ),

    erstelleAnforderung(
      'ELRD',
      1,
      {
        grund: 'RD 4',
      },
    ),

    // Laut Tabelle Platzhalter in der
    // Dispoliste; erst disponieren, wenn
    // die regulären Rettungsmittel nicht
    // ausreichen.
    erstelleAnforderung(
      'SEG-Transport',
      1,
      {
        grund:
          'RD 4 – Platzhalter',
        platzhalter: true,
      },
    ),
  ]
}


function rd5() {
  return [
    erstelleAnforderung(
      'RTW',
      5,
      {
        grund: 'RD 5',
      },
    ),

    erstelleAnforderung(
      'NA',
      3,
      {
        bezeichnung: 'NA',
        alternativeTypen: [
          'NEF',
          'NA',
        ],
        grund: 'RD 5',
      },
    ),

    erstelleAnforderung(
      'SanEL',
      1,
      {
        grund: 'RD 5',
      },
    ),

    erstelleAnforderung(
      'ELRD',
      1,
      {
        grund: 'RD 5',
      },
    ),

    erstelleAnforderung(
      'SEG-Transport',
      1,
      {
        grund: 'RD 5',
      },
    ),

    erstelleAnforderung(
      'SEG-Transport',
      1,
      {
        grund:
          'RD 5 – zusätzlicher Platzhalter',
        platzhalter: true,
      },
    ),

    erstelleAnforderung(
      'KIT',
      1,
      {
        grund: 'RD 5',
      },
    ),
  ]
}


// --------------------------------
// MANV
// --------------------------------

function manv10Bis15() {
  return [
    erstelleAnforderung(
      'RTW',
      10,
      {
        grund: 'MANV 10-15',
      },
    ),

    erstelleAnforderung(
      'NA',
      5,
      {
        bezeichnung: 'NA',
        alternativeTypen: [
          'NEF',
          'NA',
        ],
        grund: 'MANV 10-15',
      },
    ),

    erstelleAnforderung(
      'SanEL',
      1,
      {
        grund: 'MANV 10-15',
      },
    ),

    erstelleAnforderung(
      'ELRD',
      1,
      {
        grund: 'MANV 10-15',
      },
    ),

    erstelleAnforderung(
      'SEG-Transport',
      1,
      {
        grund: 'MANV 10-15',
      },
    ),

    // In der Tabelle steht zusätzlich
    // "X SEG-Transport". Die konkrete
    // Anzahl ist nicht fest vorgegeben.
    erstelleAnforderung(
      'SEG-Transport',
      0,
      {
        grund:
          'MANV 10-15 – zusätzlicher variabler Bedarf',
        variabel: true,
      },
    ),

    erstelleAnforderung(
      'KIT',
      1,
      {
        grund: 'MANV 10-15',
      },
    ),
  ]
}


function manv16Bis25() {
  return [
    erstelleAnforderung(
      'RTW',
      20,
      {
        grund: 'MANV 16-25',
      },
    ),

    erstelleAnforderung(
      'NA',
      10,
      {
        bezeichnung: 'NA',
        alternativeTypen: [
          'NEF',
          'NA',
        ],
        grund: 'MANV 16-25',
      },
    ),

    erstelleAnforderung(
      'SanEL',
      1,
      {
        grund: 'MANV 16-25',
      },
    ),

    erstelleAnforderung(
      'ELRD',
      1,
      {
        grund: 'MANV 16-25',
      },
    ),

    erstelleAnforderung(
      'SEG-Transport',
      2,
      {
        grund: 'MANV 16-25',
      },
    ),

    erstelleAnforderung(
      'SEG-Behandlung',
      1,
      {
        grund: 'MANV 16-25',
      },
    ),

    erstelleAnforderung(
      'SEG-Transport',
      0,
      {
        grund:
          'MANV 16-25 – zusätzlicher variabler Bedarf',
        variabel: true,
      },
    ),

    erstelleAnforderung(
      'KIT',
      1,
      {
        grund: 'MANV 16-25',
      },
    ),
  ]
}


// --------------------------------
// SONDERSTICHWÖRTER
// --------------------------------

function rdAmok() {
  return [
    ...rd3(),

    erstelleAnforderung(
      'SanEL',
      1,
      {
        grund: 'RD Amok',
      },
    ),

    erstelleAnforderung(
      'KIT',
      1,
      {
        grund: 'RD Amok',
      },
    ),
  ]
}


function wassernot0() {
  return [
    erstelleAnforderung(
      'EL-WR',
      1,
      {
        bereich: 'WR',
        grund: 'Wassernot 0',
        stichwort: 'Wassernot 0',
      },
    ),
  ]
}


function wassernot3() {
  return [
    ...rd2(),

    erstelleAnforderung(
      'ELRD',
      1,
      {
        grund: 'Wassernot 3',
        stichwort: 'Wassernot 3',
      },
    ),

    erstelleAnforderung(
      'RTH',
      1,
      {
        grund: 'Wassernot 3',
        stichwort: 'Wassernot 3',
      },
    ),

    erstelleAnforderung(
      'EL-WR',
      1,
      {
        bereich: 'WR',
        grund: 'Wassernot 3',
        stichwort: 'Wassernot 3',
      },
    ),

    erstelleAnforderung(
      'WR',
      1,
      {
        bereich: 'WR',
        grund: 'Wassernot 3',
        stichwort: 'Wassernot 3',
      },
    ),
  ]
}


// --------------------------------
// EINZELTOKEN
// --------------------------------

function parseToken(token) {
  const original =
    String(token ?? '').trim()

  const normalisiert =
    normalisiereToken(original)

  const rtwTreffer =
    normalisiert.match(
      /^(\d+)\s*RTW$/,
    )

  if (rtwTreffer) {
    return [
      erstelleAnforderung(
        'RTW',
        Number(rtwTreffer[1]),
        {
          grund: original,
        },
      ),
    ]
  }

  const nefTreffer =
    normalisiert.match(
      /^(\d+)\s*NEF$/,
    )

  if (nefTreffer) {
    return [
      erstelleAnforderung(
        'NEF',
        Number(nefTreffer[1]),
        {
          grund: original,
        },
      ),
    ]
  }

  switch (normalisiert) {
    case 'RD 0':
      return rd0()

    case 'RD 1':
      return rd1()

    case 'RD 2':
      return rd2()

    case 'RD 3':
      return rd3()

    case 'RD 4':
      return rd4()

    case 'RD 5':
      return rd5()

    case 'RD AMOK':
      return rdAmok()

    case 'MANV 10-15':
    case 'RD MANV 10-15':
      return manv10Bis15()

    case 'MANV 16-25':
    case 'RD MANV 16-25':
      return manv16Bis25()

    case 'WASSERNOT 0':
      return wassernot0()

    case 'WASSERNOT 3':
      return wassernot3()

    case 'ELRD':
      return [
        erstelleAnforderung(
          'ELRD',
          1,
          {
            grund: original,
          },
        ),
      ]

    case 'SANEL':
      return [
        erstelleAnforderung(
          'SanEL',
          1,
          {
            grund: original,
          },
        ),
      ]

    case 'FACHBERATER CBRN(E)':
      return [
        erstelleAnforderung(
          'Fachberater CBRN(E)',
          1,
          {
            bereich: 'CBRN',
            grund: original,
          },
        ),
      ]

    case 'SEG INFEKT LEITER':
      return [
        erstelleAnforderung(
          'SEG Infekt Leiter',
          1,
          {
            grund: original,
          },
        ),
      ]

    case 'SEG BEH':
      return [
        erstelleAnforderung(
          'SEG-Behandlung',
          1,
          {
            grund: original,
          },
        ),
      ]

    case 'SEG BETR':
      return [
        erstelleAnforderung(
          'SEG-Betreuung',
          1,
          {
            grund: original,
          },
        ),
      ]

    case 'WR':
      return [
        erstelleAnforderung(
          'WR',
          1,
          {
            bereich: 'WR',
            grund: original,
          },
        ),
      ]

    case 'BW':
      return [
        erstelleAnforderung(
          'BW',
          1,
          {
            bereich: 'BR',
            grund: original,
          },
        ),
      ]

    case 'EL-BW':
      return [
        erstelleAnforderung(
          'EL-BW',
          1,
          {
            bereich: 'BR',
            grund: original,
          },
        ),
      ]

    case 'EL-WR':
      return [
        erstelleAnforderung(
          'EL-WR',
          1,
          {
            bereich: 'WR',
            grund: original,
          },
        ),
      ]

    case 'RTH':
      return [
        erstelleAnforderung(
          'RTH',
          1,
          {
            grund: original,
          },
        ),
      ]

    case 'KIT':
      return [
        erstelleAnforderung(
          'KIT',
          1,
          {
            grund: original,
          },
        ),
      ]

    default:
      return [
        unbekannteAnforderung(
          original,
        ),
      ]
  }
}


// --------------------------------
// GLEICHE ANFORDERUNGEN BÜNDELN
// --------------------------------

function fasseBedarfZusammen(
  bedarf,
) {
  const ergebnis = []

  bedarf.forEach((eintrag) => {
    if (
      eintrag.unbekannt ||
      eintrag.platzhalter ||
      eintrag.variabel
    ) {
      ergebnis.push(eintrag)
      return
    }

    const alternativeTypen =
      [...(
        eintrag.alternativeTypen ??
        []
      )].sort()

    const vorhanden =
      ergebnis.find((vergleich) => {
        if (
          vergleich.unbekannt ||
          vergleich.platzhalter ||
          vergleich.variabel
        ) {
          return false
        }

        const vergleichAlternativen =
          [...(
            vergleich.alternativeTypen ??
            []
          )].sort()

        return (
          vergleich.typ ===
            eintrag.typ &&
          vergleich.bereich ===
            eintrag.bereich &&
          JSON.stringify(
            vergleichAlternativen,
          ) ===
            JSON.stringify(
              alternativeTypen,
            )
        )
      })

    if (vorhanden) {
      vorhanden.anzahl +=
        eintrag.anzahl

      if (
        eintrag.grund &&
        !vorhanden.grund.includes(
          eintrag.grund,
        )
      ) {
        vorhanden.grund +=
          ` / ${eintrag.grund}`
      }

      return
    }

    ergebnis.push({
      ...eintrag,
      alternativeTypen:
        [...alternativeTypen],
    })
  })

  return ergebnis
}


// --------------------------------
// ÖFFENTLICHE PARSER-FUNKTION
// --------------------------------

export function parseRdVerknuepfung(
  text,
) {
  if (!text) {
    return []
  }

  const teile =
    String(text)
      .split('+')
      .map(
        (teil) =>
          teil.trim(),
      )
      .filter(Boolean)

  const bedarf = []

  teile.forEach((teil) => {
    bedarf.push(
      ...parseToken(teil),
    )
  })

  return fasseBedarfZusammen(
    bedarf,
  )
}
