# Objekte / POI

Im Startmenü den **Adminbereich → Objekte / POI** öffnen. Mit **Objekt anlegen**
einen Namen und Typ wählen, optional Adressfelder, Position und Bemerkung ergänzen
und speichern. Bearbeiten erhält die interne ID. Deaktivieren erhält das Objekt
für spätere Referenzen; Löschen entfernt es endgültig und erfordert Bestätigung.
Beim Verlassen eines offenen Formulars wird vor dem Verwerfen gefragt.

## Speicherung und Modell

### Fahrzeuge einer Wache zuordnen

Unter **Adminbereich → Fahrzeuge → Fahrzeug anlegen/bearbeiten** im Feld
**Stationierte Wache aus Objektliste suchen** nach Name, Ort oder Typ suchen und
ein aktives Objekt auswählen. Alle Objekttypen sind erlaubt, beispielsweise auch
Krankenhäuser als Hubschrauberstandorte. Der vollständige Objektname bleibt erhalten.
`wacheId` verweist auf die Objekt-ID; `wacheName` ist eine lesbare Momentaufnahme.
Name und Koordinaten werden beim Speichern und beim nächsten Schichtstart aus dem
Objekt übernommen. Fahrbewegungen ändern niemals die Koordinaten des Wachenobjekts.
Fehlende/deaktivierte Wachen oder Wachen ohne Koordinaten ergeben beim Schichtstart
keine Fahrzeugposition; es werden keine veralteten Koordinaten verwendet.
Alte Freitextzuordnungen bleiben sichtbar, werden aber nicht anhand des Namens
automatisch verknüpft. **Zuordnung entfernen** löscht auch den übernommenen Standort.

`src/data/objektVerwaltung.js` verwaltet den eigenen localStorage-Schlüssel
`leitstellensimulator-objekte-v1` als `{ version: 1, objekte: [...], importe?: [...] }`.
Fahrzeugdaten und bestehende Wachen bleiben unverändert. Ohne gespeicherte Objekte
oder bereitgestelltes Excel-Importpaket startet der Bestand leer.
Fehlerhafte Speicherinhalte werden gemeldet und nicht automatisch überschrieben.
Speicherfehler behalten den aktuellen Entwurf bei.

```js
{
  id: 'stabile-uuid',
  quelle: 'manuell', // alternativ 'excel' oder 'osm'
  name: 'Testsee',
  typId: 'gewaesser',
  adresse: {
    strasse: '', hausnummer: '', adressKennzeichen: 'SEE',
    ort: '', gemeinde: '', postleitzahl: ''
  },
  position: { lat: 49.0134, lng: 12.1016 }, // WGS84, oder null
  aktiv: true,
  bemerkung: ''
}
```

Alle Adressfelder dürfen fehlen. Auch Objekte ohne Position dürfen als noch
unvollständige Stammdaten gespeichert werden. Für eine Position müssen beide
gültigen Koordinaten vorhanden sein. Ein Koordinatenpaar 0/0 bleibt gültig.

## Typen

`src/data/objektTypen.js` enthält die 35 vorgegebenen Typen mit stabilen IDs und
lesbaren Namen sowie `unklassifiziert` als separaten Fallback. „Nicht vorhanden“
wird beim späteren Import auf diesen Fallback abgebildet; es ist kein eigener
Objekttyp. `sonstiges` bleibt eine eigenständige bewusste Klassifizierung.

## Position und Ortssuche

Die bestehende Leaflet-Instanzverwaltung wird für die kleine Karte wiederverwendet.
Klick auf die Karte oder Ziehen des Markers aktualisiert die Koordinatenfelder.
Manuelle Eingaben aktualisieren den Marker. „Position leeren“ entfernt die Position.
Für die Karte werden dieselben OSM-Kacheln und dieselbe Attribution wie in der
Lagekarte verwendet. Bei Netzwerkproblemen bleibt die manuelle Eingabe nutzbar.

„Adresse suchen“ verwendet `orteSuchen` mit bestehender Drosselung und Cache.
Es gibt keine automatische Suche beim Tippen. Erst die Auswahl eines Treffers
übernimmt seine Position. Adress- und Koordinatenänderungen entwerten ausstehende
Ergebnisse, ebenso ein Wechsel des bearbeiteten Objekts. Das Kennzeichen wird
nicht als Hausnummernsuffix an den Suchdienst geschickt.

## Größere Bestände und spätere Simulation

Suche nach Name sowie Typ- und Aktivfilter laufen reaktiv über den Bestand.
Es werden höchstens 50 Objektzeilen gleichzeitig gerendert. Ein Test mit 2.000
Objekten deckt Validierung und Referenzierbarkeit ab. Für wesentlich größere
Bestände oder gemeinsame Mehrbenutzerdaten wäre IndexedDB bzw. ein Backend
sinnvoll; localStorage bleibt in diesem Schritt das bestehende Speichermuster.

