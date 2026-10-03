# Einsatzaufnahme aus einem Notruf

## Einsätze ohne Anruf

In **Einsatzbearbeitung** öffnet **Neuer Einsatz ohne Anruf** einen eigenen
Entwurf in derselben Einsatzmaske. Er bleibt beim Modulwechsel erhalten und
kann über die Einsatzauswahl wieder geöffnet oder über **Entwurf verwerfen**
verworfen werden. Ein paralleles Notrufgespräch mit seinen Eingaben bleibt
unabhängig davon erhalten.

Beispiel Gebietsabsicherung: Ort eintragen, im Schlagwortkatalog
`#R0540#Sonstige#Gebietsabsicherung` auswählen und **Einsatz eröffnen**.
Danach **Auto-Split**, den RD-Untereinsatz unter **Hinweise / Gesprächsnotizen** auswählen, **Vorschlag** und
**Alarmieren**. Als Simulationsregel ist dafür ein RTW hinterlegt.

Die Gesamtliste enthält nur Haupteinsätze. Zugehörige Untereinsätze stehen
innerhalb der Einsatzmaske mit Bereich, Stichwort und Status. Die Auswahl
eines Untereinsatzes steuert die Disposition und Alarmierung; die Gesamtliste
bleibt dabei auf dem zugehörigen Haupteinsatz. **Zum Haupteinsatz** kehrt zur
übergeordneten Maske zurück.

## Aufnahme aus einem Notruf

Ein eingehender Anruf kann in **Notrufannahme** oder **Einsatzbearbeitung**
angenommen werden. Bei einem aktiven Gespräch führt **Einsatzdaten erfassen**
zur Einsatzmaske. **Zur Gesprächsabfrage** führt zurück. Der Entwurf bleibt
beim Wechsel zwischen den Modulen erhalten, bis der Anruf beendet oder ein
Einsatz eröffnet wird. Ein Neuladen der Anwendung setzt die Simulation zurück.

Die Maske erfasst Objekt, Station, Straße, Hausnummer, Ort, Ortsteil,
Meldenden, Rückrufnummer, Meldebild und Notizen. Der Meldebildkatalog übernimmt
das zugehörige Stichwort für die bestehende Disposition. SoSi und Priorität
werden am Einsatz gespeichert; sie verändern derzeit keine Fahrzeiten oder
Alarmierungsregeln. Der Einsatzstatus wird vom bestehenden Ablauf bestimmt.

Die Lupen öffnen eine gemeinsame Suche nach Objekten, Adressen und Ortsteilen.
Nach Eingabe des Suchbegriffs startet **Suchen** oder Enter die Anfrage. Die
Auswahl eines Treffers ersetzt die Ortsfelder und übernimmt dessen Koordinaten.
Fehlende Bestandteile können manuell ergänzt werden. Änderungen an den
Ortsfeldern verwerfen die ausgewählten Koordinaten und lösen bei der
Einsatzanlage eine neue Geocodierung aus.

## Suchdienst

**Straße**, **Ort** und **Schlagwort** zeigen Vorschläge direkt unter dem
Eingabefeld. Auswahl per Klick oder Pfeiltasten und Enter, Schließen mit Escape.
Schlagwörter werden sofort im lokalen Katalog gefiltert. Adressvorschläge
starten ab drei Zeichen nach einer kurzen Tipp-Pause (450 ms); ein bereits
eingetragener Ort wird bei der Straßensuche berücksichtigt.

Für diese Adressvorschläge wird [Photon](https://github.com/komoot/photon)
verwendet. Der öffentliche Dienst erlaubt moderate Nutzung ohne
Verfügbarkeitsgarantie. Antworten werden zwischengespeichert, überholte
Anfragen abgebrochen. `VITE_AUTOCOMPLETE_URL` kann beim Build auf einen eigenen
Photon-Endpunkt zeigen. Die Online-Vorschläge senden nur den Suchtext und
gegebenenfalls den eingetragenen Ort.

Die folgenden Nominatim-Regeln betreffen die weiterhin verfügbare explizite
Lupensuche und die Geocodierung bei der Einsatzanlage:

Die Suche verwendet wie die bisherige Geocodierung Nominatim / OpenStreetMap
und ist auf Deutschland begrenzt. Verfügbare Objekte und Ortsteile hängen von
den dort erfassten Daten ab. Ohne Internet bleibt die manuelle Eingabe möglich.
Es gelten die [Nominatim-Nutzungsvorgaben](https://operations.osmfoundation.org/policies/nominatim/):
keine Suche bei jedem Tastendruck, höchstens eine Anfrage pro Sekunde,
Caching und Quellenangabe. Die Anwendung serialisiert Anfragen mit mindestens
1,1 Sekunden Abstand innerhalb einer laufenden Instanz. Ein öffentlicher
Mehrnutzerbetrieb benötigt eine zentrale Begrenzung über einen Proxy oder
einen entsprechend ausgelegten eigenen Suchdienst. Keine personenbezogenen
Daten in den Suchbegriff eingeben; Meldender, Telefonnummer und Notizen werden
von der Anwendung nicht an den Suchdienst gesendet.

Über `VITE_GEOCODING_URL` lässt sich ein kompatibler Such-Endpunkt beim Build
konfigurieren. API: Nominatim Search, `jsonv2` mit `addressdetails=1`.

## Prüfung

`node --test tests/ortssuche.test.mjs` prüft Adresszuordnung, Ortsteile,
Serialisierung, Cache und erneute Suche nach Fehlern ohne echte Netzwerkanfragen.
`npm run build-only` erstellt den Produktionsbuild.
