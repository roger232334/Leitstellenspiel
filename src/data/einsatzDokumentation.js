export function dokumentationEintraege(einsatz) {
  if (!einsatz) return []
  const alt = einsatz.dokumentation?.trim()
  return [...(alt ? [{ id: 'altbestand', text: einsatz.dokumentation, zeit: null }] : []), ...(einsatz.dokumentationEintraege || [])]
}

export function dokumentationUebernehmen(einsatz, zeit) {
  const text = einsatz?.dokumentationEntwurf?.trim()
  if (!text || !Number.isFinite(zeit)) return false
  ;(einsatz.dokumentationEintraege ??= []).push({ id: crypto.randomUUID(), zeit, text })
  einsatz.dokumentationEntwurf = ''
  return true
}
