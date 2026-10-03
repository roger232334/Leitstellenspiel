# Tatsächlicher Einsatzbedarf

Der [datengetriebene Einsatzgenerator](einsatzgenerator.md) erzeugt Bedarf aus Lagevarianten. Bei diesen Einsätzen bleibt die Auswertung bis zur Erkundung (`szenario.lageBekannt`) verborgen; vorhandene Einsätze ohne Szenariodaten bleiben unverändert.

AAO und Bedarf bleiben unabhängig: Die AAO schlägt anhand des Meldebilds Fahrzeugtypen vor. `einsatz.bedarf` beschreibt die tatsächlichen Anforderungen, ohne einen Fahrzeugtyp vorzuschreiben. Aus AAO-Vorschlägen wird kein Bedarf abgeleitet. Es gibt keine automatische Nachalarmierung.

```js
einsatz.bedarf = {
  ressourcen: { wasserLiter: 3200, atemschutzgeraete: 6 },
  ausruestung: ['beleuchtung', 'schneidSpreizwerkzeug'],
  // Optional: abgeleitete Fähigkeiten statt einzelner Ausrüstung fordern.
  // faehigkeiten: ['technische-rettung']
}
```

Die IDs stammen aus dem Ausrüstungskatalog. Bekannte Aliase wie `schneid-spreizwerkzeug` werden auf die Speicher-ID normalisiert. Unbekannte IDs und ungültige Mengen werden abgewiesen; die Oberfläche zeigt einen Auswertungsfehler statt einen vermeintlich erfüllten Bedarf.

Ohne Bedarf (fehlend oder `null`) liefert die Prüfung `definiert: false, erfuellt: null`. Die Anzeige meldet dann „Noch kein tatsächlicher Einsatzbedarf hinterlegt“. Ein explizites leeres Bedarfsobjekt gilt dagegen als bekannt und erfüllt.

## Auswertung

`src/data/einsatzBedarf.js` bietet:

- `bedarfNormalisieren(bedarf)`: Anforderungen validieren, Aliase vereinheitlichen.
- `berechneVerfuegbareRessourcen(fahrzeuge)`: bereits ausgewählte Fahrzeuge über den vorhandenen Beladungshelfer summieren, ohne eigene Einsatz-/Statusauswahl.
- `bedarfsKontext(einsatz, einsaetze)`: Bedarfsquelle und zugehörige Einsatz-IDs bestimmen.
- `bedarfsFahrzeuge(einsatz, fahrzeuge, optionen)`: tatsächlich gebundene Fahrzeuge filtern.
- `pruefeEinsatzBedarf(einsatz, fahrzeuge, optionen)`: detaillierte Ressourcen-, Ausrüstungs- und Fähigkeitsprüfung.

```js
const lage = pruefeEinsatzBedarf(einsatz, alleFahrzeuge, { einsaetze })
const amOrt = pruefeEinsatzBedarf(einsatz, alleFahrzeuge, {
  einsaetze,
  nurAmOrt: true,
})
// lage.ressourcen.wasserLiter:
// { benoetigt: 3200, vorhanden: 1600, fehlt: 1600, erfuellt: false }
// lage.ausruestung.schneidSpreizwerkzeug:
// { benoetigt: true, vorhanden: true, erfuellt: true }
```

Entscheidend ist `fahrzeug.einsatzId`, nicht `einsatz.fahrzeuge`: Letzteres enthält bereits Vorschläge und noch nicht alarmierte Auswahlen. Die Gesamtanzeige zählt Status 3 (alarmiert/unterwegs) und 4 (am Einsatzort). Die zusätzliche Ortsanzeige zählt nur Status 4. Freie Fahrzeuge, fremde Einsätze, Status 6 sowie Transportstatus 7/8 zählen nicht zur Versorgung der Einsatzstelle. Wieder freigegebene Fahrzeuge entfallen automatisch.

Ein Bedarf am Haupteinsatz umfasst dessen Fahrzeuge und die seiner direkten Untereinsätze. Öffnet man einen Untereinsatz ohne eigenen Bedarf, zeigt die Maske denselben gemeinsamen Hauptbedarf. Ein expliziter Untereinsatzbedarf wird nur gegen dessen Fahrzeuge geprüft. Verschiedene Bedarfe reservieren keine exklusiven Ressourcen; eine spätere Ressourcenverteilung zwischen mehreren gleichzeitigen Teilaufgaben ist noch nicht implementiert.

