export const ausruestungsKategorien = [
  ['brand', 'Brandbekämpfung'], ['th', 'Technische Hilfeleistung'], ['atemschutz', 'Atemschutz'],
  ['strom', 'Beleuchtung / Strom'], ['wasserrettung', 'Wasserrettung'], ['abc', 'Gefahrgut / ABC'],
  ['unwetter', 'Unwetter / Wasserschaden'], ['hoehen', 'Rettung aus Höhen / Tiefen'],
  ['fuehrung', 'Führung'], ['medizin', 'Medizinische Versorgung'], ['sonstige', 'Sonstige Ausrüstung'],
].map(([id, name]) => ({ id, name }))

const menge = (id, name, kategorie, einheit) => ({ id, name, kategorie, typ: 'number', einheit, min: 0, step: 1 })
const schalter = (id, name, kategorie) => ({ id, name, kategorie, typ: 'boolean' })
export const ausruestungsKatalog = [
  menge('wasserLiter', 'Wassertank', 'brand', 'Liter'),
  menge('schaummittelLiter', 'Schaummittel', 'brand', 'Liter'),
  menge('atemschutzgeraete', 'Atemschutzgeräte', 'atemschutz', 'Stück'),
  schalter('feuerloeschpumpe', 'Feuerlöschpumpe', 'brand'),
  schalter('schnellangriff', 'Schnellangriff', 'brand'),
  schalter('schaumausruestung', 'Schaumausrüstung', 'brand'),
  schalter('belueftungsgeraet', 'Belüftungsgerät', 'brand'),
  schalter('waermebildkamera', 'Wärmebildkamera', 'brand'),
  schalter('schneidSpreizwerkzeug', 'Schneid-/Spreizwerkzeug', 'th'),
  schalter('kettensaege', 'Kettensäge', 'th'),
  schalter('tuerOeffnungsset', 'Türöffnungsset', 'th'),
  schalter('bahnrettungssatz', 'Bahnrettungssatz', 'th'),
  schalter('hebekissen', 'Hebekissen', 'th'),
  schalter('mehrzweckzug', 'Mehrzweckzug', 'th'),
  schalter('abstutzmaterial', 'Abstützmaterial', 'th'),
  schalter('atemschutzueberwachung', 'Atemschutzüberwachung', 'atemschutz'),
  schalter('beleuchtung', 'Beleuchtung', 'strom'),
  schalter('stromerzeuger', 'Stromerzeuger', 'strom'),
  schalter('boot', 'Boot', 'wasserrettung'),
  schalter('eisrettung', 'Eisrettung', 'wasserrettung'),
  schalter('rettungswesten', 'Rettungswesten', 'wasserrettung'),
  schalter('gasExWarner', 'Gas-/EX-Warner', 'abc'),
  schalter('chemikalienschutzanzuege', 'Chemikalienschutzanzüge', 'abc'),
  schalter('dekonAusruestung', 'Dekontaminationsausrüstung', 'abc'),
  schalter('wasserschadenausruestung', 'Wasserschadenausrüstung', 'unwetter'),
  schalter('tauchpumpe', 'Tauchpumpe', 'unwetter'),
  schalter('wassersauger', 'Wassersauger', 'unwetter'),
  schalter('sprungretter', 'Sprungretter', 'hoehen'),
  schalter('schleifkorbtrage', 'Schleifkorbtrage', 'hoehen'),
  schalter('absturzsicherung', 'Absturzsicherung', 'hoehen'),
  schalter('fuehrungsausstattung', 'Führungsausstattung', 'fuehrung'),
  schalter('krankentransport', 'Krankentransport', 'medizin'),
  schalter('notfallversorgung', 'Notfallversorgung', 'medizin'),
  schalter('patiententransport', 'Patiententransport', 'medizin'),
  schalter('sanitaetsmaterial', 'Sanitätsmaterial', 'sonstige'),
]

// Stabile Speicher-IDs sind camelCase; diese Aliase unterstützen spätere Bedarfsobjekte.
const aliase = { 'wasser-liter': 'wasserLiter', 'schaummittel-liter': 'schaummittelLiter',
  'schneid-spreizwerkzeug': 'schneidSpreizwerkzeug', 'tuer-oeffnungsset': 'tuerOeffnungsset', 'gas-ex-warner': 'gasExWarner' }
export const ausruestungsId = id => aliase[id] || id
export const katalogEintrag = id => ausruestungsKatalog.find(e => e.id === ausruestungsId(id))

// Notarzt und First Responder bleiben die vorhandenen, separat gepflegten Fahrzeugmerkmale.
export const faehigkeitsRegeln = [
  { id: 'technische-rettung', name: 'Technische Rettung', ausruestung: ['schneidSpreizwerkzeug'] },
  { id: 'baumarbeiten', name: 'Baumarbeiten', ausruestung: ['kettensaege'] },
  { id: 'beleuchtung', name: 'Beleuchtung', ausruestung: ['stromerzeuger', 'beleuchtung'] },
  { id: 'wasserrettung', name: 'Wasserrettung', ausruestung: ['boot'] },
  { id: 'krankentransport', name: 'Krankentransport', ausruestung: ['krankentransport'] },
  { id: 'notfallversorgung', name: 'Notfallversorgung', ausruestung: ['notfallversorgung'] },
  { id: 'patiententransport', name: 'Patiententransport', ausruestung: ['patiententransport'] },
  { id: 'notarzt', name: 'Notarzt', merkmal: 'hatNotarzt' },
  { id: 'medizinische-erstversorgung', name: 'Medizinische Erstversorgung', merkmal: 'istFirstResponder' },
]
