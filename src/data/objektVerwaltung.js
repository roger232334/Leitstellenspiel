import { objektTypen, quellObjektTyp } from './objektTypen.js'
import { objektAutomatischZulaessig, gebietLaden } from './gebiet.js'

export function automatischeGebietsObjekte(objekte, daten = gebietLaden()) {
  return objekte.filter(o => objektAutomatischZulaessig(o, daten))
}

export const OBJEKTE_KEY = 'leitstellensimulator-objekte-v1'
export const adressFelder = ['strasse', 'hausnummer', 'adressKennzeichen', 'ort', 'gemeinde', 'postleitzahl']
function text(value, max = 250) {
  if (value == null) return ''
  if (typeof value !== 'string' || value.length > max) throw new Error(`Textfelder dürfen höchstens ${max} Zeichen enthalten.`)
  return value.trim()
}
function adressePruefen(a) {
  return { ...Object.fromEntries(adressFelder.map(f => [f, text(a?.[f])])),
    ...(a?.hausnummerZusatz ? { hausnummerZusatz: text(a.hausnummerZusatz) } : {}) }
}
export function positionPruefen(position) {
  if (position == null) return null
  const { lat, lng } = position
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('WGS84-Koordinaten: Breite −90 bis 90, Länge −180 bis 180. Beide Werte sind erforderlich.')
  return { lat, lng }
}
export function neuesObjekt() {
  return { id: crypto.randomUUID(), quelle: 'manuell', name: '', typId: 'unklassifiziert', adresse: Object.fromEntries(adressFelder.map(f => [f, ''])), position: null, aktiv: true, bemerkung: '' }
}
export function objektPruefen(objekt) {
  if (!objekt || typeof objekt.id !== 'string' || !objekt.id.trim() || objekt.id.length > 100) throw new Error('Ungültige Objekt-ID.')
  // Der sichtbare Name ist der Originalwert, auch bei erneutem Speichern/Laden.
  // trim() dient ausschließlich der Leerprüfung und verändert den Wert nicht.
  const name = objekt.name
  if (typeof name !== 'string' || !name.trim()) throw new Error('Bitte einen Objektnamen eingeben.')
  if (!objektTypen.some(t => t.id === objekt.typId)) throw new Error('Bitte einen gültigen Objekttyp wählen.')
  if (typeof objekt.aktiv !== 'boolean') throw new Error('Aktiv muss ein Ja/Nein-Wert sein.')
  const quelle = objekt.quelle ?? (objekt.id.startsWith('osm:') ? 'osm' : objekt.id.startsWith('excel:') ? 'excel' : 'manuell')
  if (!['manuell', 'excel', 'osm'].includes(quelle)) throw new Error('Unbekannte Objektquelle.')
  if (objekt.weitereAdressen != null && !Array.isArray(objekt.weitereAdressen)) throw new Error('Zusätzliche Adressen müssen eine Liste sein.')
  if (objekt.abteilungen != null && !Array.isArray(objekt.abteilungen)) throw new Error('Abteilungen müssen eine Liste sein.')
  return { id: objekt.id, quelle, name, typId: objekt.typId,
    ...(objekt.alias != null ? { alias: text(objekt.alias) } : {}),
    adresse: adressePruefen(objekt.adresse),
    ...(objekt.weitereAdressen?.length ? { weitereAdressen: objekt.weitereAdressen.map(adressePruefen) } : {}),
    ...(objekt.abteilungen?.length ? { abteilungen: objekt.abteilungen.map(a => {
      if (typeof a.name !== 'string') throw new Error('Ungültiger Abteilungsname.')
      return { name: a.name, adresse: adressePruefen(a.adresse), position: positionPruefen(a.position) }
    }) } : {}),
    position: positionPruefen(objekt.position), aktiv: objekt.aktiv, bemerkung: text(objekt.bemerkung, 4000) }
}
export function objektDatenPruefen(daten) {
  if (daten?.version !== 1 || !Array.isArray(daten.objekte)) throw new Error('Ungültiger Objektdatenbestand.')
  const ids = new Set()
  const objekte = daten.objekte.map(objektPruefen)
  for (const o of objekte) {
    if (ids.has(o.id)) throw new Error('Doppelte Objekt-ID.')
    ids.add(o.id)
  }
  if (daten.importe != null && (!Array.isArray(daten.importe) || daten.importe.some(id => typeof id !== 'string' || !id))) throw new Error('Ungültiges Objekt-Importprotokoll.')
  return { version: 1, objekte, ...(daten.importe ? { importe: [...new Set(daten.importe)] } : {}) }
}
export function objektDatenLaden(speicher = localStorage) {
  const raw = speicher.getItem(OBJEKTE_KEY)
  return raw === null ? { version: 1, objekte: [] } : objektDatenPruefen(JSON.parse(raw))
}
export function objektDatenSpeichern(daten, speicher = localStorage) {
  const result = objektDatenPruefen(daten)
  // Normal editor saves also retain processed imports, so deleted objects stay deleted.
  if (!result.importe) {
    const raw = speicher.getItem?.(OBJEKTE_KEY)
    if (raw) {
      const alt = objektDatenPruefen(JSON.parse(raw))
      if (alt.importe) result.importe = alt.importe
    }
  }
  speicher.setItem(OBJEKTE_KEY, JSON.stringify(result))
  return result
}
// Vorbereitung für Lagekarte/Generator: keine automatische Einblendung oder Generierung.
export function aktiveKartenObjekte(objekte, typIds = null) {
  return objekte.filter(o => o.aktiv && o.position && (!typIds || typIds.includes(o.typId)))
}
export const objektZu = (objekte, objektId) => objekte.find(o => o.id === objektId) ?? null

