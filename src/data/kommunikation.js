export const kommunikationsKanaele = { telefon: 'Telefon', funk: 'Funk' }
const sprecherRollen = { anrufer: 'Anrufer', disponent: 'Disponent', funkstelle: 'Funkstelle' }

// Ausschließlich tatsächlich gesprochene Inhalte. Chronik/FMS bleiben separat.
export function kommunikationsBeitrag({ kanal, rolle, absender = sprecherRollen[rolle], text, zeit }) {
  if (!Object.hasOwn(kommunikationsKanaele, kanal)) throw new Error('Kommunikationskanal fehlt oder ist ungültig.')
  if (!Object.hasOwn(sprecherRollen, rolle)) throw new Error('Ungültige Sprecherrolle.')
  if (typeof text !== 'string' || !text.trim() || typeof absender !== 'string' || !absender.trim()) throw new Error('Sprachbeiträge benötigen Text und Absender.')
  if (!Number.isFinite(zeit)) throw new Error('Sprachbeiträge benötigen eine Simulationszeit.')
  return { id: crypto.randomUUID(), art: 'sprache', kanal, rolle, absender: absender.trim(), text: text.trim(), zeit }
}

export function istSprachbeitrag(eintrag) {
  return !!eintrag && eintrag.art === 'sprache'
    && Object.hasOwn(kommunikationsKanaele, eintrag.kanal)
    && Object.hasOwn(sprecherRollen, eintrag.rolle)
    && typeof eintrag.absender === 'string' && !!eintrag.absender.trim()
    && typeof eintrag.text === 'string' && !!eintrag.text.trim()
}
