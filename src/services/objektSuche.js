import { objektDatenLaden } from '../data/objektVerwaltung.js'
import { objektTypName } from '../data/objektTypen.js'

export function objektVorschlaege(text, objekte = objektDatenLaden().objekte) {
  const teile = text.trim().toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
  return objekte.filter(o => {
    const suchtext = [o.name, o.alias, objektTypName(o.typId), ...Object.values(o.adresse || {})].join(' ').toLocaleLowerCase('de')
    return teile.every(t => suchtext.includes(t))
  }).map(o => ({ id: o.id, label: o.name,
    detail: [o.alias && `Alias: ${o.alias}`, objektTypName(o.typId),
      Object.values(o.adresse || {}).filter(Boolean).join(' '), o.aktiv === false && 'Inaktiv'].filter(Boolean).join(' · '),
    objekt: o }))
}

// Only the primary stored address is used; absent fields clear the previous location.
export function objektEinsatzFelder(objekt) {
  const a = objekt.adresse || {}
  return {
    objektId: objekt.id, objekt: objekt.name, station: '',
    strasse: a.strasse || '', hausnummer: [a.hausnummer, a.hausnummerZusatz].filter(Boolean).join(''),
    ort: a.gemeinde || a.ort || '',
    ortsteil: a.gemeinde && a.ort !== a.gemeinde ? a.ort || '' : '',
    postleitzahl: a.postleitzahl || '', adressKennzeichen: a.adressKennzeichen || '',
    position: objekt.position ? { ...objekt.position } : null, gebietId: null,
  }
}
