# Fahrzeugbeladung und Ausrüstung

Die Anbindung an die Einsatzbearbeitung, Statusfilter und manuell anlegbare Tests sind unter [Tatsächlicher Einsatzbedarf](einsatzbedarf.md) beschrieben.

Im Adminbereich unter Fahrzeuge besitzt jedes Fahrzeug eine eigene Beladung. Aufklappbare Kategorien enthalten Mengenfelder und Ja/Nein-Schalter. Die Maske entsteht aus dem zentralen Katalog; zusätzliche Einträge benötigen keine neuen Formularfelder im Vue-Template.

## Datenmodell

`fahrzeug.beladung` enthält `version: 1`, `ressourcen` (nichtnegative ganze Zahlen) und `ausruestung` (Booleans). Beispielauszug:

```js
beladung: {
  version: 1,
  ressourcen: { wasserLiter: 1600, schaummittelLiter: 120, atemschutzgeraete: 4 },
  ausruestung: { schneidSpreizwerkzeug: true, kettensaege: true, boot: false }
}
```

Gespeicherte Daten enthalten alle Katalogfelder. IDs bleiben unabhängig von den deutschen Beschriftungen stabil. Notarzt und First Responder verwenden weiterhin die bestehenden Fahrzeugmerkmale `hatNotarzt` und `istFirstResponder`; sie werden nicht als Ausrüstung dupliziert.

## Vorlagen, Migration und Speicherung

`src/data/ausruestung/fahrzeugStandardbeladungen.js` enthält anpassbare **Simulationsvorlagen, keine verbindlichen Normbeladungen**. HLF 20 startet beispielsweise mit 1.600 Litern Wasser, 120 Litern Schaummittel und vier Atemschutzgeräten. Es gibt weitere Vorlagen für HLF 10, LF, TLF, RW und medizinische Grundausstattung für RTW, KTW und NEF. Exakte Typvorlagen haben Vorrang vor allgemeinen Basistypen. Ohne passende Vorlage bleibt die Beladung leer.

Fahrzeuge ohne bisherige `beladung` erhalten beim Normalisieren eine frische Typvorlage. Bei vorhandener Beladung bleiben explizite Nullmengen und Nein-Werte erhalten; fehlende Katalogfelder werden leer ergänzt. Ungültige Mengen, unbekannte IDs und nicht unterstützte Versionen führen beim Speichern zu einem Fehler.

Ein Typwechsel übernimmt die neue Vorlage automatisch, solange die alte Standardbeladung unverändert ist. Bei individuellen Änderungen fragt die Maske nach: Bestätigen ersetzt die Beladung, Abbrechen behält sie für den neu ausgewählten Typ. „Standardbeladung wiederherstellen“ ersetzt nach Bestätigung die gesamte Beladung durch die Vorlage des aktuellen Typs.

Der bestehende lokale Fahrzeugdatenspeicher bleibt erhalten. Bearbeitungsentwürfe und Fahrzeuge beim Schichtstart bekommen unabhängige Kopien. Abbrechen eines Entwurfs verändert die gespeicherte Beladung nicht. Zwei Fahrzeuge desselben Typs können unterschiedliche Beladungen besitzen.

## Verwendung und spätere Einsatzlogik

Alle folgenden Helfer werden aus `src/data/ausruestung/beladung.js` importiert:

```js
fahrzeugHatAusruestung(fahrzeug, 'schneidSpreizwerkzeug')
fahrzeugRessource(fahrzeug, 'wasserLiter')
fahrzeugHatFaehigkeit(fahrzeug, 'technische-rettung')
beladungenSummieren(fahrzeuge)
einsatzFehlbedarf({
  ressourcen: { wasserLiter: 3200, atemschutzgeraete: 6 },
  ausruestung: ['schneidSpreizwerkzeug'],
}, fahrzeuge)
```

`einsatzFehlbedarf` liefert `{ ressourcen, ausruestung, erfuellt }` mit nur den fehlenden Mengen bzw. Ausrüstungs-IDs. Ein Standard-HLF 20 lässt im Beispiel 1.600 Liter Wasser und zwei Atemschutzgeräte offen; zwei solche Fahrzeuge erfüllen den Bedarf. Doppelte Fahrzeug-IDs werden nicht doppelt gezählt. Unbekannte Anforderungen werden zurückgewiesen. Lesehelfer liefern bei ungültiger Beladung sicher `false` bzw. `0`.

Fähigkeitsregeln stehen im Katalog. Mehrere benötigte Ausrüstungen müssen für eine Fahrzeugfähigkeit auf demselben Fahrzeug vorhanden sein (beispielsweise Stromerzeuger und Beleuchtung). Diese Regeln sind eine vereinfachte Grundlage, keine vollständige Prüfung von Personalqualifikationen oder Einsatzmöglichkeiten.

Die bisherige AAO, Statuswechsel und Routenlogik bleiben unverändert. Der spätere Aufrufer muss festlegen, welche Fahrzeuge zählen: vorgeschlagene, zugeordnete oder bereits eingetroffene Fahrzeuge. Verbrauch, Personal, zeitlicher Einsatzfortschritt und automatische Nachalarmierung sind noch nicht implementiert. Die Fehlbedarfsprüfung liefert dafür die gemeinsame Grundlage.

## Erweitern und prüfen

Neue Ausrüstung mit stabiler ID, Kategorie, Typ und gegebenenfalls Einheit in `ausruestungsKatalog.js` ergänzen. Mengen und Booleans bleiben getrennt. Bei Bedarf passende Werte in den Typvorlagen sowie eine abgeleitete Fähigkeitsregel ergänzen. Die Oberfläche übernimmt neue Katalogeinträge automatisch.

Manuelle Prüfung:

1. Im Adminbereich ein HLF 20 anlegen und die vorgeschlagenen Mengen prüfen.
2. Wasser auf 2.000 Liter ändern und Schneid-/Spreizwerkzeug deaktivieren. Speichern und erneut öffnen: Beide Änderungen bleiben erhalten.
3. Ein zweites HLF 20 anlegen: Es besitzt weiterhin die ursprüngliche Standardbeladung.
4. Einen Entwurf verändern und abbrechen: Der gespeicherte Stand bleibt unverändert.
5. Den Typ ändern und die individuelle Beladung behalten oder durch die neue Vorlage ersetzen. Anschließend den Standardreset prüfen.
6. Die Seite neu laden und die gespeicherten Werte kontrollieren; auf schmalem Fenster bleiben die Kategorien ohne horizontales Scrollen bedienbar.

Automatisierte Datenmodellprüfungen: `node --test tests/beladung.test.mjs`. Gesamte Testsuite: `node --test tests/*.test.mjs`. Produktionsbundle: `npm run build-only`.
