# Gesamtprüfung Zimmerbrand – 03.10.2026

## Umfang und Vorgehen

95 automatisierte Tests bestanden. `npm run build-only` und die gezielte
ESLint-Prüfung der geänderten Komponente waren erfolgreich. Der neue
`tests/zimmerbrandGesamtfluss.test.mjs` verbindet den vorhandenen Generator,
Lebenszyklus, die medizinische Abfrage über den App-Handler, Sprechwünsche,
Hinweisgruppierung, Funkfreigabe und Ressourcenprüfung in einem vollständigen Ablauf.

Zusätzlich wurde die laufende Vue-App in einem isolierten Headless-Edge-Profil
geprüft. Testzustände, Funkgruppe und Simulationszeit wurden über die vorhandenen
App-Funktionen gesetzt; Fragebuttons, Hinweisfenster und Sprechaufforderung wurden
im DOM betätigt. Das ist ein kontrollierter Integrationstest, kein vollständiger
Test sämtlicher Benutzeraktionen oder mehrerer Monitore. Nutzer-Stammdaten wurden
nicht verändert.

## Ergebnisse

- Ein medizinischer Anruf blieb während des separat generierten Zimmerbrands
  aktiv. Fragebuttons funktionierten auch nach Funkrückmeldungen.
- Die Frage-ID zur Atmung lieferte die Antwort aus den Anruferfakten.
- Telefon, Sprechaufforderung der Leitstelle und Fahrzeugantwort erschienen
  chronologisch im gemeinsamen Kommunikationsfenster; Autoscroll erreichte das
  Ende. Interne Phasenereignisse erzeugten nur Chronikeinträge.
- Der Sprechwunsch erschien für das zugeordnete Fahrzeug in seiner Funkgruppe.
  Öffnen des Detailfensters verriet keinen Lagebericht. Die Freigabe erzeugte
  zuerst die Aufforderung und anschließend die hinterlegte Fahrzeugantwort.
- Normale und dringende Wünsche derselben Gruppe bleiben getrennt; die gezielte
  Freigabe entfernt nur den gewählten Eintrag (automatisierter Test).
- Ankunft und Erkundungsende gaben die reale Lage nicht vorzeitig frei. Erst der
  gesprochene Erkundungsbericht machte Lage und Bedarf bekannt.
- Ein HLF ließ beim Vollbrand 1600 Liter Wasser und zwei Atemschutzgeräte fehlen.
  Im Integrationstest deckte ein zweites HLF im Untereinsatz den gemeinsamen
  Bedarf. Die Nachalarmierung setzte den Phasenbeginn nicht zurück.
- Fahrzeuge blieben bis zum Ende der Abschlussphase gebunden. Beim deterministischen
  30-Minuten-Szenario waren sie noch bei 2.159.999 ms gebunden und wurden bei
  2.160.000 ms einschließlich sechs Minuten Ausrücken/Anfahrt freigegeben.
- Haupt- und Untereinsatz wurden abgeschlossen. Varianten-ID und Bedarf blieben
  unverändert. Das Telefonat funktionierte auch danach weiter.

## Gefundene Anzeige-Inkonsistenz und kleine Korrektur

Nach Einsatzende wurden die freigegebenen Fahrzeuge zu Recht nicht mehr als
gebundene Ressourcen gezählt. Die Oberfläche zeigte deshalb fälschlich den
gesamten Bedarf erneut als aktuelle Unterversorgung. `EinsatzRessourcen.vue`
zeigt für abgeschlossene Einsätze jetzt einen Abschlussvermerk statt einer
aktuellen Fehlbedarfswarnung. Die Berechnung und Einsatzlogik wurden nicht geändert.
Die korrigierte Darstellung wurde in der laufenden Browseransicht kontrolliert.

## Offene Grenzen

- `npm run type-check` scheitert mit TS7016 in `src/main.ts:4` an der Einbindung
  der JavaScript-Komponente `App.vue`. Der Vite-Build besteht; die Typkonfiguration
  wurde im Rahmen dieser Ablaufprüfung nicht umgebaut.
- Die Standardflotte hat keine Funkgruppen vorbelegt. Ein Testfahrzeug benötigt
  eine konfigurierte Gruppe, sonst entsteht kein Phasensprechwunsch.
- Der Zimmerbrand-Test wird separat erzeugt, nicht aus dem medizinischen Anruf.
  Der Test belegt die Parallelität beider Systeme, keine noch nicht vorhandene
  gemeinsame Telefon-zu-Zimmerbrand-Generierung.
- Der Lebenszyklus ist weiterhin zeitgesteuert: Fehlbedarf hält Maßnahmen und
  Einsatzende derzeit nicht auf. Eine Verbindung zwischen tatsächlicher
  Bedarfsdeckung und Maßnahmenfortschritt wäre der nächste fachliche Schritt.
- Mehrbildschirmbedienung und externe Routing-/Kartendienste waren nicht Teil
  dieser Prüfung; der Zimmerbrand-Test verwendet bewusst keine Kartenposition.
