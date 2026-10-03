# Startmenü und Schicht

Die Simulation startet im Menü. Schichtdatum und Startzeit werden zunächst mit der lokalen Browserzeit vorbelegt und können frei gewählt werden. Erst „Simulation starten“ aktiviert die Spieluhr, Fahrzeugabläufe und automatische Notrufplanung. Die Spieluhr läuft ab dem gewählten Zeitpunkt in Echtzeit weiter, einschließlich Datumswechsel. Neue Einsatzerfassungen, Chronikzeiten und Fahrzeugstatuszeiten verwenden diese Simulationszeit.

Die Spieluhr startet mit Tempo 1×. Über die obere Modulleiste sind während der Schicht 2×, 5×, 10× und 20× möglich; siehe [Simulationszeit und Einsatzlebenszyklus](einsatzlebenszyklus.md). Die Einsatzfrequenz skaliert die zufällige Pause zwischen automatischen Anrufen; alle folgenden Zeiten sind Simulationssekunden:

| Frequenz | Pause |
| --- | --- |
| 100 % | 20–60 Sekunden |
| 75 % | ca. 27–80 Sekunden |
| 50 % | 40–120 Sekunden |
| 25 % | 80–240 Sekunden |

Während eines klingelnden oder laufenden Anrufs wird weiterhin kein zweiter automatischer Anruf erzeugt. Testanrufe sind unabhängig von dieser Frequenz.

Der Adminbereich ist vom Startmenü erreichbar und startet keine Simulation. Unter Fahrzeuge sind Stammdaten und Tableau-Anordnung bearbeitbar; AAO, POI und allgemeine Einstellungen sind zunächst Platzhalter. Details stehen in [Fahrzeugverwaltung](fahrzeugverwaltung.md).

Das Fahrzeugtableau lädt vorhandene gespeicherte Seiten und Wachen weiterhin. Im Spiel sind Anlegen, Löschen, Umbenennen und Verschieben gesperrt. Seitenwechsel und Live-Statusanzeige bleiben verfügbar. Die vorbereitete Komponentenoption `verwaltungErlaubt` ist standardmäßig deaktiviert und wird vom Spiel nicht freigeschaltet.
