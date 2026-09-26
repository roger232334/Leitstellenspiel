export const notrufSzenarien = [
  {
    id: 1,

    titel: 'Bewusstlose Person',

    startText:
      'Hallo? Bitte kommen Sie schnell! Mein Vater ist einfach zusammengebrochen!',

    daten: {
      anrufer: 'Sarah Meier',
      rueckrufnummer: '0171 1234567',
      ort: 'Regensburg',
      strasse: 'Prüfeninger Straße',
      hausnummer: '85',
      meldung: 'Bewusstlose Person',
      stichwort: 'RD2',
    },

    antworten: [
      {
        schluesselwoerter: [
          'wo',
          'adresse',
          'ort',
          'straße',
          'strasse',
          'befinden',
        ],
        antwort:
          'Wir sind in Regensburg, Prüfeninger Straße 85. Bitte beeilen Sie sich!',
      },

      {
        schluesselwoerter: ['atmet', 'atmung', 'luft', 'atem'],
        antwort:
          'Ja, er atmet. Ich sehe, dass sich der Brustkorb bewegt.',
      },

      {
        schluesselwoerter: [
          'wach',
          'ansprechbar',
          'bewusstsein',
          'reagiert',
        ],
        antwort:
          'Nein, überhaupt nicht. Ich rufe ihn die ganze Zeit, aber er reagiert nicht.',
      },

      {
        schluesselwoerter: ['alter', 'alt', 'jahre'],
        antwort: 'Mein Vater ist 68 Jahre alt.',
      },

      {
        schluesselwoerter: [
          'was passiert',
          'passiert',
          'geschehen',
          'zusammengebrochen',
        ],
        antwort:
          'Wir waren gerade in der Küche. Plötzlich hat er sich an den Kopf gefasst und ist zu Boden gefallen.',
      },

      {
        schluesselwoerter: [
          'telefon',
          'nummer',
          'rückruf',
          'rueckruf',
        ],
        antwort: 'Meine Nummer ist 0171 1234567.',
      },

      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Ich heiße Sarah Meier.',
      },
    ],

    standardAntworten: [
      'Ich weiß nicht genau, was Sie meinen.',
      'Können Sie die Frage bitte nochmal anders stellen?',
      'Ich bin gerade ziemlich aufgeregt.',
      'Ich weiß nur, dass mein Vater nicht reagiert.',
    ],
  },
]