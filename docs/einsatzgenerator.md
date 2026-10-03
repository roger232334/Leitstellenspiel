# Datengetriebener Einsatzgenerator

Der Generator ergänzt die bisherigen Einsätze schrittweise. Automatische Anrufe verwenden weiterhin `notrufSzenarien.js`; der neue Katalog wird zunächst nur über den ausdrücklich gekennzeichneten Zimmerbrand-Test verwendet. Die Notruf-Einstiege sind Daten und werden im Test angezeigt, noch keine neuen vollständigen Gesprächsszenarien.

## Dateien und Trennung der Ebenen

- `src/data/einsaetze/einsatzKatalog.js`: Grundtypen, Einsatzarten, Notrufvarianten, reale Lagevarianten und Modifikatoren als getrennte Listen mit stabilen IDs.
- `src/data/einsaetze/einsatzGenerator.js`: gewichtete Auswahl und Erzeugung frischer Einsatzobjekte ohne Feuerwehr-Sonderfälle.
- `tests/einsatzGenerator.test.mjs`: Gewichte, Referenzen, Isolation, Modifikatoren, verdeckter Bedarf und medizinische Erweiterbarkeit.

Der Zimmerbrand verweist auf den vorhandenen Stichwortkatalogeintrag `B-11-23` (B 3, Zimmer). `katalogStichwoerter` erzeugt daraus die bisherigen Stichwörter einschließlich RD-Verknüpfung. Dieses Meldebild bleibt gleich, auch wenn die wirkliche Lage nur angebranntes Essen ist. Auto-Split und AAO verwenden weiterhin das gemeldete Bild.

Die Einsatzart `zimmerbrand` verweist auf den Grundtyp `gebaeudebrand` und Listen zulässiger Varianten. Eine Lagevariante beschreibt die Realität, ein Notruf beschreibt nur die Wahrnehmung des Anrufers. Die Notrufmetadaten enthalten Anrufertyp, Informationsqualität sowie bekannte und fehlende Informationen.

## Aufruf und Ergebnis

```js
import { generiereEinsatz } from '../src/data/einsaetze/einsatzGenerator.js'

const einsatz = generiereEinsatz('zimmerbrand')
// Der Aufrufer ergänzt eindeutige Laufzeit-ID, Ort und Position:
einsatz.id = 1234
einsatz.ort = 'Beispielstraße 1'
einsatz.position = null
```

Das Ergebnis enthält die üblichen Einsatzfelder, `meldebildId`, `schlagwort`, `stichwoerter`, `bedarf` und:

```js
szenario: {
  version: 1,
  einsatzartId: 'zimmerbrand',
  grundtypId: 'gebaeudebrand',
  lageVarianteId: 'zimmer-vollbrand',
  lageName: 'Zimmer im Vollbrand',
  lageBekannt: false,
  notrufVarianteId: 'nachbar-rauch',
  notruf: { /* eigenständige Kopie des ausgewählten Notrufs */ },
  modifikatoren: [ /* Kopien der tatsächlich ausgewählten Modifikatoren */ ],
  eskalationen: [ /* mögliche Übergänge, derzeit nur Metadaten */ ]
}
```

Auswahl und Bedarf werden einmal erzeugt und gespeichert. Rendering, Einsatzwechsel und Bedarfsauswertung verwenden diese Daten ohne erneute Zufallsauswahl. Verschiedene Einsätze und die Katalogvorlagen teilen keine veränderlichen Unterobjekte. Das Ergebnis ist JSON-serialisierbar; eine neue Speicherung laufender Schichten wird damit nicht eingeführt.

## Lage, Gewichtung und Modifikatoren

Die fünf Beispielgewichte sind 20 / 40 / 25 / 10 / 5. Bei Summe 100 entsprechen sie 20 % angebranntem Essen, 40 % Kleinbrand, 25 % Vollbrand, 10 % vermisster Person und 5 % Brandausbreitung. Generell gilt Gewicht geteilt durch die Summe aller Gewichte. Null deaktiviert eine Variante, fehlendes Gewicht bedeutet 1. Negative/ungültige Gewichte und eine Gesamtsumme von null sind Fehler.

Zuerst wird die reale Lage gezogen, anschließend ein passender Notruf. Optional kann eine Notrufvariante über `lageVarianten: ['zimmer-vollbrand', ...]` eingeschränkt werden. So erzeugt der Einstieg mit sichtbaren Fensterflammen keinen Widerspruch zum angebrannten Essen. Die Auswahl des Notrufes verändert nicht die Wahrscheinlichkeit der realen Lagen.

