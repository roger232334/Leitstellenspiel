# Fahrzeugverwaltung

Fahrzeuge besitzen außerdem eine individuelle **Beladung / Ausrüstung** mit Typvorlagen und aufklappbaren Kategorien. Datenmodell, Migration und Hilfsfunktionen für spätere Einsatzanforderungen sind in [Fahrzeugbeladung und Ausrüstung](fahrzeug-beladung.md) beschrieben.

Für Hubschrauber gibt es den Fachdienst `LUFT` (Hubschrauber / Luftrettung) und die Fahrzeugtypen RTH, ITH sowie sonstiger Hubschrauber. Diese Typen sind Ergänzungen der Simulation außerhalb des PDF-Katalogs. Spezielle Flugbewegungen, Luftrettungs-AAO und Transportabläufe sind damit noch nicht implementiert. Neue Standard-Tableaus berücksichtigen den Fachdienst mit einer Luftrettungsstation.

Die Zuordnung heißt in der Oberfläche **Fachdienst** und bietet Rettungsdienst, Feuerwehr, Bergrettung/Bergwacht, Wasserrettung, Katastrophenschutz, Technische Hilfe/THW, Sanitätsdienst, Betreuungsdienst und Sonstige. Intern bleibt der Feldname `bereich` für vorhandene Daten und die AAO kompatibel. Dies ist eine vereinfachte Simulationszuordnung; Trägerorganisation und einzelne Fähigkeiten sind davon getrennt zu betrachten.

Neue Standard-Tableaus erzeugen für zusätzlich vorhandene Fachdienste eigene Seiten. Gespeicherte individuelle Anordnungen werden nicht umsortiert. Die automatische Untereinsatzbildung und bisherige AAO bleiben auf RD/FW ausgerichtet; spezielle Alarmierungs- und Einsatzabläufe für die zusätzlichen Dienste folgen später. Es werden also noch keine neuen Fähigkeiten allein durch die Fachdienstauswahl aktiviert.

Weitere Stammdaten stehen auch in der Schicht unter diesen Feldnamen zur Verfügung:

| Feld | Bedeutung |
| --- | --- |
| `funkgruppe` | Frei eingegebene Funkgruppe |
| `wacheName` | Vorläufiger Name der stationierten Wache |
| `wacheId` | Reservierte POI-Referenz, derzeit standardmäßig `null` |
| `hatNotarzt` | Notarzt an Bord |
| `hatGps` | GPS vorhanden; bei `false` kein Fahrzeugmarker auf der Karte |
| `istFirstResponder` | Merkmal für die spätere medizinische Erstversorgungslogik |
| `istEhrenamtlich` | Merkmal für die spätere Konfiguration längerer Ausrückzeiten |

Die Wachenangabe ist unabhängig von der Tableau-Anordnung. Eine POI-Auswahl folgt mit der POI-Verwaltung. GPS beeinflusst nur die Kartenanzeige; interne Koordinaten bleiben für Routing und Einsatzabläufe erhalten. Erstversorgung und zusätzliche ehrenamtliche Ausrückzeiten werden noch nicht simuliert. Neue Fahrzeuge starten mit GPS aktiviert und den übrigen Schaltern deaktiviert. Für alte Datensätze bleibt GPS aktiviert; NEF/NAW erhalten bei fehlender Angabe `hatNotarzt: true`. Ein explizit gespeichertes Nein bleibt erhalten.

Funkrufnamen sind separat über `fahrzeug.funkrufnameLang` und `fahrzeug.funkrufnameKurz` referenzierbar, sowohl in den Stammdaten als auch in der laufenden Schicht. Der lange Name ist erforderlich, die Kurzform optional. Bei älteren Daten wird der bisherige Name unverändert als langer Name übernommen; die Kurzform bleibt leer. `fahrzeug.funkrufname` bleibt als kompatibler Alias des langen Namens für die bisherigen Spielansichten erhalten. Beim Speichern wird dieser Alias aktualisiert; neue Bearbeitungsfunktionen sollen `funkrufnameLang` ändern.

Im Startmenü unter **Adminbereich → Fahrzeuge** lassen sich Fahrzeuge suchen, anlegen, bearbeiten und nach Bestätigung löschen. Verfügbar sind Funkrufname, Fahrzeugtyp (Vorschlag oder freie Eingabe), Bereich RD/FW, Startstatus 1/2/6 und optionale Startkoordinaten. Für ein Fahrzeug ohne Koordinaten gibt es zunächst keinen Kartenmarker. Eigene Fahrzeugtypen müssen zu den verwendeten AAO-Regeln passen; besondere Fahrzeuglogik entsteht durch einen neuen Typnamen allein nicht.

**Fahrzeug speichern** übernimmt die Änderungen in den lokalen Browserspeicher. Beim ersten Aufruf werden die fünf bisherigen Fahrzeuge als Ausgangsbestand angeboten. Ein absichtlich leer gespeicherter Bestand bleibt leer. Fehler beim Lesen oder Schreiben werden angezeigt; fehlgeschlagene Schreibvorgänge übernehmen den Entwurf nicht in den gespeicherten Bestand. Die Daten gelten nur für diesen Browser und diese Simulator-Adresse.

Über **Wachen und Tableau anordnen** ist die bisherige Tableau-Bearbeitung nun im Adminbereich erreichbar. Neue Fahrzeuge können dort in Wachen eingeordnet werden. Bei bereits gespeicherten Tableau-Seiten erfolgt diese Zuordnung manuell. Gelöschte Fahrzeuge werden beim Laden aus der Anzeige gefiltert; ihre IDs werden nicht für andere Fahrzeuge wiederverwendet.

Jeder Schichtstart erzeugt aus den Stammdaten neue Fahrzeugobjekte mit Startstatus, Statuszeit und leerem Einsatz-/Routenzustand. Die Simulation verändert damit nicht den gespeicherten Fahrzeugbestand. Im Spiel bleiben die Verwaltungsfunktionen gesperrt.

Alarm- und Ausrückeordnung, POI und allgemeine Einstellungen besitzen eigene Menüpunkte, ihre Bearbeitungsmasken folgen später.