Ein späterer Einsatz kann `objektId` speichern und über `objektZu` auflösen.
`aktiveKartenObjekte(objekte, typIds)` liefert aktive Objekte mit Position,
optional nach Typ gefiltert. Die Lagekarte lädt noch keine neuen POI-Ebenen.
Automatische Einsatzgenerierung und die Verknüpfung der Fahrzeugwachen werden
nicht verändert. Künftige Einsatzreferenzen müssen vor endgültigem Löschen
geprüft werden; Deaktivieren ist dafür die verlusterhaltende Alternative.

## Excel-Import

`scripts/objekte/import-excel.js` liest XLSX mit ExcelJS (nur lokale
Entwicklungsabhängigkeit) und übergibt die Zellwerte an den bestehenden
`objektAusQuellzeile`-Adapter. Typzuordnung und Validierung bleiben im bisherigen
Objektsystem. Es gibt keinen zweiten Objektkatalog und keine zweite Speicherung.

```powershell
npm run import-objekte -- "C:\Users\bachv\Downloads\2023-10-20 R-L - Objekte.xlsx"
```

Der Leser erkennt das Datenblatt und die Kopfzeile an den Spaltennamen. Berichts-
und Informationsblätter werden nicht als Objekte behandelt. Formeln werden nicht
ausgeführt; vorhandene Ergebniswerte können gelesen werden. Fehlerhafte Zeilen
werden einzeln protokolliert. Die Ausgabe `public/data/objekte/excel.json` enthält
validierte Objekte im bisherigen Modell sowie Importstatistik und Zeilenhinweise.
Eine erfolgreiche Dateierzeugung ersetzt das Paket atomar. Die Quelldatei bleibt
unverändert. Vite übernimmt das Paket beim Build nach `dist`.

Beim nächsten vollständigen Laden der Anwendung übernimmt `objektImportLaden`
das Paket mit `objektImportZusammenfuehren` in den bestehenden lokalen Objektbestand.
Vorhandene Datensätze haben immer Vorrang, auch manuelle Notizen und Deaktivierungen.
Eine Importquittung (`importe`) wird zusammen mit den Objekten in einem einzigen
localStorage-Schreibvorgang gespeichert. Dasselbe Paket wird danach nicht erneut
eingespielt; gelöschte Objekte erscheinen beim Neuladen desselben Imports nicht wieder.
Bei Speicherfehlern bleibt der bisherige Bestand unverändert und der Import kann beim
nächsten Start erneut versucht werden. Ein beschädigter Bestand wird nicht überschrieben.

`quelle` unterscheidet `excel`, `osm` und `manuell`; die Quellenangabe ist in der
Objektliste sichtbar. Alte UUID-Objekte gelten als manuell, alte `osm:`-IDs als OSM.
Dateien aus OSM werden durch diesen Import nicht automatisch übernommen.

Dublettenprüfung: ID oder gleicher normalisierter Suchname und Typ plus Position
(sechs Nachkommastellen) oder vollständige Adresse. Diese Vergleichsschlüssel ändern
den sichtbaren Originalnamen nicht. Verschiedene Namen am selben Standort bleiben
verschiedene Objekte. Zusätzliche Anschriften mehrfach erfasster neuer Excel-Objekte
werden als `weitereAdressen` gespeichert und angezeigt; vorhandene Benutzerobjekte
werden bei einer Übereinstimmung dagegen vollständig unverändert belassen.
Excel-IDs sind aus dem Datensatzinhalt abgeleitet und bei unveränderten Zeilen stabil.
Ohne fachlichen externen Schlüssel kann eine umfassend geänderte Quellzeile später
als neues Objekt erkannt werden; eine automatische Überschreibung gibt es nicht.

Import vom 03.10.2026: Datei `2023-10-20 R-L - Objekte.xlsx`, Blatt `Report`,
Kopfzeile 18. 1.987 Datenzeilen, 1.976 Objekte, 11 als Dubletten zusammengeführte
Zeilen mit erhaltenen Zusatzadressen, 75 unbekannte Typangaben (`NICHT VORHANDEN`),
0 Fehler. Die unbekannten Typen bleiben als `unklassifiziert` erhalten und können
im Adminbereich gefiltert werden. Die 11 Dubletten sind in „übersprungen“ enthalten;
die 75 unbekannten Typen zählen zu den erfolgreich importierten Objekten.
Zusätzliche Überschneidungen mit dem individuellen Browserbestand werden erst
bei dessen Zusammenführung ermittelt und im Adminbereich gemeldet.

| Quellspalte | Zielfeld |
| --- | --- |
| Objekt-Krankenhaus Name | name, vollständiger Originalwert ohne Bereinigung |
| XKoord_WGS84 | position.lng |
| YKoord_WGS84 | position.lat |
| Adresse Strasse | adresse.strasse |
| Adresse HausNr von | adresse.hausnummer |
| Adresse HausNr Kennzeichen von | adresse.adressKennzeichen, unverändert |
| Adresse Ort | adresse.ort |
| Typ | typId über zentralen Katalog |
| Postleitzahl | adresse.postleitzahl |

