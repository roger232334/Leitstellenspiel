# Fahrzeug-Tableau

Im Fahrzeuge-Tab enthält jede frei benennbare Seite eigene Wachen. Unter
**Seite bearbeiten** lassen sich Wachen anlegen, deren Namen direkt im Kopf
ändern und die Rastergröße einstellen. **Neue Seite** legt eine leere Seite an.

Fahrzeuge aus der linken Liste in eine Wache ziehen. Innerhalb einer Wache
fügt das Ablegen auf einer Fahrzeugzeile das gezogene Fahrzeug davor ein.
Das Ablegen im unteren Bereich hängt es hinten an. Fahrzeuge können zwischen
Wachen verschoben werden. Jede Seite zeigt ein Fahrzeug höchstens einmal;
auf anderen Seiten kann es zusätzlich erscheinen.

Eine Wache lässt sich am Kopf auf einen anderen Rasterplatz ziehen. Bei
belegten Plätzen tauschen die Wachen ihre Positionen. Alternativ ein Fahrzeug
oder den Verschiebepfeil einer Wache anklicken und am Ziel **Hier einsetzen**
wählen. Über **+ Wache** in einer freien Zelle entsteht dort eine neue Wache.

Das Kreuz an einem Fahrzeug entfernt nur seine Zuordnung auf dieser Seite.
Das Löschen einer Wache oder Seite wird gesondert bestätigt. Die Fahrzeuge
selbst und ihre Einsatzzuordnungen werden durch Tableau-Änderungen nicht verändert.

Seiten, Wachen und Positionen werden im lokalen Browserspeicher gesichert.
Die frühere Rasteranordnung wird beim ersten Laden übernommen: jeder belegte
Platz erhält zunächst eine eigene benennbare Wache. Die alte Speicherung
bleibt als Rückfallkopie erhalten. Live-Status und Funkrufnamen stammen aus
dem Fahrzeugbestand der laufenden Simulation.
