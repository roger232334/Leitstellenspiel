// Immutable imported base. User settings live exclusively in gebiet.js/localStorage.
let bestand = null
let laden = null
export const osmStatus = { zustand: 'offen', meldung: '', manifest: null }
export const osmStammdaten = () => bestand

export function osmBestandSetzen(daten) {
  bestand = daten
}

function entpacken(datei) {
  if (!Array.isArray(datei.spalten) || !Array.isArray(datei.zeilen)) throw new Error('Ungültige OSM-Datendatei.')
  return datei.zeilen.map(zeile => Object.fromEntries(datei.spalten.map((k, i) => [k, zeile[i]])))
}

export function osmDatenLaden(fetcher = globalThis.fetch, basis = `${import.meta.env?.BASE_URL || '/'}data/gebiet/`) {
  if (laden) return laden
  laden = (async () => {
    osmStatus.zustand = 'laden'
    try {
      const response = await fetcher(`${basis}manifest.json`, { cache: 'no-cache' })
      if (response.status === 404) { osmStatus.zustand = 'fehlt'; osmStatus.meldung = 'Noch kein lokaler OSM-Import vorhanden.'; return null }
      if (!response.ok) throw new Error(`Manifest: HTTP ${response.status}`)
      const m = await response.json()
      if (m.version !== 1 || !m.dateien?.['orte.json'] || !m.dateien?.['gebiete.json']) throw new Error('Ungültiges OSM-Manifest.')
      const read = async name => {
        const file = m.dateien[name]
        if (!file || !/^[\w-]+\/[\w.-]+\.json$/.test(file.pfad)) throw new Error('Ungültiger OSM-Dateipfad.')
        const r = await fetcher(basis + file.pfad)
        if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`)
        return r.json()
      }
      const [gebiete, orte] = await Promise.all([read('gebiete.json'), read('orte.json')])
      const daten = { manifest: m, gemeinden: gebiete.gemeinden, kreise: gebiete.kreise, ortschaften: orte, strassen: [], adressen: [], pois: [] }
      // Limit concurrent parsing/downloads. Never expose a half-loaded snapshot.
      for (const kreis of gebiete.kreise) {
        for (const typ of ['strassen', 'adressen']) daten[typ].push(...entpacken(await read(`${typ}-${kreis.id}.json`)))
      }
      daten.orteIndex = new Map(orte.map(o => [o.id, o]))
      daten.gemeindenIndex = new Map(gebiete.gemeinden.map(g => [g.id, g]))
      // POI files remain on disk until explicitly requested; not turned into user objects.
      daten.poisLaden = async kreisId => entpacken(await read(`pois-${kreisId}.json`))
      osmBestandSetzen(daten)
      Object.assign(osmStatus, { zustand: 'bereit', manifest: m, meldung: '' })
      return daten
    } catch (e) {
      Object.assign(osmStatus, { zustand: 'fehler', meldung: `OSM-Daten nicht geladen: ${e.message}` })
      return null
    }
  })()
  return laden
}
