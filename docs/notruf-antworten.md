# Strukturierte medizinische Notrufantworten

Die bestehenden Buttons und Frage-IDs in `src/data/notruf/medizin.js` bleiben
erhalten. Ein Klick übergibt `{ kategorie: 'medizin', frageId: 'atmung-genug-luft' }`.
Die App liest den gesprochenen Fragetext aus dem Katalog; die Antwortlogik erhält
die ID. Eine Änderung der Beschriftung oder Formulierung ändert die Antwort nicht.

Die fünf medizinischen Vorlagen in `src/data/notrufSzenarien.js` enthalten
`notrufFakten`, zum Beispiel:

```js
notrufFakten: {
  anruferPosition: 'vorOrt', // alternativ selbst / entfernt
  akutesProblem: 'Mein Mann bekommt plötzlich ganz schlecht Luft.',
  atmungAusreichend: false,
  reagiertNormal: true,
  brustbeschwerden: true,
  laehmung: null,
  details: { atmungAusreichend: 'Er atmet ganz schnell.' }
}
```

`antwortAufFrage` in `src/data/notruf/antwortLogik.js` verbindet jede medizinische
Frage-ID mit einem Fakt und passenden Ja-/Nein-Texten. `null`, fehlende oder
ungültige Werte ergeben „Das kann ich nicht beurteilen.“ Unbekannt wird niemals
als Nein behandelt. Details ergänzen bekannte Fakten; sie sind keine Diagnosen
und müssen zum hinterlegten Fakt passen. Die Fakten beschreiben das Wissen des
Anrufers, nicht eine verborgene tatsächliche Lage.

Basisfragen verwenden Anrufername, Adresse, akutes Problem und die Position des
Anrufers. Wiederholte Fragen liefern bei unveränderten Fakten dieselbe Antwort.
Die Auswahl eines Anrufs kopiert seine Vorlage, sodass spätere Änderungen am
laufenden Gespräch nicht den Katalog verändern.

Die strukturierte Abfrage verwendet keine Keywords und keine zufälligen
Standardantworten. Die bisherige Keyword-Suche bleibt ausschließlich für den
separaten Freitextweg bestehen. Andere Einsatzarten werden noch nicht mit
medizinischen Fakten ergänzt; fehlende Angaben führen auch dort zu einer
unbekannten Antwort. Funk, Einsatzbedarf und Lagevarianten bleiben unabhängig.

Tests: `tests/notrufAntworten.test.mjs` prüft alle Frage-IDs, Ja/Nein/unbekannt,
Basisfragen und den App-Klickpfad mit absichtlich irreführendem Fragetext.
