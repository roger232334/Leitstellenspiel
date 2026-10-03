# Gebiet: ILS Regensburg

Der Adminreiter **Gebiet** verwaltet den gemeinsamen Katalog für die vier Bereiche
Stadt Regensburg, Landkreis Regensburg, Landkreis Cham und Landkreis Neumarkt in
der Oberpfalz. `src/data/gebiet.js` ist die zentrale Daten- und Prüflogik.
OSM-Stammdaten kommen aus `public/data/gebiet/`; Aktivierungen und Faktoren liegen
separat unter `leitstellensimulator-gebiet-konfig-v1` im Browserspeicher.
Das bisherige `leitstellensimulator-gebiet-v1` bleibt für manuell importierte
Altdaten erhalten. Anleitung und Importformat: [Lokaler OSM-Import](osm-import.md).

Neue Implementierungsdateien: `src/data/gebiet.js`,
`src/data/notruf/gebietsNotruf.js`, `src/components/GebietAdmin.vue`.
Anbindungen wurden in `AdminBereich.vue`, `Startmenue.vue`, `Einsatzmaske.vue`,
`ObjektAdmin.vue`, `App.vue`, `services/ortssuche.js`,
`services/adressVorschlaege.js`, `data/objektVerwaltung.js` und
`data/einsatzErfassung.js` ergänzt. Tests stehen in `tests/gebiet.test.mjs` und
`tests/gebietTestdaten.mjs`; die vorhandenen Such- und Erfassungstests wurden
um Gebietskontext beziehungsweise Warnungsprüfung ergänzt.

## Fehlender Datenbestand

Der lokale Importer übernimmt tatsächliche Orte, Straßen, Adressen und Grenzen
aus dem Geofabrik-Export. Die erzeugten Dateien sind lokale Build-Artefakte und
werden nicht in Git gespeichert. Ohne diese Dateien und ohne manuelle Altdaten
startet der Katalog leer. OSM ist keine Garantie für einen vollständigen amtlichen
Adressbestand. Es werden keine Ortsteile oder Straßen erfunden.

Bis Daten importiert sind, liefern Adresssuchen keine ungeprüften Vorschläge und
automatische Notrufe warten auf einen zulässigen Adressbestand. Das Startmenü weist
darauf hin. Alte Einsätze bleiben sichtbar; manuelle Einsätze und ausdrücklich
gekennzeichnete ortslose Testeinsätze bleiben möglich. Ein Warnhinweis bei manuell
angelegten Einsätzen verlangt eine bewusste Bestätigung bei unbekannter/fremder
Gebietszugehörigkeit.

## Bedienung

Nach `npm run import-osm` die Anwendung neu laden. Der Import erscheint automatisch.
Ohne OSM-Bestand bleibt alternativ der bisherige manuelle JSON-Import verfügbar:
Datei auswählen, Prüfung abwarten, anschließend **Import übernehmen**.
Suche, Kreis-, Gemeinde- und Statusfilter begrenzen die Liste; es werden maximal
50 Zeilen pro Seite angezeigt. Faktor und Aktivkästchen ändern und **Änderungen
speichern** wählen. Gleiche IDs werden beim Import aktualisiert; bereits
gespeicherte Faktoren/Aktivierungen und nicht im Import enthaltene Einträge bleiben
erhalten. Ungespeicherte Änderungen werden nicht unbemerkt verworfen.

- `aktiv: false`: keine Suchtreffer und keine automatische Auswahl.
- Faktor `0`: weiterhin zugehörig und suchbar, aber keine automatische Auswahl.
- Faktoren `0.5`, `1`, `2`, `5`: relative Gewichte zwischen auswählbaren Ortschaften.
  Faktor 2 ist doppelt so wahrscheinlich wie Faktor 1. Der Schicht-Frequenzregler
  steuert weiterhin den zeitlichen Abstand von Notrufen.
- Faktoren müssen endlich und zwischen 0 und 1000 liegen.

## Importformat

Eine JSON-Datei enthält `version: 1`, `ortschaften: []` und `adressen: []`.
Die leere Importvorlage liegt in `docs/gebiet-import-vorlage.json`.
Ortschaftszeilen benötigen:

| Feld | Inhalt |
| --- | --- |
| id | stabile externe/interne Text-ID; nicht aus wechselnden Namen erzeugen |
| bundesland | `Bayern` |
| kreisId | `stadt-regensburg`, `landkreis-regensburg`, `landkreis-cham`, `landkreis-neumarkt` |
| gemeinde | Verwaltungs-Gemeinde |
| ortsteil | einzelne Ortschaft / Ortsteil |
| postleitzahl | Text, optional |
| aktiv | true/false |
| einsatzaufkommenFaktor | Zahl, üblicher Startwert 1 |
| aliases | optionale Liste alternativer Ortsteilbezeichnungen |
| verwaltungsId | optionale externe Verwaltungs-ID zur späteren Zuordnung |
| position | optionaler WGS84-Mittelpunkt `{lat,lng}` |
| geometry | optionales GeoJSON Polygon/MultiPolygon der Ortschaft, Koordinaten `[lng,lat]` |

