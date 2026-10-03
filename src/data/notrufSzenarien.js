export const notrufSzenarien = [
  {
    id: 1,
    notrufFakten: {
      anruferPosition: 'vorOrt',
      akutesProblem: 'Mein Vater hat sich plötzlich an den Kopf gefasst und ist zusammengebrochen.',
      atmungAusreichend: true, reagiertNormal: false,
      brustbeschwerden: null, kreislaufproblem: true, laehmung: null,
      sprachstoerung: null, sehstoerung: null, starkerKopfschmerz: null,
      halbseitigeGefuehlsstoerung: null, schwindelMitFallneigung: null, krampfanfall: false,
      details: { atmungAusreichend: 'Ich sehe, dass sich sein Brustkorb bewegt.', reagiertNormal: 'Mein Vater reagiert überhaupt nicht auf mein Rufen.' },
    },
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
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse', 'befinden'],
        antwort:
          'Wir sind in Regensburg, Prüfeninger Straße 85. Bitte beeilen Sie sich!',
      },
      {
        schluesselwoerter: ['atmet', 'atmung', 'luft', 'atem'],
        antwort:
          'Ja, er atmet. Ich sehe, dass sich der Brustkorb bewegt.',
      },
      {
        schluesselwoerter: ['wach', 'ansprechbar', 'bewusstsein', 'reagiert'],
        antwort:
          'Nein, überhaupt nicht. Ich rufe ihn die ganze Zeit, aber er reagiert nicht.',
      },
      {
        schluesselwoerter: ['alter', 'alt', 'jahre'],
        antwort: 'Mein Vater ist 68 Jahre alt.',
      },
      {
        schluesselwoerter: ['was passiert', 'passiert', 'geschehen', 'zusammengebrochen'],
        antwort:
          'Wir waren gerade in der Küche. Plötzlich hat er sich an den Kopf gefasst und ist zu Boden gefallen.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
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

  {
    id: 2,
    notrufFakten: {
      anruferPosition: 'vorOrt', akutesProblem: 'Mein Mann bekommt plötzlich ganz schlecht Luft.',
      atmungAusreichend: false, reagiertNormal: true, brustbeschwerden: true,
      kreislaufproblem: null, laehmung: null, sprachstoerung: null, sehstoerung: null,
      starkerKopfschmerz: null, halbseitigeGefuehlsstoerung: null, schwindelMitFallneigung: null, krampfanfall: false,
      details: { atmungAusreichend: 'Er atmet ganz schnell.', brustbeschwerden: 'Er beschreibt eher ein Engegefühl als richtigen Schmerz.' },
    },
    titel: 'Atemnot',
    startText:
      'Hallo, mein Mann bekommt plötzlich ganz schlecht Luft. Können Sie bitte jemanden schicken?',

    daten: {
      anrufer: 'Monika Bauer',
      rueckrufnummer: '0151 33445566',
      ort: 'Regensburg',
      strasse: 'Landshuter Straße',
      hausnummer: '47',
      meldung: 'Akute Atemnot',
      stichwort: 'RD2',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Wir sind in Regensburg in der Landshuter Straße 47, im zweiten Stock.',
      },
      {
        schluesselwoerter: ['wach', 'ansprechbar', 'reagiert'],
        antwort:
          'Ja, er ist wach und spricht auch noch mit mir.',
      },
      {
        schluesselwoerter: ['atmet', 'atmung', 'luft', 'atem'],
        antwort:
          'Er bekommt sehr schlecht Luft und atmet ganz schnell.',
      },
      {
        schluesselwoerter: ['schmerzen', 'brust'],
        antwort:
          'Er sagt, dass er keinen richtigen Schmerz hat, eher so ein Engegefühl.',
      },
      {
        schluesselwoerter: ['alter', 'alt', 'jahre'],
        antwort: 'Er ist 72 Jahre alt.',
      },
      {
        schluesselwoerter: ['vorgeschichte', 'krankheit', 'asthma', 'copd'],
        antwort:
          'Er hat COPD und nimmt dafür regelmäßig Medikamente.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: 'Sie erreichen mich unter 0151 33445566.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Mein Name ist Monika Bauer.',
      },
    ],

    standardAntworten: [
      'Er bekommt einfach sehr schlecht Luft.',
      'Ich bin mir nicht sicher.',
      'Können Sie bitte schnell jemanden schicken?',
      'Er sitzt gerade auf dem Sofa und versucht zu atmen.',
    ],
  },

  {
    id: 3,
    notrufFakten: {
      anruferPosition: 'selbst', akutesProblem: 'Seit ein paar Minuten habe ich starke Schmerzen in der Brust.',
      atmungAusreichend: false, reagiertNormal: true, brustbeschwerden: true,
      kreislaufproblem: null, laehmung: false, sprachstoerung: false, sehstoerung: false,
      starkerKopfschmerz: false, halbseitigeGefuehlsstoerung: false, schwindelMitFallneigung: null, krampfanfall: false,
      details: { atmungAusreichend: 'Ich bin kurzatmig.', brustbeschwerden: 'Es drückt hinter dem Brustbein und zieht in meinen linken Arm.' },
    },
    titel: 'Brustschmerz',
    startText:
      'Guten Tag, ich habe seit ein paar Minuten starke Schmerzen in der Brust und mir ist komisch.',

    daten: {
      anrufer: 'Thomas Schmid',
      rueckrufnummer: '0176 77889900',
      ort: 'Regensburg',
      strasse: 'Galgenbergstraße',
      hausnummer: '20',
      meldung: 'Brustschmerz',
      stichwort: 'RD2',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Ich bin zuhause in Regensburg, Galgenbergstraße 20.',
      },
      {
        schluesselwoerter: ['schmerz', 'brust', 'weh'],
        antwort:
          'Es drückt stark hinter dem Brustbein und zieht etwas in den linken Arm.',
      },
      {
        schluesselwoerter: ['atem', 'luft', 'atmung'],
        antwort:
          'Ein bisschen kurzatmig bin ich auch.',
      },
      {
        schluesselwoerter: ['bewusstlos', 'wach', 'ansprechbar'],
        antwort:
          'Ich bin wach, sonst könnte ich ja nicht mit Ihnen telefonieren.',
      },
      {
        schluesselwoerter: ['alter', 'alt', 'jahre'],
        antwort: 'Ich bin 59 Jahre alt.',
      },
      {
        schluesselwoerter: ['krankheit', 'vorgeschichte', 'herz'],
        antwort:
          'Ich habe hohen Blutdruck, sonst eigentlich nichts am Herzen.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: 'Meine Nummer ist 0176 77889900.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Thomas Schmid.',
      },
    ],

    standardAntworten: [
      'Die Schmerzen machen mir wirklich Sorgen.',
      'Ich weiß nicht, was das ist.',
      'Nein, das hatte ich so noch nie.',
      'Bitte schicken Sie lieber jemanden.',
    ],
  },

  {
    id: 4,
    titel: 'Verkehrsunfall',
    startText:
      'Hallo, hier ist gerade ein Autounfall passiert. Zwei Autos sind zusammengestoßen!',

    daten: {
      anrufer: 'Felix Wagner',
      rueckrufnummer: '0160 99887766',
      ort: 'Regensburg',
      strasse: 'Frankenstraße',
      hausnummer: '112',
      meldung: 'Verkehrsunfall mit Verletzten',
      stichwort: 'THL 1',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Auf der Frankenstraße in Regensburg, ungefähr auf Höhe Hausnummer 112.',
      },
      {
        schluesselwoerter: ['wie viele', 'personen', 'verletzt', 'verletzte'],
        antwort:
          'Ich sehe mindestens zwei Personen. Eine sitzt noch im Auto, die andere steht daneben.',
      },
      {
        schluesselwoerter: ['eingeklemmt', 'eingeschlossen', 'rauskommen'],
        antwort:
          'Ich glaube, die Person im roten Auto bekommt die Tür nicht auf.',
      },
      {
        schluesselwoerter: ['brand', 'rauch', 'feuer'],
        antwort:
          'Nein, ich sehe kein Feuer und auch keinen Rauch.',
      },
      {
        schluesselwoerter: ['bewusstsein', 'wach', 'ansprechbar'],
        antwort:
          'Die Person im Auto reagiert, aber sie wirkt ziemlich benommen.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: 'Meine Nummer ist 0160 99887766.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Felix Wagner.',
      },
    ],

    standardAntworten: [
      'Ich stehe ein paar Meter entfernt.',
      'Mehr kann ich gerade nicht erkennen.',
      'Es sind ziemlich viele Leute hier.',
      'Die Autos stehen mitten auf der Straße.',
    ],
  },

  {
    id: 5,
    titel: 'Wohnungsbrand',
    startText:
      'Es brennt bei uns im Haus! Im Treppenhaus ist überall Rauch!',

    daten: {
      anrufer: 'Aylin Demir',
      rueckrufnummer: '0172 22334455',
      ort: 'Regensburg',
      strasse: 'Donaustaufer Straße',
      hausnummer: '35',
      meldung: 'Wohnungsbrand',
      stichwort: 'B3',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Donaustaufer Straße 35 in Regensburg.',
      },
      {
        schluesselwoerter: ['wo brennt', 'brandort', 'wohnung', 'treppenhaus'],
        antwort:
          'Ich glaube, es brennt eine Wohnung im ersten Stock. Der Rauch ist schon im Treppenhaus.',
      },
      {
        schluesselwoerter: ['personen', 'menschen', 'drin', 'vermisst'],
        antwort:
          'Ich weiß nicht, ob noch jemand in der Wohnung ist. Im Haus wohnen mehrere Familien.',
      },
      {
        schluesselwoerter: ['selbst', 'sicher', 'draußen', 'draussen'],
        antwort:
          'Ich bin mit meiner Tochter draußen vor dem Haus.',
      },
      {
        schluesselwoerter: ['flammen', 'feuer', 'rauch'],
        antwort:
          'Ich sehe Rauch aus einem Fenster, aber keine großen Flammen.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: '0172 22334455.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Aylin Demir.',
      },
    ],

    standardAntworten: [
      'Es ist wirklich viel Rauch.',
      'Ich kann Ihnen nicht genau sagen, was da drin passiert.',
      'Wir stehen draußen.',
      'Bitte schicken Sie die Feuerwehr.',
    ],
  },

  {
    id: 6,
    notrufFakten: {
      anruferPosition: 'vorOrt', akutesProblem: 'Meine Mutter ist auf dem nassen Boden ausgerutscht und auf die Seite gefallen.',
      atmungAusreichend: true, reagiertNormal: true, brustbeschwerden: false,
      kreislaufproblem: null, laehmung: null, sprachstoerung: false, sehstoerung: null,
      starkerKopfschmerz: null, halbseitigeGefuehlsstoerung: null, schwindelMitFallneigung: null, krampfanfall: false,
      details: { reagiertNormal: 'Sie spricht mit mir und sagt, dass ihre Hüfte sehr weh tut.' },
    },
    titel: 'Gestürzte Person',
    startText:
      'Hallo, meine Mutter ist im Badezimmer gestürzt und kommt nicht mehr hoch.',

    daten: {
      anrufer: 'Peter Hofmann',
      rueckrufnummer: '0152 66778899',
      ort: 'Regensburg',
      strasse: 'Kumpfmühler Straße',
      hausnummer: '64',
      meldung: 'Sturz',
      stichwort: 'RD1',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Kumpfmühler Straße 64 in Regensburg.',
      },
      {
        schluesselwoerter: ['wach', 'ansprechbar', 'bewusstsein'],
        antwort:
          'Ja, sie ist wach und spricht mit mir.',
      },
      {
        schluesselwoerter: ['verletzung', 'blutet', 'blut'],
        antwort:
          'Sie blutet nicht. Sie sagt aber, dass ihre Hüfte sehr weh tut.',
      },
      {
        schluesselwoerter: ['aufstehen', 'laufen', 'bewegen'],
        antwort:
          'Nein, sie kann überhaupt nicht aufstehen.',
      },
      {
        schluesselwoerter: ['alter', 'alt', 'jahre'],
        antwort: 'Meine Mutter ist 84.',
      },
      {
        schluesselwoerter: ['gestürzt', 'gestuerzt', 'passiert'],
        antwort:
          'Sie ist wohl auf dem nassen Boden ausgerutscht und auf die Seite gefallen.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: '0152 66778899.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Peter Hofmann.',
      },
    ],

    standardAntworten: [
      'Sie liegt noch im Badezimmer.',
      'Ich möchte sie lieber nicht bewegen.',
      'Sie sagt, dass die Hüfte weh tut.',
      'Mehr weiß ich leider nicht.',
    ],
  },

  {
    id: 7,
    notrufFakten: {
      anruferPosition: 'vorOrt', akutesProblem: 'Mein dreijähriger Sohn hat 40,1 Grad Fieber und ist sehr schläfrig.',
      atmungAusreichend: true, reagiertNormal: false, brustbeschwerden: null,
      kreislaufproblem: null, laehmung: null, sprachstoerung: null, sehstoerung: null,
      starkerKopfschmerz: null, halbseitigeGefuehlsstoerung: null, schwindelMitFallneigung: null, krampfanfall: false,
      details: { atmungAusreichend: 'Er atmet etwas schneller als sonst.', reagiertNormal: 'Er ist wach, aber sehr schläfrig und nicht wie sonst.' },
    },
    titel: 'Kind mit Fieber',
    startText:
      'Hallo, mein Sohn hat sehr hohes Fieber und ist heute irgendwie ganz komisch.',

    daten: {
      anrufer: 'Julia König',
      rueckrufnummer: '0175 55443322',
      ort: 'Regensburg',
      strasse: 'Ziegetsdorfer Straße',
      hausnummer: '91',
      meldung: 'Kind erkrankt',
      stichwort: 'RD1',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Ziegetsdorfer Straße 91 in Regensburg.',
      },
      {
        schluesselwoerter: ['alter', 'alt', 'jahre', 'monate'],
        antwort: 'Er ist drei Jahre alt.',
      },
      {
        schluesselwoerter: ['fieber', 'temperatur', 'grad'],
        antwort:
          'Vor ungefähr zehn Minuten waren es 40,1 Grad.',
      },
      {
        schluesselwoerter: ['wach', 'ansprechbar', 'reagiert'],
        antwort:
          'Er ist wach, aber sehr schläfrig und nicht so wie sonst.',
      },
      {
        schluesselwoerter: ['atmet', 'atmung', 'luft'],
        antwort:
          'Er atmet, aber etwas schneller als sonst.',
      },
      {
        schluesselwoerter: ['krampf', 'gezuckt', 'fieberkrampf'],
        antwort:
          'Nein, gekrampft hat er nicht.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: 'Meine Nummer ist 0175 55443322.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Julia König.',
      },
    ],

    standardAntworten: [
      'Er ist einfach sehr schlapp.',
      'So kenne ich ihn gar nicht.',
      'Ich mache mir wirklich Sorgen.',
      'Nein, mehr ist mir bisher nicht aufgefallen.',
    ],
  },

  {
    id: 8,
    titel: 'Unklare Rauchentwicklung',
    startText:
      'Hallo, ich sehe von meinem Balkon aus starken Rauch aus einem Gebäude gegenüber.',

    daten: {
      anrufer: 'Martin Berger',
      rueckrufnummer: '0162 11223344',
      ort: 'Regensburg',
      strasse: 'Weißenburgstraße',
      hausnummer: '18',
      meldung: 'Rauchentwicklung Gebäude',
      stichwort: 'B2',
    },

    antworten: [
      {
        schluesselwoerter: ['wo', 'adresse', 'ort', 'straße', 'strasse'],
        antwort:
          'Das Gebäude ist in der Weißenburgstraße 18 in Regensburg.',
      },
      {
        schluesselwoerter: ['woher', 'welches stockwerk', 'stock', 'fenster'],
        antwort:
          'Der Rauch kommt offenbar aus einem Fenster im Dachgeschoss.',
      },
      {
        schluesselwoerter: ['flammen', 'feuer'],
        antwort:
          'Flammen kann ich von hier aus nicht sehen.',
      },
      {
        schluesselwoerter: ['personen', 'menschen', 'bewohner'],
        antwort:
          'Ich kann nicht erkennen, ob noch jemand im Gebäude ist.',
      },
      {
        schluesselwoerter: ['rauchfarbe', 'schwarz', 'weiß', 'weiss'],
        antwort:
          'Der Rauch sieht ziemlich dunkel aus.',
      },
      {
        schluesselwoerter: ['telefon', 'nummer', 'rückruf', 'rueckruf'],
        antwort: '0162 11223344.',
      },
      {
        schluesselwoerter: ['name', 'heißen', 'heissen'],
        antwort: 'Martin Berger.',
      },
    ],

    standardAntworten: [
      'Ich sehe es nur von meinem Balkon aus.',
      'Mehr kann ich aus der Entfernung leider nicht erkennen.',
      'Der Rauch ist ziemlich deutlich zu sehen.',
      'Ich habe selbst noch niemanden am Gebäude gesehen.',
    ],
  },
]
