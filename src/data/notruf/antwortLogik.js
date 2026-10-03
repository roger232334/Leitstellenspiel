// Stabile Frage-IDs verbinden die Abfrage mit beobachtbaren Notruf-Fakten.
// null/fehlend bedeutet unbekannt, nicht nein. Keine Auswertung des Fragetextes.
export const medizinAntwortRegeln = {
  'atmung-genug-luft': { fakt: 'atmungAusreichend', ja: 'Ja, die Atmung wirkt ausreichend.', nein: 'Nein, die Atmung wirkt nicht ausreichend.' },
  'bewusstsein-normal': { fakt: 'reagiertNormal', ja: 'Ja, die Reaktion ist wie sonst auch.', nein: 'Nein, die Reaktion ist nicht normal.' },
  brustschmerz: { fakt: 'brustbeschwerden', ja: 'Ja, es bestehen Schmerzen oder ein Engegefühl in der Brust.', nein: 'Nein, keine Brustbeschwerden.' },
  kreislaufproblem: { fakt: 'kreislaufproblem', ja: 'Ja, es gibt ein neues Kreislaufproblem.', nein: 'Nein, ein neues Kreislaufproblem ist mir nicht aufgefallen.' },
  laehmung: { fakt: 'laehmung', ja: 'Ja, mir ist eine neue Lähmung aufgefallen.', nein: 'Nein, mir ist keine neue Lähmung aufgefallen.' },
  sprache: { fakt: 'sprachstoerung', ja: 'Ja, das Sprechen oder Verstehen ist neu gestört.', nein: 'Nein, beim Sprechen oder Verstehen ist mir nichts Neues aufgefallen.' },
  sehen: { fakt: 'sehstoerung', ja: 'Ja, es gibt neue Probleme beim Sehen.', nein: 'Nein, keine neuen Probleme beim Sehen.' },
  kopfschmerz: { fakt: 'starkerKopfschmerz', ja: 'Ja, es bestehen neue starke Kopfschmerzen.', nein: 'Nein, keine neuen starken Kopfschmerzen.' },
  gefuehl: { fakt: 'halbseitigeGefuehlsstoerung', ja: 'Ja, auf einer Seite ist das Gefühl gestört.', nein: 'Nein, keine halbseitige Gefühlsstörung.' },
  schwindel: { fakt: 'schwindelMitFallneigung', ja: 'Ja, es besteht Schwindel mit Fallneigung.', nein: 'Nein, kein Schwindel mit Fallneigung.' },
  krampfanfall: { fakt: 'krampfanfall', ja: 'Ja, es bestehen gerade Krämpfe.', nein: 'Nein, gerade keine Krämpfe.' },
}

const unbekannt = 'Das kann ich nicht beurteilen.'
export function antwortAufFrage(szenario, frageId) {
  const fakten = szenario?.notrufFakten ?? {}
  const daten = szenario?.daten ?? {}
  if (frageId === 'gespraechspartner') return daten.anrufer ? `Mein Name ist ${daten.anrufer}.` : unbekannt
  if (frageId === 'einsatzort') {
    const adresse = [[daten.strasse, daten.hausnummer].filter(Boolean).join(' '), daten.ort].filter(Boolean).join(', ')
    return adresse ? `Der Einsatzort ist ${adresse}.` : unbekannt
  }
  if (frageId === 'akutes-problem') return fakten.akutesProblem || szenario?.startText || unbekannt
  if (frageId === 'beim-patienten') {
    return { selbst: 'Ich bin selbst der Patient.', vorOrt: 'Ja, ich bin direkt beim Patienten.', entfernt: 'Nein, ich bin nicht beim Patienten.' }[fakten.anruferPosition] || unbekannt
  }
  const regel = medizinAntwortRegeln[frageId]
  if (!regel) return unbekannt
  const wert = fakten[regel.fakt]
  if (wert !== true && wert !== false) return unbekannt
  const antwort = wert ? regel.ja : regel.nein
  const detail = fakten.details?.[regel.fakt]
  return typeof detail === 'string' && detail.trim() ? `${antwort} ${detail.trim()}` : antwort
}
