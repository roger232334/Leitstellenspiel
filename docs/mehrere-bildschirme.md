# Mehrere Bildschirme

Einsatzliste, Einsatzbearbeitung, Notrufannahme, Karte, Fahrzeuge und Chronik können jeweils in einem eigenen Fenster angezeigt werden.

In der Einsatzliste öffnet ein Doppelklick (alternativ Enter auf einer Zeile) den Einsatz in der Einsatzbearbeitung. Ist diese ausgelagert, wird ihr Fenster aktiviert. Die Spaltenbreiten lassen sich an den rechten Rändern der Überschriften ziehen oder am fokussierten Trennstrich mit den Pfeiltasten ändern. Die Breiten werden lokal gespeichert und können über „Spalten zurücksetzen“ zurückgesetzt werden. Untereinsätze bleiben in der Bearbeitung ihres Haupteinsatzes; die Liste fasst ihre Fahrzeuge beim Haupteinsatz zusammen. Nicht hinterlegte Zielorte erscheinen als „—“.

1. Den gewünschten Modultab aus der Leiste herausziehen und loslassen. Alternativ auf **↗** klicken oder den Tab doppelklicken.
2. Das Zusatzfenster bei Bedarf an seiner Titelleiste auf den gewünschten Bildschirm ziehen.
3. Andere Module im Hauptfenster oder in weiteren Zusatzfenstern öffnen.

Mit **Zurück ins Hauptfenster**, **Hier wieder anzeigen** oder durch Schließen des Zusatzfensters wird das Modul wieder angedockt. Ein Klick auf einen bereits ausgelagerten Tab bringt dessen Fenster nach vorne.

Alle Fenster verwenden dieselbe laufende Simulation. Einsätze, Notrufe, Fahrzeugstatus und Eingaben werden gemeinsam verwendet. Das Hauptfenster muss geöffnet bleiben; beim Schließen oder Neuladen endet die laufende Sitzung und ihre Zusatzfenster werden geschlossen. Einfach dieselbe URL in einem weiteren Browser-Tab zu öffnen erzeugt dagegen eine unabhängige Simulation.

Der Browser kann Pop-ups blockieren. In diesem Fall erscheint ein Hinweis; Pop-ups für die Simulator-Adresse erlauben und erneut auf ↗ klicken. Die Position des neuen Fensters wird vom Browser begrenzt. Das Herausziehen eines internen Modultabs ist deshalb keine native Browser-Tab-Funktion; falls das Fenster auf dem bisherigen Bildschirm erscheint, lässt es sich anschließend an seiner Titelleiste verschieben.

## Technische Umsetzung

`ModulFenster.vue` verschiebt die vorhandene Modulansicht mit Vue Teleport in ein gleichursprüngliches Zusatzfenster. Es gibt weiterhin nur eine App-Instanz und einen Satz Simulationstimer. Styles werden übernommen. Bereits besuchte Module bleiben beim Modulwechsel erhalten. Für Leaflet wird beim Wechsel des Fensters die Karte mit der zum jeweiligen Dokument gehörenden Leaflet-Instanz neu aufgebaut; Mittelpunkt und Zoom werden beibehalten.

Geprüft: automatisierter Edge-Browsertest für Auslagern per Button und Mausbewegung, Notrufbedienung im Zusatzfenster, Rückkehr mit Gesprächserhalt, Andocken durch Fensterschließen, Karteninitialisierung und Zoom sowie abgefangene Popup-Blockierung. Eine reale Anordnung auf mehreren physischen Monitoren wurde nicht automatisiert geprüft.
