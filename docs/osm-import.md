# Lokaler OSM-Import

## Einrichten und ausführen

Voraussetzungen: das bestehende Node-Projekt und Python 3.11 oder neuer.
Getestet unter Windows mit Python 3.14, pyosmium 4.3.1 und Shapely 2.1.2.

1. Auf [Geofabrik: Oberpfalz](https://download.geofabrik.de/europe/germany/bayern/oberpfalz.html)
   die Datei `oberpfalz-latest.osm.pbf` herunterladen.
2. Unter `data/osm/oberpfalz-latest.osm.pbf` im Projekt ablegen.
3. Einmal `npm run setup-osm` ausführen. Das installiert die Bibliotheken isoliert
   in `node_modules/.cache/osm-venv`, nicht in das globale Python.
4. `npm run import-osm` ausführen und auf die Abschlussstatistik warten.
5. Simulator neu laden, dann **Adminbereich → Gebiet** öffnen.

Alternativer Eingabepfad (auch mit Leerzeichen):

```powershell
npm run import-osm -- "C:\Daten\oberpfalz-latest.osm.pbf"
```

Alternatives Ausgabeverzeichnis für Tests:

```powershell
node scripts/osm/import.js "C:\Daten\oberpfalz-latest.osm.pbf" --output "C:\Daten\probe"
```

Der Import selbst arbeitet vollständig lokal. Es gibt keinen Importserver, keine
Overpass-Abfrage und keinen Massendownload über Nominatim. Bei der Umsetzung wurde
der offizielle Export heruntergeladen und erfolgreich importiert.

## Warum diese Bibliotheken?

[pyosmium](https://docs.osmcode.org/pyosmium/latest/user_manual/03-Working-with-Geometries/)
verwendet libosmium zum streamenden PBF-Lesen und zum Zusammensetzen von Wegen,
Multipolygonen und Grenzrelationen. Shapely prüft Flächen, Löcher und Schnittmengen;
ein STRtree begrenzt räumliche Suchen. Ein kleiner Node-Wrapper stellt den npm-Befehl
bereit. Python und diese Bibliotheken sind ausschließlich Importwerkzeuge.
Im Browser gibt es keine PBF-Verarbeitung und keine zusätzliche Geo-Bibliothek.

## Gebietsfilter und Zuordnung

Die vier `admin_level=6`-Grenzen müssen vollständig und eindeutig vorkommen:

| Verwaltungsschlüssel | Bereich |
| --- | --- |
| 09362 | Stadt Regensburg |
| 09375 | Landkreis Regensburg |
| 09372 | Landkreis Cham |
| 09373 | Landkreis Neumarkt in der Oberpfalz |

Gemeinden werden aus `admin_level=8` übernommen; Regensburg ist gleichzeitig
kreisfreie Stadt und Gemeinde. Gemeindefreie Gebiete bleiben gesondert gekennzeichnet.
Gemeindegeometrien werden mit der jeweiligen Kreisfläche verschnitten. Adressen,
Orte und POI müssen innerhalb genau einer dieser Flächen liegen. Straßengeometrien
werden an Gemeindegrenzen aufgeteilt. Grenzlöcher werden nicht als zuständig behandelt.
Fehlen notwendige Grenzen, wird kein neuer Datenstand freigegeben.

Orte stammen aus benannten `place`-Nodes/-Flächen der unterstützten Kategorien.
Eine gleichnamige Fläche und ihr Ortsknoten werden innerhalb derselben Gemeinde
zusammengeführt. Fehlt ein Ortsknoten für den Gemeindenamen, bleibt die tatsächliche
Gemeinde als ausdrücklich markierter Verwaltungsort auswählbar.

**Ortsteilzuordnung ist nicht immer amtlich:** `addr:suburb` bzw. `addr:place`
werden gegen die Orte derselben Gemeinde aufgelöst. Sonst wird der nächstgelegene
OSM-Ort innerhalb dieser Gemeinde verwendet. `zuordnung` dokumentiert `addr-tag`
oder `naechster-osm-ort`. Ortsknoten erhalten keine erfundenen Grenzpolygone.
Entfernungen werden für die lokale Auswahl mit einer Längengradkorrektur angenähert.

Namen, alternative Namen, AGS/Regionalschlüssel und vorhandene PLZ bleiben erhalten.
Die ursprüngliche `addr:city` steht als `ortsangabe`, `addr:place` als `adressOrt`
in den Adressdaten. Nicht vorhandene Hausnummern und Straßennamen bleiben leer.

## Ausgabe und Wiederholbarkeit

```text
public/data/gebiet/
  manifest.json
  <datenstand>/
    gebiete.json
    orte.json
    strassen-stadt-regensburg.json
    adressen-stadt-regensburg.json
    pois-stadt-regensburg.json
    ... dieselben drei Dateien für jeden Landkreis
```

Straßen/Adressen/POI verwenden `spalten` und `zeilen` statt wiederholter Feldnamen.
OSM-IDs bleiben als `osm:node:…`, `osm:way:…` oder `osm:relation:…` erhalten.
Straßen-IDs werden stabil aus Gemeinde, Ort und normalisiertem Namen abgeleitet.
Gleichnamige Segmente derselben Straße im selben Ort werden zusammengeführt.
Vollständige postalische Adressdubletten im selben Ort werden zusammengeführt;
unvollständige Adressen zusätzlich über ihre Position unterschieden.

Das Manifest enthält Zählungen, Dateigrößen, SHA-256-Prüfsummen, Quelle und
Erstellungszeit. Einzelne defekte Geometrien werden gezählt und übersprungen.
Datei-/Schreibfehler brechen den Import ab. Erst nachdem alle Dateien geschrieben
sind, wird `manifest.json` atomar ersetzt. Alte Datenstände bleiben erhalten, damit
bereits geöffnete Seiten ihre Dateien noch laden können. Nicht mehr verwendete
Datenstandordner können nach einem Neustart aller Clients manuell entfernt werden.

PBF-Dateien und generierte Ausgaben sind in `.gitignore`. Vor einem Deployment
importieren und dann `npm run build-only` ausführen: Vite kopiert die JSON-Dateien
aus `public` nach `dist`. Das JavaScript-Bundle enthält den Datenbestand nicht.
Die Daten stehen unter ODbL; Quellenangabe und Lizenzlink erscheinen im Gebiet-Tab.

## Laufzeit, Suche und Einstellungen

`osmStammdaten.js` lädt einen vollständigen Snapshot vor dem Startmenü. Erst wenn
alle benötigten Dateien vorliegen, wird er freigegeben. Die acht Straßen-/Adressdateien
werden nacheinander geladen; POI-Dateien erst bei ausdrücklichem Abruf über
`osmStammdaten().poisLaden(kreisId)`. Fehler werden angezeigt; es entstehen keine
Ersatz-Orte. Benutzer-POI werden beim Laden nicht verändert.

`gebiet.js` verbindet den importierten Bestand mit separaten Aktivierungen/Faktoren
unter `leitstellensimulator-gebiet-konfig-v1`. Änderungen bleiben anhand der Orts-ID
bei einem Reimport erhalten, auch wenn ein Ort zwischenzeitlich fehlt. Ändert OSM
die Identität eines Ortes (neue OSM-ID), ist eine manuelle Neuzuordnung nötig.
Das bisherige JSON-/Browserspeicherformat bleibt als Altbestand lesbar.

`lokaleOrtssuche.js` erstellt einmal Wortindizes mit Trefferlisten. Eine binäre
Suche findet Wortpräfixe; die Schnittmenge der Trefferlisten liefert die Ergebnisse.
Es gibt keine vollständige Adress-Array-Suche pro Tastendruck. Hausnummern werden
exakt gesucht, damit beispielsweise `1` nicht auf `12` geocodiert wird. Suchfelder
umfassen Straße, Hausnummer, PLZ, Gemeinde, Ortsteil und alternative Ortsnamen.
Aktivierungen werden bei jeder Suche berücksichtigt.

Photon/Nominatim bleiben nur als ausdrücklich angeforderter Fallback verfügbar:

```js
orteSuchen('Suchtext', { onlineFallback: true })
adressVorschlaege('Suchtext', 'strasse', 'Ort', signal, { onlineFallback: true })
```

Die bestehende UI aktiviert diesen Fallback nicht automatisch. Die lokale Suche
funktioniert ohne Netz. Kartenkacheln und Routing sind davon unabhängige Dienste.

Der Notrufgenerator wählt zuerst einen aktiven Ort nach dessen Einsatzfaktor und
danach eine echte Adresse. Gibt es dort keine verwendbare Straßenadresse, kann eine
importierte benannte Straße ohne Hausnummer dienen. Unvollständige Adressdatensätze
bleiben im Import erhalten, werden aber nicht zu erfundenen Einsatzadressen ergänzt.

## POI-Vorbereitung

`scripts/osm/poi-mapping.json` ist die begrenzte, erweiterbare Zuordnung zum
bestehenden Objekttypkatalog. Rohdaten ohne unterstütztes Mapping werden ignoriert.
Die importierten POI bleiben Stammdaten. `osmPoiUebernahmeVorbereiten` in
`src/data/osmObjekte.js` erstellt bei ausdrücklicher Übernahme eine Kopie für das
Objektsystem. Existiert dieselbe OSM-ID bereits als Benutzerobjekt, wird dessen
bearbeitete/deaktivierte Version erhalten. Unbenannte POI benötigen vor Übernahme
einen vom Benutzer ergänzten Namen. Eine neue POI-Importoberfläche ist noch nicht Teil
dieses Schritts; eigene Objekte und deren Verwaltung bleiben unverändert.

## Prüfen

- **Adminbereich → Gebiet:** Kreis und Gemeinde filtern, beispielsweise Regenstauf.
  Faktor ändern/deaktivieren, speichern und nach erneutem Import kontrollieren.
- **Einsatzbearbeitung:** im Straßen-/Suchfeld `Hauptstr 12 Reg` eingeben. Ein
  vorhandener Treffer ist `Hauptstraße 12, Regenstauf`. Ortsteil `Reinhausen` über
  die Ortssuche suchen. Es dürfen nur Orte aus den vier Kreisen erscheinen.
  Eine Suche nach `München` kann etwa den *Münchener Ring in Neumarkt* finden,
  aber keine Adresse in der Stadt München.
- Simulation starten und nächsten Notruf annehmen: Ort/Adresse müssen aus dem
  importierten Bestand stammen. Faktor 0 verhindert automatische Auswahl,
  deaktivierte Orte verschwinden auch aus der Suche.
- `npm run test:osm`: synthetische PBF mit allen vier Grenzen, Löchern, Orten,
  Wegen, Adressen und POI. Prüft Dubletten, fehlende Felder, Reimport und Abbruch
  ohne Überschreiben des bisherigen Manifests.
- `node --test tests/*.test.mjs`: bestehende Simulatorprüfungen plus lokale Suche,
  Konfigurationsübernahme, Generator und POI-Adapter.

Der Test-PBF und seine Ausgaben entstehen ausschließlich in einem temporären Ordner.
Die tatsächlichen Zahlen des letzten Imports stehen in
`public/data/gebiet/manifest.json`; sie ändern sich mit dem OSM-Datenstand.

Prüflauf vom 03.10.2026 mit dem heruntergeladenen Geofabrik-Export:

| Inhalt | Anzahl |
| --- | ---: |
| Kreise | 4 |
| Gemeinden / gemeindefreie Gebiete | 100 / 2 |
| Orts-/Verwaltungseinträge | 2.414 (darunter 3 Verwaltungsorte) |
| Zusammengeführte Straßeneinträge | 14.651 |
| Adressen nach Dublettenbereinigung | 109.967 |
| Vorbereitete POI | 4.578 |
| JSON-Dateien zusammen | 23.538.565 Bytes |

Absichtlich ausgeschlossen wurden 2.644 Orte und 125.052 Adress-/POI-Objekte
außerhalb des Bereichs. Zusammengeführt: 37 doppelte Ortsdarstellungen,
3.815 Adressdubletten und 17.015 weitere Straßensegmente.
Im lokalen Testbrowser: ungefähr 0,5 Sekunden für den einmaligen Suchindexaufbau;
sechs anschließende Suchanfragen zusammen ungefähr 3 Millisekunden.
Diese Messung hängt vom Rechner ab und ist keine zugesicherte Obergrenze.