Adresszeilen benötigen `id`, `gebietId` (Ortschafts-ID), `strasse`, optional
`hausnummer` sowie `position: {lat,lng}`. Straßen ohne Hausnummer sind zulässig.
Eine spätere Datei kann `ortschaften: []` und nur neue Adressen enthalten, sofern
die referenzierten Ortschaften bereits gespeichert sind. IDs werden zusammengeführt.
Die Prüfung lehnt doppelte IDs, unbekannte Referenzen, unzulässige Kreise,
ungültige Koordinaten und nicht geschlossene Polygonringe ab. Adresspositionen
müssen innerhalb der zugehörigen Grenze liegen, wenn diese vorhanden ist.

Für einen vollständigen Import brauchen wir externe Gemeinde-/Ortsteilzeilen für
alle vier Bereiche sowie deren IDs/Zuordnungen und möglichst zugehörige Grenzpolygone.
Ein Mittelpunkt allein definiert keine Fläche. Gemeindegrenzen dürfen nicht
unverändert allen Ortsteilzeilen zugewiesen werden: überlappende Zuordnungen sind
mehrdeutig. Ergänzend wird ein georeferenzierter Straßen-/Adressbestand mit
Ortschaftsreferenzen benötigt. Datenquelle, Aktualitätsstand und Nutzungsrechte
müssen bei Beschaffung/Umwandlung des externen Bestands geprüft werden.

## Gemeinsame Prüfung und Suche

`gebietsPruefung` liefert Zulässigkeit, Ortschaft und einen Ablehnungsgrund.
Koordinaten werden gegen importierte Polygone geprüft, einschließlich Löchern und
MultiPolygonen. Ohne Grenzen ist eine eindeutige Kombination aus Land, Bundesland,
Kreis, Gemeinde und Ortsteil erforderlich. Nur „Regensburg“ oder eine PLZ genügt
nicht. Fehlende oder mehrdeutige Zuordnungen werden nicht angeboten.

Die Suche arbeitet standardmäßig lokal mit einem Wortpräfixindex. Nominatim und
Photon sind nur noch ausdrücklich aktivierbare Fallbacks im Service-API
(`onlineFallback: true`), nicht automatisch bei jedem fehlenden Treffer.
Auch deren Cachetreffer werden erneut gegen die aktuellen Aktivierungen geprüft.
Treffer werden vor Übernahme in die Einsatzmaske erneut geprüft.
Bei OSM-Orten ohne eigene Grenzen gilt die Gemeindegrenze. Eine Position ohne
Ortschafts-ID wird dem nächsten OSM-Ort innerhalb der Gemeinde zugeordnet;
dies ist eine Näherung, keine amtliche Ortsteilgrenze.

## Automatik, POIs und Kompatibilität

`waehleZufaelligeOrtschaft` und `zufaelligeGebietsAdresse` wählen gewichtete aktive
Ortschaften mit Faktor größer 0. Für automatische Notrufe werden nur Orte mit
importierten Adressen oder, als Rückfall, tatsächlichen benannten Straßen
berücksichtigt. Bei Straßen ohne Adresse bleibt die Hausnummer leer.
`notrufImGebiet` übernimmt die Adresse und
Position in eine Kopie der bisherigen Notrufvorlage. Medizinische Fakten und
Szenariotyp bleiben unabhängig. Alte frei formulierte Adressantworten werden auf
diese Adresse angepasst. Es wird nicht während der Generierung geocodiert.

Der reine Lage-/Bedarfsgenerator und sein ausdrücklich ortsloser Zimmerbrandtest
bleiben bestehen; jeder künftige automatische Aufrufer kann dieselbe Adressauswahl
voranstellen. POIs verwenden `automatischeGebietsObjekte` / `objektAutomatischZulaessig`;
es gibt keine zweite Prüfung und noch keine automatische POI-Einsatzgenerierung.
Der POI-Editor warnt bei unbekannter oder fremder Position. POI-Stammdaten außerhalb
des Gebiets können weiterhin verwaltet werden, sind aber nicht automatisch zulässig.

Fahrzeuge, Wachen, Routing und gespeicherte Altfälle werden nicht migriert.
Karten und Tests benötigen keine vollständige Ortsliste. Tests verwenden ausdrücklich
synthetische Grenzen, die niemals in den produktiven Katalog übernommen werden.
