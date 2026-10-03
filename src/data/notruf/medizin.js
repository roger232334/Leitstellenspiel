export const medizinFrageGruppen = [
  {
    id: 'basis',
    name: 'Basisabfrage',

    fragen: [
      {
        id: 'gespraechspartner',
        label: 'Gesprächspartner',
        text:
          'Mit wem spreche ich bitte?',
      },

      {
        id: 'einsatzort',
        label: 'Einsatzort',
        text:
          'Wo genau ist der Einsatzort oder die Einsatzstelle?',
      },

      {
        id: 'akutes-problem',
        label: 'Was ist passiert?',
        text:
          'Was ist jetzt neu passiert?',
      },

      {
        id: 'beim-patienten',
        label: 'Beim Patienten?',
        text:
          'Sind Sie der Patient oder beim Patienten?',
      },
    ],
  },


  {
    id: 'atmung',
    name: 'A – Atmung / Atemwege',

    fragen: [
      {
        id: 'atmung-genug-luft',
        label: 'Atmung',
        text:
          'Bekommt er oder sie jetzt genug Luft?',
      },
    ],
  },


  {
    id: 'bewusstsein',
    name: 'B – Bewusstsein',

    fragen: [
      {
        id: 'bewusstsein-normal',
        label: 'Bewusstsein',
        text:
          'Reagiert er oder sie jetzt normal, wie sonst auch, wenn Sie ihn oder sie ansprechen?',
      },
    ],
  },


  {
    id: 'kreislauf',
    name: 'C – Herz / Kreislauf',

    fragen: [
      {
        id: 'brustschmerz',
        label: 'Brustbeschwerden',
        text:
          'Hat er oder sie jetzt neu Schmerzen oder ein Druckgefühl im Brustbereich?',
      },

      {
        id: 'kreislaufproblem',
        label: 'Kreislaufproblem',
        text:
          'Liegt ein jetzt neues Kreislaufproblem vor?',
      },
    ],
  },


  {
    id: 'neurologie',
    name: 'D – Neurologisches Defizit',

    fragen: [
      {
        id: 'laehmung',
        label: 'Lähmung',
        text:
          'Sind jetzt neu Lähmungen aufgetreten, zum Beispiel an Armen, Beinen oder ein hängender Mundwinkel?',
      },

      {
        id: 'sprache',
        label: 'Sprache',
        text:
          'Sind jetzt neu Sprech-, Sprach- oder Sprachverständnisstörungen aufgetreten?',
      },

      {
        id: 'sehen',
        label: 'Sehen',
        text:
          'Sind jetzt neu Sehstörungen aufgetreten, zum Beispiel Doppelbilder, Blindheit oder Gesichtsfeldausfall?',
      },

      {
        id: 'kopfschmerz',
        label: 'Kopfschmerz',
        text:
          'Sind jetzt neu und erstmalig starke Kopfschmerzen aufgetreten?',
      },

      {
        id: 'gefuehl',
        label: 'Gefühlsstörung',
        text:
          'Besteht eine halbseitige Gefühlsstörung?',
      },

      {
        id: 'schwindel',
        label: 'Schwindel',
        text:
          'Besteht ein jetzt neuer Schwindel mit Fallneigung?',
      },

      {
        id: 'krampfanfall',
        label: 'Krampfanfall',
        text:
          'Besteht ein Krampfanfall?',
      },
    ],
  },
]