Mengen werden addiert, Ausrüstung ist vorhanden, wenn mindestens ein Fahrzeug sie mitführt. Doppelte Fahrzeug-IDs werden bei Mengen nur einmal berücksichtigt. Fähigkeiten nutzen die bestehenden Regeln am konkreten Fahrzeug: Für die Fähigkeit „Beleuchtung“ müssen beispielsweise Stromerzeuger und Beleuchtung auf demselben Fahrzeug vorhanden sein. Eine reine Ausrüstungsanforderung „Beleuchtung“ verlangt dagegen nur den entsprechenden Ausrüstungsschalter.

## Anzeige und manuelles Testen

Die Einsatzbearbeitung zeigt die Ressourcenlage unter den Gesprächsnotizen. Die Vue-Auswertung reagiert auf Zuordnung, Status, Beladung und Bedarf. „Hinzuf.“ in der Dispoliste öffnet die manuelle Fahrzeugauswahl; das bestehende Auswählen/Abwählen wird verwendet. Erst „Alarmieren“ oder die manuelle „Nachalarm.“ zählt das Fahrzeug in der Ressourcenlage. Das Abbestellen bereits alarmierter Fahrzeuge bleibt eine spätere Funktion.

1. Im Adminbereich zwei HLF 20 mit jeweils 1.600 Litern Wasser, vier Atemschutzgeräten und Beleuchtung vorbereiten. Für den THL-Test muss mindestens eines Schneid-/Spreizwerkzeug besitzen.
2. Schicht starten. In der Einsatzbearbeitung „Bedarf testen“ öffnen und „Testeinsatz Brand anlegen“ wählen. Es entstehen keine automatischen Starteinsätze; vorhandene Einsätze und Stammdaten werden nicht verändert.
3. Über „Hinzuf.“ das erste HLF auswählen: Der Bedarf bleibt zunächst vollständig offen. Nach „Alarmieren“ fehlen noch 1.600 Liter Wasser und zwei Atemschutzgeräte.
4. Zweites HLF hinzufügen und manuell „Nachalarm.“ drücken: Der alarmierte Bestand deckt den Bedarf. „Am Ort“ folgt erst mit Status 4.
5. „Testeinsatz THL anlegen“ erzeugt einen separaten, klar markierten Einsatz mit Schneid-/Spreizwerkzeug und Beleuchtung als Bedarf. Die Fahrzeuge des Brandtests zählen dort nicht. Fahrzeuge nach ihrer Freigabe oder andere freie Fahrzeuge auswählen und alarmieren.

Der [zentrale Lebenszyklus](einsatzlebenszyklus.md) hält Fahrzeuge bis zum zeitgesteuerten Einsatzende gebunden. Die Ressourcenanzeige bleibt eine Live-Auswertung; Fehlbedarf beeinflusst die Phasendauer noch nicht. Die Testeinsätze haben keine Kartenposition und verwenden die zentral hinterlegte Standard-Anfahrtszeit.

## Vorbereitung für spätere Schritte

Bedarf ist optional und kann nach Erkundung gesetzt, durch eine Einsatzvariante ersetzt oder während des Einsatzes verändert werden. Die Prüfung mutiert weder Bedarf noch Fahrzeuge und speichert keine veralteten Ergebnisse. Veränderungen an den aktuellen Mengen werden bereits berücksichtigt. Ein Verbrauchsmodell, Personalressourcen, automatische Varianten, Priorisierung, Nachalarmierung und bedarfsabhängiger Einsatzfortschritt sind noch nicht implementiert.

Weitere quantitative Ressourcen werden zentral im Katalog ergänzt; die Auswertung und Anzeige benötigen dafür keine typbezogenen Sonderfälle. Künftige Nachforderungsvorschläge können die Felder `fehlt` und `erfuellt` nutzen, ohne die AAO oder die manuelle Disposition zu ersetzen.

Prüfung: `node --test tests/einsatzBedarf.test.mjs`; vollständige Suite: `node --test tests/*.test.mjs`.
