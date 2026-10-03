# Einsatzphasen und Funk

## Aktueller Bedienablauf: gruppierte Hinweise

Die Hinweisleiste zeigt pro Funkgruppe getrennte Kästen für normale (neutral)
und dringende (gelb) Sprechwünsche, bei anderen Hinweisen einen pro Typ.
Gleiche Funkgruppe und Priorität werden gemeinsam dargestellt. Ein Klick öffnet
die entsprechenden Einträge im Detailfenster; allein dadurch wird nichts angenommen
und keine verborgene Lage angezeigt. Alle offenen Einträge bleiben dort einzeln
auswählbar. Neue Hinweise werden auch bei geöffnetem Fenster ergänzt.

„Sprechaufforderung senden“ wählt gezielt das Fahrzeug und die Funkgruppe aus und
schreibt eine gesprochene Aufforderung der Leitstelle in den Funkverlauf. Eine
hinterlegte Fahrzeugmeldung folgt unmittelbar; damit entfällt für diesen Weg
das frühere separate Auslösen in der Funkbedienung. Ohne hinterlegte Meldung wird
keine Antwort erfunden. Andere Hinweise bleiben offen. Das Detailfenster bleibt
geöffnet, damit weitere Wünsche gezielt bearbeitet werden können. Ein laufendes
Telefonat bleibt aktiv. Der bisherige separate Sendeweg bleibt für bereits
vorbereitete Meldungen bestehen.

Die Phasensteuerung bleibt unabhängig von der Kommunikation. Der Adapter in
`src/data/einsatzFunk.js` verarbeitet drei vorhandene Ereignisse:

| Ereignis | Bedeutung |
| --- | --- |
| `erstesFahrzeugEingetroffen` | Erste Ankunft |
| `erkundungAbgeschlossen` | Erkundung beendet |
| `einsatzAbschluss` | Beginn der Abschlussphase, Maßnahmen weitgehend abgeschlossen |

Interne Ereignisse erzeugen keine Sprachbeiträge. Der bisherige Eintrag in der
Chronik bleibt erhalten. Der Adapter erstellt lediglich einen Sprechwunsch mit
einem vorbereiteten Meldetext. Der Text erscheint erst nach Annahme und bewusstem
Senden als `kanal: 'funk'` im gemeinsamen Kommunikationsfenster. Ein aktives
Telefonat bleibt dabei unverändert.

## Meldetexte

Einsatzarten und Lagevarianten in `src/data/einsaetze/einsatzKatalog.js` können
`funkmeldungen` definieren, beispielsweise:

```js
funkmeldungen: {
  erkundungAbgeschlossen: {
    text: 'Zimmerbrand bestätigt, eine Person wird vermisst.',
    prioritaet: 'dringend' // optional, sonst normal
  }
}
```

Der Generator kopiert die Meldungen nach `einsatz.szenario.funkmeldungen`.
Variantentexte überschreiben gleichnamige Meldungen der Einsatzart. Die erste
Ankunftsmeldung verrät noch keine unbekannte Lage. Alle fünf Zimmerbrandvarianten
besitzen Erkundungs- und Abschlussmeldungen. Alte Einsätze ohne diese Daten
erzeugen keine neuen Phasensprechwünsche.

## Absender und Warteschlange

Es zählt ein zugeordneter, bereits eingetroffener Wagen (Status 4) mit Funkgruppe
und Funkrufname. Fahrzeuge der Untereinsätze zählen ebenfalls. Bevorzugt wird das
zuerst eingetroffene geeignete Fahrzeug. Ohne passenden Absender wird kein
Sprechwunsch erzeugt und derzeit auch keiner nachträglich nachgeholt.

Verarbeitete Ereignisse werden am Einsatz vermerkt, damit dieselbe Meldung nach
Entfernung des Hinweises nicht erneut entsteht. Die offene Hinweisleiste zeigt
keinen vorbereiteten Lagebericht. Bei Annahme werden Gruppe und Teilnehmer
gewählt und die Rückmeldung in der Funkbedienung zum Senden bereitgestellt.
Der Wortlaut wird nicht als Entwurf angezeigt. Eine noch nicht
gesendete angenommene Meldung wird durch weitere Annahmen nicht überschrieben.
Nach einem Gruppenwechsel führt „Zur angenommenen Fahrzeugmeldung“ zurück.

## Ausprobieren

In der Einsatzbearbeitung unter „Bedarf testen“ einen Zimmerbrand generieren und
ein Fahrzeug mit Funkgruppe alarmieren. Nach Ankunft den Sprechwunsch unten
annehmen und in der Notrufannahme „Fahrzeugrückmeldung senden“ wählen. Nach Erkundung
und zu Beginn der Abschlussphase folgen weitere Wünsche. Die Simulationszeit
kann beschleunigt werden. Ohne Annahme/Senden bleibt der Kommunikationsverlauf
unverändert; das gilt auch während eines Telefonats.

Die Anbindung steuert weder Nachalarmierung noch neue Zufallsverläufe. Weitere
Einsatzarten können Meldetexte über dieselbe Datenstruktur ergänzen.

## Vollständiger Zimmerbrand-Test

Neu generierte Zimmerbrände verwenden `szenario.lageDurchFunk: true`. Das Ende
der Erkundung setzt nur `szenario.erkundet`. Lagebezeichnung, Modifikatoren,
Ressourcenbedarf und die geplante Dauer bleiben bis zur gesendeten
Erkundungsrückmeldung verborgen. Erst dann wird `lageBekannt` für den Einsatz
und seine Untereinsätze gesetzt. Ankunftsmeldung, bloße Annahme und fehlgeschlagenes
Senden geben die Lage nicht frei. Ohne Funkrückmeldung bleibt sie unbekannt.

Die Rückmeldung verwendet die einmal erzeugte Variante:

| Lagevariante | Erkundungsrückmeldung |
| --- | --- |
| Angebranntes Essen | Kein offenes Feuer, lediglich angebranntes Essen. |
| Kleinbrand im Zimmer | Kleinbrand im Zimmer bestätigt. Wir beginnen mit der Brandbekämpfung. |
| Zimmer im Vollbrand | Zimmerbrand bestätigt. |
| Person vermisst | Zimmerbrand bestätigt, eine Person wird vermisst. |
| Brandausbreitung | Feuer hat sich weiter ausgebreitet. |

Der bereits erzeugte Bedarf wird unverändert wiederverwendet. Für andere oder
ältere Szenarien ohne `lageDurchFunk` bleibt die bisherige Freigabe nach Erkundung
bestehen. `tests/zimmerbrandRueckmeldung.test.mjs` prüft alle fünf Varianten vom
Alarmieren bis zum tatsächlich gesendeten Bericht einschließlich verborgenen
Unterbedarfs und fehlgeschlagenen Sendens.
