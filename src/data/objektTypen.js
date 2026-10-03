export const objektTypen = [
  ['unklassifiziert', 'Nicht klassifiziert'],
  ['altenheim', 'Altenheim'], ['amt', 'Amt'], ['apotheke', 'Apotheke'],
  ['bahn', 'Bahn'], ['bahnhof', 'Bahnhof'], ['beherbergungsbetrieb', 'Beherbergungsbetrieb'],
  ['behinderteneinrichtung', 'Behinderteneinrichtung'], ['campingplatz', 'Campingplatz'],
  ['feuerwehr-thw', 'Feuerwehr / THW'], ['flughafen', 'Flughafen'], ['freizeiteinrichtung', 'Freizeiteinrichtung'],
  ['garagen', 'Garagen'], ['gaststaette', 'Gaststätte'], ['gewaesser', 'Gewässer'],
  ['gewerbebetrieb', 'Gewerbebetrieb'], ['hafen', 'Hafen'], ['handwerksbetrieb', 'Handwerksbetrieb'],
  ['heim', 'Heim'], ['industrie', 'Industriebetrieb'], ['kindergarten', 'Kindergarten'],
  ['gruenflaeche', 'Grünfläche'], ['berg', 'Berg'],
  ['krankenhaus', 'Krankenhaus'], ['kultur', 'Kultur'], ['militaer', 'Militär'],
  ['objekt-besondere-gefahren', 'Objekt mit besonderen Gefahren'], ['polizei', 'Polizei'],
  ['praxis', 'Praxis'], ['religioese-einrichtung', 'Religiöse Einrichtung'], ['rettungsdienst', 'Rettungsdienst'],
  ['rettungspunkt', 'Rettungspunkt'], ['schule', 'Schule'], ['sonstiges', 'Sonstiges'],
  ['strassenobjekt', 'Straßenobjekt'], ['verkaufsstaette', 'Verkaufstätte'],
  ['versammlungsstaette', 'Versammlungsstätte'], ['wohngebaeude', 'Wohngebäude'],
].map(([id, name]) => ({ id, name }))

export const objektTypName = id => objektTypen.find(t => t.id === id)?.name || 'Nicht klassifiziert'
const normal = text => String(text ?? '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g, 'ss').replace(/[\s/-]+/g, '')
export function quellObjektTyp(text) {
  return objektTypen.find(t => normal(t.name) === normal(text) || normal(t.id) === normal(text))?.id ?? 'unklassifiziert'
}
