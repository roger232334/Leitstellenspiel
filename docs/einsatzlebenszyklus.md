# Einsatzlebenszyklus und Simulationszeit

## Zentrale Zeit

`src/services/simulationsZeit.js` integriert die monotone Browserzeit mit dem gewählten Faktor: 1×, 2×, 5×, 10× oder 20×. „Tempo“ in der oberen Modulleiste lässt sich während der Schicht ändern. Vor dem Wechsel wird die bis dahin vergangene Echtzeit mit dem alten Faktor verrechnet; Zeit und Fortschritt springen dadurch nicht.

`App.vue` betreibt einen einzigen Simulations-Takt (250 ms Darstellungsintervall). Die tatsächliche verstrichene Zeit ist maßgeblich, nicht die Anzahl der Takte. Uhrzeit, Fahrzeugbewegung, Lebenszyklus, Gesprächsdauer, Klingeldauer und automatische Anruftermine verwenden diese Zeit. Ein überfälliger Anruf wird beim nächsten Takt ausgelöst; es wird keine Warteschlange aller während einer Browserpause verpassten Anrufe erzeugt. Während eines Anrufs wird weiterhin kein zweiter Anruf gestartet.

Der reine Klingelton behält seinen Audio-Takt in Echtzeit. UI-Effekte und Netzwerkanfragen sind keine Simulations-Timer. Es gibt keine separaten Fahrzeug- oder Einsatzabschluss-Timer mehr.

## Fahrzeugzustand und Einsatzphase

`src/data/einsatzLebenszyklus.js` verwaltet stabile Phasen-IDs:

| ID | Bedeutung |
| --- | --- |
| `alarmiert` | Fahrzeug alarmiert, Ausrückzeit läuft |
| `anfahrt` | Mindestens ein Fahrzeug ist unterwegs |
| `eingetroffen` | Übergangsereignis beim ersten geeigneten Fahrzeug |
| `erkundung` | Lage wird erkundet |
| `massnahmen` | Einsatzmaßnahmen laufen |
| `abschluss` | Abschließende Arbeiten |
| `beendet` | Fahrzeuge freigegeben, Einsatz abgeschlossen |

Der FMS-Status bleibt davon unabhängig: Status 3 während Alarmierung/Ausrücken/Anfahrt, Status 4 ab Ankunft bis Einsatzende. `fahrzeug.fahrt` speichert Alarmierungs-, Abfahrts- und Ankunftszeit sowie die Fahrtdauer. Die bisherige künstliche Verkürzung von Routen auf 8–35 Sekunden entfällt: OSRM-Fahrtdauern sind Simulationssekunden und werden ausschließlich über die zentrale Geschwindigkeit beschleunigt.

Zentrale Standardwerte: 60 Simulationssekunden zum Ausrücken und 300 Simulationssekunden Anfahrt, wenn keine Route verfügbar ist. Späte Routingantworten werden nach Ankunft, Freigabe oder neuer Alarmierung verworfen. Eine echte Rückfahrt zur Wache wird noch nicht simuliert.

Haupt- und Untereinsätze teilen den Lebenszyklus am Haupteinsatz. Die erste Ankunft startet die Erkundung; weitere Ankünfte oder Nachalarmierungen setzen den Ablauf nicht zurück. Standardmäßig kann jedes tatsächlich zugeordnete Fahrzeug erkunden. Optional kann `einsatz.erkundungsFaehigkeit` eine vorhandene Fähigkeits-ID verlangen, beispielsweise `notarzt`.

## Gespeicherte Dauer und Phasenzeiten

Eine Lagevariante kann folgende Angaben erhalten:

```js
dauer: {
  basisMinuten: 30,
  schwankungMinuten: 10,
  // Optional; Summe muss 1 sein, jeder Anteil positiv:
  phasenAnteile: { erkundung: 0.1, massnahmen: 0.75, abschluss: 0.15 }
}
```

Der Generator zieht gleichverteilt eine Dauer im Bereich Basis ± Schwankung und speichert sie einmalig als `einsatz.zeitplanung.dauerSekunden` sowie `phasenSekunden`. Rendering und Nachalarmierung würfeln nichts neu aus. Alte Einsätze ohne Zeitdaten erhalten beim ersten Alarmieren 30 Minuten ohne Schwankung. Die Zimmerbrandvarianten benötigen insgesamt 20–40 Simulationsminuten vor Ort.