Modifikatoren werden über `modifikatoren: [{ id, wahrscheinlichkeit }]` an der Einsatzart freigegeben und unabhängig mit Wahrscheinlichkeit zwischen 0 und 1 gezogen. Ein `bedarfZusatz` verwendet dasselbe Bedarfsformat: Mengen werden addiert, Ausrüstungs- und Fähigkeitslisten vereinigt. Es gibt derzeit nur positive Zusatzmengen, keine komplexen Abhängigkeiten oder Ausschlussregeln. Die Beispiele „schwierige Wasserversorgung“ und „schlechte Sicht“ sind anpassbare Testannahmen, keine normativen Einsatzvorgaben. Die jeweiligen Rückmeldungen werden erst nach Erkundung sichtbar.

## Neue Einsatzarten und Varianten ergänzen

1. In `einsatzArten` eine stabile ID, einen Namen, die vorhandene `meldebildId`, einen Grundtyp und die zulässigen Varianten-IDs anlegen. Die Listen sind explizit, sodass neue Varianten anderer Einsatzarten nicht ungewollt mit ausgewählt werden.
2. Einen vorhandenen Grundtyp verwenden oder in `grundtypen` ergänzen. Der Kern behandelt ihn als Metadatum und enthält keine typbezogene Einsatzlogik.
3. Eine oder mehrere Notrufvarianten mit Einstieg und Metadaten ergänzen und an der Einsatzart referenzieren.
4. Für eine neue Lage in `lageVarianten` ID, Name, Gewicht und `bedarf` mit vorhandenen Ressourcen-/Ausrüstungs-IDs eintragen; ihre ID zur Einsatzart hinzufügen.
5. Optional Modifikatoren und spätere Eskalationsziele referenzieren. Eskalationsziele müssen derzeit zur gleichen Einsatzart gehören; Übergänge werden noch nicht ausgeführt.

Für Rettungsdienstlagen kann `bedarf.faehigkeiten` beispielsweise `notfallversorgung`, `patiententransport` oder `notarzt` fordern. Das nutzt die bereits vorhandenen Fahrzeugfähigkeiten. Ein automatisierter Test erzeugt einen medizinischen Einsatz mit demselben Generator, ohne Feuerwehrpfad.

Für reproduzierbare Tests unterstützt der Aufruf `{ zufall: () => 0.5, katalog: eigenerKatalog }`. Die Zufallsfunktion liefert Werte von 0 einschließlich bis 1 ausschließlich. Produktiv wird `Math.random` verwendet.

## Verdeckter Bedarf und Testablauf

Der wirkliche Bedarf steht bereits in `einsatz.bedarf`, bleibt bei `szenario.lageBekannt === false` jedoch von der sichtbaren Bedarfsauswertung ausgeschlossen. Dadurch verraten Mengen oder Fehlbedarf die verborgene Lage nicht. Nach Erkundung wird `lageBekannt` auf `true` gesetzt; die bestehende Ressourcenanzeige aktualisiert sich. Das gilt auch für Untereinsätze, die den Hauptbedarf anzeigen. Alte Einsätze ohne `szenario` werden unverändert ausgewertet.

1. Schicht starten und Einsatzbearbeitung öffnen.
2. „Bedarf testen“ aufklappen und „Zimmerbrand generieren (Test)“ wählen.
3. Der neue Einsatz zeigt das Meldebild und den Notruf-Einstieg. Die tatsächliche Lage bleibt verborgen.
4. Ein Fahrzeug alarmieren und eintreffen lassen. Nach der Erkundungsphase zeigt die Maske die gespeicherte reale Lage, Modifikatoren und den tatsächlichen Bedarf automatisch.
5. Den Generator erneut betätigen: Es entsteht jeweils ein eigener Einsatz mit neuer ID und neuer Auswahl. Gleiche Ergebnisse sind bei einer Zufallsauswahl möglich. Vorherige Einsätze bleiben in der Einsatzliste erreichbar und verändern ihre Lage nicht.

Die Lagevarianten besitzen jetzt eine einmalig gezogene Einsatzdauer. Erkundung und zeitgesteuerter Abschluss laufen über den [zentralen Lebenszyklus](einsatzlebenszyklus.md). Automatische Einbindung in den Notrufstrom, Eskalationen, Ressourcenverbrauch und bedarfsabhängiger Abschluss folgen später.

Prüfung: `node --test tests/einsatzGenerator.test.mjs`; Gesamtsuite: `node --test tests/*.test.mjs`.
