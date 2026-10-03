// Ausschließlich auf ausdrücklichen Klick anlegen, niemals automatisch beim Schichtstart.
export function bedarfsTestEinsatz(art, id) {
  if (!['brand', 'thl'].includes(art)) throw new Error('Unbekannter Bedarfstest.')
  return {
    id, typ: 'haupt', parentId: null, bereich: null, quelle: 'bedarfstest',
    meldung: art === 'brand' ? '[TEST] Brand – Ressourcenbedarf' : '[TEST] THL – Ausrüstungsbedarf',
    ort: 'Testeinsatz ohne Kartenposition', position: null,
    bemerkung: 'Manuell angelegter Bedarfstest. Fahrzeuge selbst auswählen und alarmieren.',
    status: 'offen', fahrzeuge: [], untereinsatzIds: [], autoSplitErfolgt: false,
    stichwoerter: {},
    bedarf: art === 'brand'
      ? { ressourcen: { wasserLiter: 3200, atemschutzgeraete: 6 }, ausruestung: ['beleuchtung'] }
      : { ressourcen: {}, ausruestung: ['schneidSpreizwerkzeug', 'beleuchtung'] },
  }
}
