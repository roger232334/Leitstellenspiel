// Entwicklungsdaten: Ressourcen sind Simulationswerte, keine taktischen Vorgaben.
export const grundtypen = [
  { id: 'gebaeudebrand', name: 'Gebäudebrand' },
  { id: 'medizinischer-notfall', name: 'Medizinischer Notfall' },
  { id: 'technische-hilfe', name: 'Technische Hilfeleistung' },
]

export const notrufVarianten = [
  { id: 'nachbar-rauch', gewicht: 30, anruferTyp: 'nachbar', informationsqualitaet: 'begrenzt', einstieg: 'Aus der Wohnung gegenüber kommt Rauch.', bekannteInformationen: ['rauchentwicklung'], fehlendeInformationen: ['brandumfang', 'personen'] },
  { id: 'bewohner-rauch', gewicht: 25, anruferTyp: 'bewohner', informationsqualitaet: 'mittel', einstieg: 'Bei uns kommt Rauch aus einem Zimmer. Wir sind draußen.', bekannteInformationen: ['rauchentwicklung', 'anrufer-draussen'], fehlendeInformationen: ['brandumfang'] },
  { id: 'rauchmelder', gewicht: 25, anruferTyp: 'nachbar', informationsqualitaet: 'begrenzt', einstieg: 'Der Rauchmelder piept und es riecht verbrannt.', bekannteInformationen: ['rauchmelder', 'brandgeruch'], fehlendeInformationen: ['brandumfang', 'personen'] },
  { id: 'wohnung-brennt', gewicht: 15, anruferTyp: 'bewohner', informationsqualitaet: 'mittel', einstieg: 'Hier brennt es in einer Wohnung!', bekannteInformationen: ['feuer'], fehlendeInformationen: ['brandumfang', 'personen'] },
  { id: 'fenster-flammen', gewicht: 5, anruferTyp: 'passant', informationsqualitaet: 'begrenzt', einstieg: 'Ich sehe Flammen aus dem Fenster.', bekannteInformationen: ['sichtbare-flammen'], fehlendeInformationen: ['personen'], lageVarianten: ['zimmer-vollbrand', 'person-vermisst', 'brandausbreitung'] },
]

const lageFunkmeldungen = {
  'angebranntes-essen': { erkundungAbgeschlossen: { text: 'Kein offenes Feuer, lediglich angebranntes Essen.' }, einsatzAbschluss: { text: 'Belüftung weitgehend abgeschlossen. Wir führen die abschließende Kontrolle durch.' } },
  'kleinbrand-zimmer': { erkundungAbgeschlossen: { text: 'Kleinbrand im Zimmer bestätigt. Wir beginnen mit der Brandbekämpfung.' }, einsatzAbschluss: { text: 'Kleinbrand gelöscht. Abschließende Kontrolle läuft.' } },
  'zimmer-vollbrand': { erkundungAbgeschlossen: { text: 'Zimmerbrand bestätigt.' }, einsatzAbschluss: { text: 'Brandbekämpfung weitgehend abgeschlossen. Nachkontrolle läuft.' } },
  'person-vermisst': { erkundungAbgeschlossen: { text: 'Zimmerbrand bestätigt, eine Person wird vermisst.', prioritaet: 'dringend' }, einsatzAbschluss: { text: 'Die Maßnahmen sind weitgehend abgeschlossen. Eine abschließende Lagemeldung folgt.' } },
  'brandausbreitung': { erkundungAbgeschlossen: { text: 'Feuer hat sich weiter ausgebreitet.', prioritaet: 'dringend' }, einsatzAbschluss: { text: 'Brandbekämpfung weitgehend abgeschlossen. Kontrolle auf weitere Glutnester läuft.' } },
}

export const lageVarianten = [
  { id: 'angebranntes-essen', name: 'Angebranntes Essen', gewicht: 20, dauer: { basisMinuten: 25, schwankungMinuten: 5 }, bedarf: { ressourcen: { wasserLiter: 200, atemschutzgeraete: 2 }, ausruestung: ['belueftungsgeraet'] }, eskalationen: [] },
  { id: 'kleinbrand-zimmer', name: 'Kleinbrand im Zimmer', gewicht: 40, dauer: { basisMinuten: 25, schwankungMinuten: 5 }, bedarf: { ressourcen: { wasserLiter: 800, atemschutzgeraete: 2 }, ausruestung: ['waermebildkamera'] }, eskalationen: [{ zielLageVarianteId: 'zimmer-vollbrand', ausloeser: 'spaetere-verlaufsteuerung' }] },
  { id: 'zimmer-vollbrand', name: 'Zimmer im Vollbrand', gewicht: 25, dauer: { basisMinuten: 30, schwankungMinuten: 10 }, bedarf: { ressourcen: { wasserLiter: 3200, atemschutzgeraete: 6 }, ausruestung: ['beleuchtung', 'waermebildkamera'] }, eskalationen: [{ zielLageVarianteId: 'brandausbreitung', ausloeser: 'spaetere-verlaufsteuerung' }] },
  { id: 'person-vermisst', name: 'Wohnungsbrand mit vermisster Person', gewicht: 10, dauer: { basisMinuten: 35, schwankungMinuten: 5 }, bedarf: { ressourcen: { wasserLiter: 4000, atemschutzgeraete: 8 }, ausruestung: ['beleuchtung', 'waermebildkamera', 'tuerOeffnungsset'], faehigkeiten: ['notfallversorgung'] }, eskalationen: [] },
  { id: 'brandausbreitung', name: 'Brandausbreitung auf den Dachstuhl', gewicht: 5, dauer: { basisMinuten: 35, schwankungMinuten: 5 }, bedarf: { ressourcen: { wasserLiter: 6400, atemschutzgeraete: 12 }, ausruestung: ['beleuchtung', 'waermebildkamera'] }, eskalationen: [] },
]

// Keine Einsatztexte im Timer: Meldungen gehören zu den jeweiligen Lagedaten.
for (const lage of lageVarianten) lage.funkmeldungen = lageFunkmeldungen[lage.id]

export const modifikatoren = [
  { id: 'schwierige-wasserversorgung', name: 'Schwierige Wasserversorgung', bedarfZusatz: { ressourcen: { wasserLiter: 1600 } }, rueckmeldung: 'Zusätzliche Löschwasserreserve erforderlich.' },
  { id: 'schlechte-sicht', name: 'Schlechte Sicht an der Einsatzstelle', bedarfZusatz: { faehigkeiten: ['beleuchtung'] }, rueckmeldung: 'Beleuchtung mit Stromversorgung erforderlich.' },
]

export const einsatzArten = [{
  id: 'zimmerbrand', name: 'Zimmerbrand', bereich: 'B', meldebildId: 'B-11-23', grundtyp: 'gebaeudebrand',
  funkmeldungen: { erstesFahrzeugEingetroffen: { text: 'An der Einsatzstelle eingetroffen. Wir erkunden die Lage.' } },
  notrufVarianten: ['nachbar-rauch', 'bewohner-rauch', 'rauchmelder', 'wohnung-brennt', 'fenster-flammen'],
  lageVarianten: ['angebranntes-essen', 'kleinbrand-zimmer', 'zimmer-vollbrand', 'person-vermisst', 'brandausbreitung'],
  modifikatoren: [{ id: 'schwierige-wasserversorgung', wahrscheinlichkeit: 0.15 }, { id: 'schlechte-sicht', wahrscheinlichkeit: 0.2 }],
}]

export const einsatzKatalog = { grundtypen, einsatzArten, notrufVarianten, lageVarianten, modifikatoren }