Der sichtbare `name` bleibt einschließlich `3.2.2 R-L`, Groß-/Kleinschreibung,
Leerzeichen und technischer Bestandteile unverändert. Import, Validierung und
Speichern/Laden kürzen oder normalisieren ihn nicht; dies gilt auch beim erneuten
Import derselben Zeile. Es gibt keine Längenbegrenzung von 250 Zeichen für Namen.
Der XLSX-Leser gibt den ursprünglichen Zelltext unverändert weiter.
Bereits früher entfernte Präfixe lassen sich nur aus der Originalquelle durch
erneuten Import wiederherstellen, nicht aus dem gekürzten gespeicherten Namen.

Gemeinde bleibt leer, wenn sie nicht geliefert wird. Dezimalkommas sind erlaubt.
Nur ein vorhandener Koordinatenwert wird als Fehler abgewiesen. Unbekannte Typen
gehen auf `unklassifiziert` und sollten in der Importvorschau überprüft werden.
PLZ und Kennzeichen bleiben Text; numerische PLZ mit Excel-Format `00000` behalten
ihre führenden Nullen. Manuelle IDs sind UUIDs; Excel-IDs werden aus dem vollständigen
Datensatzinhalt gebildet (nicht allein aus dem Namen).

### Weitere Datei: Stadt Regensburg

Der Importbefehl ergänzt jetzt weitere Dateien als eigenständige Pakete unter
`{ version: 1, pakete: [...] }` in derselben `excel.json`. Vorhandene Pakete werden
unverändert übernommen, identische Dateien nicht nochmals angehängt. Der Startimport
verarbeitet ausschließlich noch nicht quittierte Pakete. Bereits bearbeitete oder
gelöschte Objekte eines früheren Imports werden dadurch nicht neu angelegt.
Das bisherige Format mit einem einzelnen Paket bleibt lesbar.

```powershell
npm run import-objekte -- "C:\Users\bachv\Desktop\objekte r-s für leitstellensim.xlsx"
```

Diese Datei verwendet `Adresse Straße` statt `Adresse Strasse`; der vorhandene
Adapter akzeptiert beide Schreibweisen. `Adresse HausNr Zusatz von` wird als
optionales `adresse.hausnummerZusatz` gespeichert. Abteilungsname, eigene Adresse
und eigene Koordinaten bleiben in `abteilungen` erhalten. Identische Abteilungen
werden zusammengeführt und in der Objektliste aufklappbar angezeigt. Haupt- und
Abteilungsnamen werden nicht bereinigt. Die neuen Typen `gruenflaeche` und `berg`
gehören zum zentralen Objekttypkatalog.

Import vom 03.10.2026: 4.057 Zeilen, 2.582 zusätzliche Objekte, 1.475 zusammengeführte
Mehrfachzeilen, 0 Fehler. 72 Zeilen ohne Typ ergeben nach Zusammenführung 71 Objekte
mit `unklassifiziert`. 1.640 unterschiedliche Abteilungen wurden erhalten;
82 Objekte haben keine eigene Position. Fehlende Koordinaten werden nicht erfunden.
Beide Quelldateien zusammen enthalten 4.558 Objekte. Der alte Landkreis-Import wurde
vor und nach der Ergänzung vollständig verglichen und bleibt unverändert.
# Alias und Objektauswahl in der Einsatzbearbeitung

Im Objekteditor kann ein optionaler `alias` (bis 250 Zeichen) gespeichert werden.
Der Originalname `name` bleibt unverändert und wird weiterhin angezeigt. Mehrere
Objekte dürfen denselben Alias tragen, beispielsweise `NOT R` für Notaufnahmen.
Ein erneuter Excel-Import überschreibt vorhandene Aliase nicht.

Das Feld **Objekt / Stat.** durchsucht den gespeicherten Objektbestand nach
Originalname, Alias, Typ und Adresse. Die Treffer erscheinen direkt im Feld,
jeweils 50 weitere sind nachladbar. Auch Objekte ohne Koordinaten und inaktive
Objekte sind auffindbar; inaktive Treffer sind entsprechend gekennzeichnet.
Die normale Straßen-/Ortssuche bleibt davon getrennt.

Die Auswahl übernimmt Originalname, Objekt-ID, primäre Adresse und vorhandene
Koordinaten. Hausnummernzusätze werden im Hausnummernfeld angezeigt; PLZ und
Adresskennzeichen bleiben zusätzlich in den Erfassungsdaten erhalten. Fehlende
Angaben leeren vorherige Werte. Bei hinterlegter Gemeinde wird diese als Ort und
der abweichende lokale Ort als Ortsteil übernommen. Zusätzliche Importadressen
werden nicht automatisch als primärer Einsatzort verwendet.

