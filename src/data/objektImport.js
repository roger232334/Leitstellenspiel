import { objektDatenLaden, objektDatenSpeichern, objektImportZusammenfuehren } from './objektVerwaltung.js'

export const objektImportStatus = { zustand: 'offen', meldung: '', statistik: null, quellStatistik: null }

export async function objektImportLaden(fetcher = globalThis.fetch, speicher = globalThis.localStorage) {
  Object.assign(objektImportStatus, { zustand: 'laden', meldung: '', statistik: null, quellStatistik: null })
  try {
    const response = await fetcher(`${import.meta.env?.BASE_URL || '/'}data/objekte/excel.json`, { cache: 'no-cache' })
    if (response.status === 404) { objektImportStatus.zustand = 'fehlt'; return }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const datei = await response.json()
    const pakete = datei.pakete ?? [datei]
    if (datei.version !== 1 || !Array.isArray(pakete) || pakete.some(p => p.version !== 1 || !p.import?.id?.startsWith('excel:') || !Array.isArray(p.objekte) || p.objekte.some(o => o.quelle !== 'excel'))) throw new Error('Ungültiges Excel-Importpaket.')
    let bestand = objektDatenLaden(speicher)
    const offen = pakete.filter(p => !bestand.importe?.includes(p.import.id))
    objektImportStatus.quellStatistik = pakete.at(-1)?.import.statistik ?? null
    if (!offen.length) { objektImportStatus.zustand = 'bereits-importiert'; return }
    const statistik = { eingeleseneZeilen: 0, erfolgreichImportiert: 0, uebersprungen: 0, duplikate: 0, unbekannteTypen: 0, fehler: 0 }
    for (const paket of offen) {
      const result = objektImportZusammenfuehren(bestand, paket)
      if (result.statistik.fehler) throw new Error(`${result.statistik.fehler} ungültige Objekte im Importpaket; Bestand bleibt unverändert.`)
      result.daten.importe = [...(bestand.importe || []), paket.import.id]
      bestand = result.daten
      for (const key of Object.keys(statistik)) statistik[key] += result.statistik[key]
    }
    // Objects and receipt are one atomic localStorage write. Quota errors permit retry.
    objektDatenSpeichern(bestand, speicher)
    Object.assign(objektImportStatus, { zustand: 'importiert', statistik,
      meldung: `${statistik.erfolgreichImportiert} Excel-Objekte übernommen, ${statistik.duplikate} Dubletten übersprungen. Bestehende Objekte bleiben unverändert.` })
  } catch (e) {
    Object.assign(objektImportStatus, { zustand: 'fehler', meldung: `Excel-Objektimport fehlgeschlagen: ${e.message}` })
  }
}
