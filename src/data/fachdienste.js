// Zuordnung in der Simulation, keine Liste von Trägerorganisationen.
export const fachdienste = [
  { id: 'RD', name: 'Rettungsdienst', wache: 'Rettungswache' },
  { id: 'FW', name: 'Feuerwehr', wache: 'Feuerwache' },
  { id: 'LUFT', name: 'Hubschrauber / Luftrettung', wache: 'Luftrettungsstation' },
  { id: 'BR', name: 'Bergrettung / Bergwacht', wache: 'Bergrettungswache' },
  { id: 'WR', name: 'Wasserrettung', wache: 'Wasserrettungsstation' },
  { id: 'KATS', name: 'Katastrophenschutz', wache: 'Katastrophenschutz-Standort' },
  { id: 'THW', name: 'Technische Hilfe / THW', wache: 'THW-Unterkunft' },
  { id: 'SAN', name: 'Sanitätsdienst', wache: 'Sanitätsdienst-Standort' },
  { id: 'BETR', name: 'Betreuungsdienst', wache: 'Betreuungsdienst-Standort' },
  { id: 'SONST', name: 'Sonstige', wache: 'Sonstiger Standort' },
]
export const fachdienstName = id => fachdienste.find(f => f.id === id)?.name || id || 'Nicht zugeordnet'
export const tableauFachdienst = fahrzeug => fachdienste.some(f => f.id === fahrzeug.bereich) ? fahrzeug.bereich : 'SONST'
export const belegteFachdienste = fahrzeuge => fachdienste.filter(f => ['RD', 'FW'].includes(f.id) || fahrzeuge.some(v => tableauFachdienst(v) === f.id))