Die Dauer beginnt mit der ersten geeigneten Ankunft. Ausrückzeit und Anfahrt kommen hinzu. Standardmäßig entfallen 10 % auf Erkundung, 75 % auf Maßnahmen und 15 % auf Abschluss. Die Phasen werden in ganzen Sekunden gespeichert, ihre Summe entspricht exakt der gewählten Dauer.

`einsatz.lebenszyklus` speichert Phase, Alarmierungszeit, Phasenbeginn, Arbeitsbeginn vor Ort, Endzeit und Ereignisse. Die Anzeige zeigt Phase, Dauer, verstrichene Zeit vor Ort und Fortschritt. Bei unbekannter realer Lage bleiben Dauer und Prozentanzeige bis zur Erkundung verborgen.

## Erkundung, Abschluss und Erweiterungspunkte

Nach der Erkundungszeit wird `szenario.lageBekannt = true`. Lage, Modifikatoren und die bestehende Ressourcenlage erscheinen automatisch. Der bisherige manuelle Testerkundungsknopf entfällt.

Nach Ablauf der Abschlussphase wird die Einsatzfamilie auf `abgeschlossen` gesetzt. Alle noch zugeordneten Fahrzeuge werden freigegeben, auch noch anfahrende Fahrzeuge. Zuordnungen und Routen werden bereinigt. Die bisherige Freistatus-Konvention bleibt erhalten: RTW/NEF/KTW wechseln auf 1, andere Fahrzeuge auf 2. Die kurzen automatischen RTW-Übergänge 4 → 7 → 8 entfallen; eine spätere Transportsteuerung ist ein eigener Schritt.

Der Lebenszyklus gibt Ereignisse mit `{ typ, einsatzId, zeit }` an einen optionalen Callback und speichert sie am Einsatz. Die App schreibt diese Zustandswechsel mit ihrer Simulationszeit in die Chronik:

- `einsatzAlarmiert`
- `anfahrtGestartet`
- `erstesFahrzeugEingetroffen`
- `erkundungGestartet`
- `erkundungAbgeschlossen`
- `massnahmenGestartet`
- `einsatzAbschluss`
- `einsatzBeendet`

Diese Ereignisse entstehen einmal pro Einsatzablauf, auch wenn ein Browser-Takt mehrere Phasengrenzen überspringt. Spätere Funkmeldungen können am Callback angebunden werden. `fahrzeugFreigeben` ist ein separater Baustein für spätere Abbestellungen. An der Maßnahmenphase kann später eine Bedarfsprüfung mit Pausierung ergänzt werden. Fehlbedarf verzögert den Ablauf derzeit nicht; Funk, Eskalationen, Verbrauch und automatische Nachforderungen sind nicht implementiert.

## Testablauf

1. Schicht starten und in der Einsatzbearbeitung „Bedarf testen → Zimmerbrand generieren (Test)“ wählen.
2. Über „Hinzuf.“ ein Fahrzeug auswählen und alarmieren. Alternativ Auto-Split und die vorhandene AAO nutzen.
3. Oben Tempo 10× wählen. Im Test ohne Kartenposition dauern Ausrücken und Anfahrt zusammen etwa 36 reale Sekunden.
4. Status 4 und Erkundung abwarten. Nach Erkundungsende werden Lage und Ressourcenbedarf sichtbar; das Fahrzeug bleibt gebunden.
5. Maßnahmen und Abschlussphase beobachten. Bei 10× benötigt die Arbeit vor Ort je nach Variante etwa zwei bis vier reale Minuten.
6. Bei „Beendet“ stehen die Fahrzeuge wieder zur Verfügung. Ein zweites, später alarmiertes Fahrzeug darf den Fortschritt nicht zurücksetzen.

Automatische Anrufe laufen ebenfalls beschleunigt; ihre Klingeldauer beträgt weiterhin 20 Simulationssekunden, bei 10× also zwei reale Sekunden. Für den Test kann im Startmenü die Frequenz auf 25 % gesenkt werden.

Prüfung: `node --test tests/einsatzLebenszyklus.test.mjs`. Die Tests prüfen Zeitfaktoren und Wechsel, Phasengrenzen, dauerhafte Bindung, Untereinsätze, späte Fahrzeuge, Routingantworten, Erkundung, Freigabe und große Zeitsprünge.
