import ExcelJS from 'exceljs'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { objektAusQuellzeile, objektImportZusammenfuehren, objektDatenPruefen } from '../../src/data/objektVerwaltung.js'

function zelltext(cell) {
  if (cell.value == null) return ''
  if (cell.type === ExcelJS.ValueType.Error) throw new Error(`Excel-Fehler in ${cell.address}`)
  if (cell.type === ExcelJS.ValueType.Formula && cell.result == null) throw new Error(`Formel ohne gespeichertes Ergebnis in ${cell.address}`)
  // Excel stores numeric postal codes separately from their display format.
  const value = cell.type === ExcelJS.ValueType.Formula ? cell.result : cell.value
  if (typeof value === 'number' && Number.isInteger(value) && /^0+$/.test(cell.numFmt)) return String(value).padStart(cell.numFmt.length, '0')
  return cell.text // Rich text is concatenated by ExcelJS; no trimming of original names.
}

export async function excelObjekteLesen(datei) {
  const bytes = await readFile(datei)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(bytes)
  const kandidaten = []
  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row, number) => {
      const header = new Map()
      row.eachCell((cell, col) => header.set(cell.text.trim(), col))
      if (header.has('Objekt-Krankenhaus Name') && header.has('Typ')) kandidaten.push({ sheet, number, header })
    })
  }
  if (kandidaten.length !== 1) throw new Error('Genau eine Objekttabelle mit den Spalten „Objekt-Krankenhaus Name“ und „Typ“ erwartet.')
  const { sheet, number, header } = kandidaten[0]
  const objekte = [], zeilen = [], details = [], unbekannteTypen = {}
  let eingeleseneZeilen = 0, leereZeilen = 0
  for (let n = number + 1; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n)
    if (![...header.values()].some(col => row.getCell(col).value != null && row.getCell(col).text !== '')) { leereZeilen++; continue }
    eingeleseneZeilen++
    try {
      const werte = Object.fromEntries([...header].filter(([name]) => name).map(([name, col]) => [name, zelltext(row.getCell(col))]))
      const objekt = objektAusQuellzeile(werte, 'excel:vorlaeufig')
      // Content identity remains stable across row sorting and repeated exports.
      objekt.id = 'excel:' + createHash('sha256').update(JSON.stringify([objekt.name, objekt.adresse, objekt.position, objekt.typId])).digest('hex').slice(0, 32)
      if (objekt.typId === 'unklassifiziert') unbekannteTypen[werte.Typ || '(leer)'] = (unbekannteTypen[werte.Typ || '(leer)'] || 0) + 1
      objekte.push(objekt); zeilen.push(n)
    } catch (e) { details.push({ zeile: n, grund: e.message }) }
  }
  const merge = objektImportZusammenfuehren({ version: 1, objekte: [] }, { objekte })
  const fehler = details.length + merge.statistik.fehler
  const statistik = { eingeleseneZeilen, erfolgreichImportiert: merge.statistik.erfolgreichImportiert,
    uebersprungen: details.length + merge.statistik.uebersprungen, duplikate: merge.statistik.duplikate,
    unbekannteTypen: merge.statistik.unbekannteTypen, fehler }
  return { version: 1, objekte: merge.daten.objekte, import: {
    id: 'excel:' + createHash('sha256').update(bytes).digest('hex'), datei: path.basename(datei), blatt: sheet.name, kopfzeile: number,
    statistik, leereZeilen, unbekannteTypen,
    details: [...details, ...merge.details.map(d => ({ zeile: zeilen[d.index], id: d.id, grund: d.grund }))],
  } }
}

export function excelImportErgaenzen(alt, neu) {
  const pakete = alt ? (alt.pakete ?? [alt]) : []
  for (const p of [...pakete, neu]) {
    if (!p.import?.id?.startsWith('excel:')) throw new Error('Ungültiges bestehendes Importpaket.')
    objektDatenPruefen(p)
  }
  // Never replace an earlier package, including its original names, IDs and metadata.
  return { version: 1, pakete: pakete.some(p => p.import.id === neu.import.id) ? [...pakete] : [...pakete, neu] }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2]) throw new Error('Aufruf: npm run import-objekte -- "Pfad/zur/Datei.xlsx"')
    const daten = await excelObjekteLesen(path.resolve(process.argv[2]))
    if (!daten.objekte.length) throw new Error('Keine gültigen Objekte: bisherige Importdatei bleibt unverändert.')
    const output = fileURLToPath(new URL('../../public/data/objekte/excel.json', import.meta.url))
    let alt = null
    try { alt = JSON.parse(await readFile(output, 'utf8')) }
    catch (e) { if (e.code !== 'ENOENT') throw e }
    const sammlung = excelImportErgaenzen(alt, daten)
    await mkdir(path.dirname(output), { recursive: true })
    await writeFile(output + '.tmp', JSON.stringify(sammlung), 'utf8')
    await rename(output + '.tmp', output)
    console.log(JSON.stringify({ ...daten.import, details: `${daten.import.details.length} Zeilenhinweise in der Importdatei`, importpakete: sammlung.pakete.length, ausgabe: output }, null, 2))
  } catch (e) { console.error(e.message); process.exitCode = 1 }
}