// Gemeinsamer Zeilenadapter: XLSX-Leser und andere Quellen liefern nur Zellwerte.
export function objektAusQuellzeile(zeile, id = crypto.randomUUID()) {
  const str = wert => String(wert ?? '').trim()
  const lat = str(zeile.YKoord_WGS84), lng = str(zeile.XKoord_WGS84)
  const abteilungen = []
  if (Object.keys(zeile).some(k => k.startsWith('Abteilung ') && str(zeile[k]))) {
    const x = str(zeile['Abteilung XKoord_WGS84']), y = str(zeile['Abteilung YKoord_WGS84'])
    abteilungen.push({ name: zeile['Abteilung Name'] ?? '',
      adresse: { strasse: str(zeile['Abteilung Adresse Straße'] ?? zeile['Abteilung Adresse Strasse']),
        hausnummer: str(zeile['Abteilung Adresse HausNr von']), hausnummerZusatz: str(zeile['Abteilung Adresse HausNr Zusatz von']),
        adressKennzeichen: str(zeile['Abteilung Adresse HausNr Kennzeichen von']), ort: str(zeile['Abteilung Adresse Ort']) },
      position: !x && !y ? null : { lat: y ? Number(y.replace(',', '.')) : NaN, lng: x ? Number(x.replace(',', '.')) : NaN } })
  }
  return objektPruefen({ id, quelle: 'excel',
    name: zeile['Objekt-Krankenhaus Name'],
    typId: quellObjektTyp(zeile.Typ), aktiv: true,
    adresse: { strasse: str(zeile['Adresse Strasse'] ?? zeile['Adresse Straße']), hausnummer: str(zeile['Adresse HausNr von']),
      hausnummerZusatz: str(zeile['Adresse HausNr Zusatz von']),
      adressKennzeichen: str(zeile['Adresse HausNr Kennzeichen von']), ort: str(zeile['Adresse Ort']),
      gemeinde: '', postleitzahl: str(zeile.Postleitzahl) },
    position: !lat && !lng ? null : { lat: lat ? Number(lat.replace(',', '.')) : NaN, lng: lng ? Number(lng.replace(',', '.')) : NaN },
    bemerkung: '', abteilungen,
  })
}

// Matching keys never replace the visible original name.
export function objektDuplikatSchluessel(o) {
  const normal = v => String(v ?? '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/\s+/g, ' ')
  const a = o.adresse, name = normal(o.name), keys = [`id:${o.id}`]
  if (o.position) keys.push(JSON.stringify(['position', name, o.typId, o.position.lat.toFixed(6), o.position.lng.toFixed(6)]))
  if (a.strasse && a.hausnummer && a.ort) keys.push(JSON.stringify(['adresse', name, o.typId, ...['strasse', 'hausnummer', 'hausnummerZusatz', 'adressKennzeichen', 'ort', 'postleitzahl'].map(k => normal(a[k]))]))
  if (!o.position) keys.push(JSON.stringify(['ohnePosition', name, o.typId, ...[...adressFelder, 'hausnummerZusatz'].map(k => normal(a[k]))]))
  return keys
}

export function objektImportZusammenfuehren(bestand, importDaten) {
  const basis = objektDatenPruefen(bestand)
  if (!Array.isArray(importDaten?.objekte)) throw new Error('Objektimport benötigt objekte[].')
  const schluessel = new Map(basis.objekte.flatMap(o => objektDuplikatSchluessel(o).map(k => [k, o])))
  const hinzugefuegt = new Set()
  const statistik = { eingeleseneZeilen: importDaten.objekte.length, erfolgreichImportiert: 0, uebersprungen: 0, duplikate: 0, unbekannteTypen: 0, fehler: 0 }
  const details = []
  for (const [index, eintrag] of importDaten.objekte.entries()) {
    try {
      const o = objektPruefen(eintrag)
      if (o.typId === 'unklassifiziert') statistik.unbekannteTypen++
      const keys = objektDuplikatSchluessel(o)
      const vorhanden = keys.map(k => schluessel.get(k)).find(Boolean)
      if (vorhanden) {
        statistik.duplikate++; statistik.uebersprungen++
        // Merge secondary addresses only between newly imported rows, never into user records.
        if (hinzugefuegt.has(vorhanden)) {
          const adrKey = a => JSON.stringify([...adressFelder, 'hausnummerZusatz'].map(f => a[f] || ''))
          const gesehen = new Set([vorhanden.adresse, ...(vorhanden.weitereAdressen || [])].map(adrKey))
          for (const a of [o.adresse, ...(o.weitereAdressen || [])]) {
            if (!gesehen.has(adrKey(a))) { (vorhanden.weitereAdressen ??= []).push(a); gesehen.add(adrKey(a)) }
          }
          const abteilungen = new Set((vorhanden.abteilungen || []).map(a => JSON.stringify(a)))
          for (const a of o.abteilungen || []) {
            const key = JSON.stringify(a)
            if (!abteilungen.has(key)) { (vorhanden.abteilungen ??= []).push(a); abteilungen.add(key) }
          }
          for (const key of keys) schluessel.set(key, vorhanden)
        }
        details.push({ index, id: o.id, grund: hinzugefuegt.has(vorhanden) ? 'Duplikat zusammengeführt; zusätzliche Adressen und Abteilungen erhalten.' : 'Duplikat; vorhandenes Objekt bleibt unverändert.' })
        continue
      }
      for (const key of keys) schluessel.set(key, o)
      hinzugefuegt.add(o)
      basis.objekte.push(o); statistik.erfolgreichImportiert++
    } catch (e) {
      statistik.fehler++; statistik.uebersprungen++
      details.push({ index, grund: e.message })
    }
  }
  return { daten: basis, statistik, details }
}
