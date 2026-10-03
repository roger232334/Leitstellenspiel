# Kommunikationsbeiträge

`src/data/kommunikation.js` definiert die gemeinsame Struktur für gesprochene Telefoninhalte und spätere Funksprüche:

```js
{
  id: 'eindeutige UUID',
  art: 'sprache',
  kanal: 'telefon', // alternativ 'funk'; niemals aus Text abgeleitet
  rolle: 'anrufer', // alternativ 'disponent' oder 'funkstelle'
  absender: 'Anrufer',
  text: 'Hier kommt Rauch aus dem Fenster.',
  zeit: 1790985600000 // Simulationszeit in Millisekunden
}
```

`kommunikationsBeitrag(...)` validiert Kanal, Sprecher, Text und Zeit und erzeugt eine eindeutige ID. Der bestehende reaktive Verlauf heißt aus Kompatibilitätsgründen weiter `gespraech`; seine Einträge folgen jetzt dieser gemeinsamen Struktur. Alle Telefonproduzenten (Annahme, freie Fragen, Katalogfragen und Antworten) setzen ausdrücklich `kanal: 'telefon'`.

Die mittlere Anzeige filtert mit `istSprachbeitrag`: Nur bekannte Kanäle mit `art: 'sprache'` erscheinen. Beiträge ohne Kennzeichnung werden nicht geraten oder automatisch als Telefon interpretiert. Statuswechsel, Einsatzereignisse und Systemmeldungen bleiben in `ereignisse`/Chronik. Auch innerhalb eines Kanals werden Einträge anderer Art nicht als Sprache angezeigt.

Die bisherige Telefonansicht im alten Layout verwendet ausschließlich Telefonbeiträge. Bei neuem Anruf, Beenden oder Einsatzeröffnung wird wie bisher der Telefonverlauf zurückgesetzt; andere Kanäle werden dabei erhalten. Die Bezeichnungen „Telefon“ und „Funk“ im mittleren Fenster stammen ausschließlich aus dem Kanalfeld.

Die technische Funkgrundlage liegt in `src/data/funk.js`. Funkgruppen werden aus den vorhandenen Fahrzeug-Stammdaten (`funkgruppe`) gewonnen. Leerzeichen am Rand und Groß-/Kleinschreibung ergeben keine doppelten Gruppen. Stabile Gruppen-IDs werden aus dem normalisierten Namen abgeleitet; eine spätere Umbenennung entspricht derzeit einer neuen Gruppe. Fahrzeuge ohne Zuordnung werden keiner Gruppe automatisch zugeteilt.

`App.vue` hält mit `funk.aktiveGruppeId` einen vom Telefon unabhängigen Zustand. Die rechte Spalte bietet Gruppenauswahl, Fahrzeugliste und eine manuelle Funkspruch-Eingabe. „Absender (Simulation)“ kann die Leitstelle oder ein Fahrzeug der gewählten Gruppe sein. Der lange Funkrufname dient als Absender. `funkspruchErzeugen({ gruppeId, gruppen, fahrzeug, text, zeit })` validiert die Zuordnung und liefert einen Sprachbeitrag mit `kanal: 'funk'`, `funkgruppeId`, `funkgruppeName` und optionaler `fahrzeugId`.

Zum Testen im Adminbereich einem Fahrzeug eine Funkgruppe geben, Schicht starten und rechts diese Gruppe auswählen. Einen Funkspruch erzeugen, auch während eines angenommenen Telefonats. Beide Kanäle erscheinen gemeinsam und chronologisch. Gruppenwechsel verändern Telefon und Verlauf nicht; bisherige Funkbeiträge bleiben unabhängig von der ausgewählten Gruppe sichtbar. Das Beenden eines Telefonats entfernt nur dessen Telefonbeiträge.

Es gibt keinen globalen Telefon-oder-Funk-Modus, keine Sprechwünsche, keine Audioübertragung und keine automatisch erzeugten Funksprüche. Die manuelle Eingabe legt den gesprochenen Wortlaut als Simulationsbeitrag an. Systemereignisse und FMS-Statuswechsel bleiben ausschließlich in der Chronik.
