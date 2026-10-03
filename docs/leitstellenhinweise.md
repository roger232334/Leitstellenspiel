# Permanente Leitstellenhinweise

## Fahrzeug-Sprechwünsche

`sprechwunschHinzufuegen(warteschlange, fahrzeug, prioritaet, simulationsZeit)` legt einen Hinweis vom Typ `sprechwunsch` an. Er enthält `fahrzeugId`, `funkrufname`, `funkgruppeId`, `funkgruppe`, `einsatzId` (oder `null`), `prioritaet` (`normal` oder `dringend`) und `erstelltAm`. Name, Gruppe und Einsatzbezug werden zum Erstellungszeitpunkt kopiert und ändern sich nicht nachträglich beim Umgruppieren oder Freigeben des Fahrzeugs.

Normale Sprechwünsche erscheinen neutral, dringende gelb und zusätzlich mit der Beschriftung „Dringend“. Die Funkgruppe steht groß oben, der Funkrufname kleiner darunter. Zeitpunkt und gegebenenfalls Einsatznummer bleiben sichtbar. Die Reihenfolge bleibt die Eingangsreihenfolge; Hinweise laufen nicht ab.

Zum Testen in der Notrufannahme rechts eine Funkgruppe wählen. Bei ihren Fahrzeugen lässt sich unter „Sprechwunsch simulieren“ entweder „Normal“ oder „Dringend“ anklicken. Der Kasten erscheint in der Hinweisleiste der Einsatzbearbeitung. Fahrzeuge benötigen dafür eine im Adminbereich hinterlegte Funkgruppe. Das Erzeugen schreibt ausschließlich in die Hinweiswarteschlange, nicht in den Kommunikationsverlauf.

Ein Klick auf den Inhalt des Sprechwunschkastens (auch per Tastatur erreichbar) nimmt den Wunsch an: `sprechwunschAnnehmen` prüft Fahrzeug und Funkgruppe, setzt `funk.aktiveGruppeId` und `funk.teilnehmerId` und entfernt genau diesen Wunsch. Die App öffnet die Notrufannahme mit voreingestelltem Fahrzeug und geöffneter Funkspruch-Eingabe. Erst „Funkspruch erzeugen“ sendet den eingegebenen Wortlaut als `kanal: 'funk'`. Die Annahme selbst erzeugt keine Sprache. Bei fehlendem Fahrzeug oder zwischenzeitlich geänderter Funkgruppe bleibt der Hinweis mit Fehlermeldung offen. „Entfernen“ verwirft weiterhin nur den Hinweis, ohne ihn anzunehmen.

Funkteilnehmer und Gruppe sind zentral gespeichert und bleiben beim Modulwechsel erhalten. Ein Wechsel auf eine andere Gruppe setzt den Teilnehmer auf Leitstelle zurück. Die Annahme und das Senden ändern weder den aktiven Telefonstatus noch Telefonbeiträge; das Gespräch kann parallel fortgeführt werden.

`App.vue` hält die zentrale reaktive Warteschlange `leitstellenHinweise`. Die Einsatzbearbeitung zeigt sie unabhängig vom ausgewählten Einsatz am unteren Rand, unmittelbar über der Statusleiste. Die Darstellung liegt in `LeitstellenHinweisleiste.vue`. Der Arbeitsbereich darüber scrollt bei Platzmangel; die Leiste bleibt sichtbar. Mehrere Kästen stehen in einer horizontal scrollbareren Reihe.

`src/data/leitstellenHinweise.js` definiert die stabilen Typen `sprechwunsch`, `weitergeleiteter_einsatz`, `polizeieinsatz`, `brandmeldeanlage` und `ereignis`. Weitere Typen können dort ergänzt werden.

```js
hinweisHinzufuegen(leitstellenHinweise.value, {
  typ: 'ereignis',
  titel: 'Hinweis prüfen',
  text: 'Zusätzliche Beschreibung',
  erstelltAm: simulationsZeit.value,
  einsatzId: null,   // optionaler späterer Bezug
  fahrzeugId: null,  // optionaler späterer Bezug
})
hinweisEntfernen(leitstellenHinweise.value, hinweisId)
```

Die Funktion erzeugt eine eindeutige ID und hängt den Hinweis an. Es gibt keine Ablaufzeit, keinen Timer und keine automatische Entfernung bei Status- oder Einsatzwechsel. „Entfernen“ entfernt genau diesen Hinweis; es löst keine weiteren Fachaktionen aus. Die Warteschlange bleibt bei Tabwechseln und im ausgelagerten Einsatzfenster erhalten. Sie ist derzeit Schichtzustand im Arbeitsspeicher und wird nach einem Neuladen nicht wiederhergestellt.

Beim Schichtstart werden vorerst vier deutlich als TEST markierte Beispiele angelegt. Sie erzeugen weder echte Sprechwünsche noch Einsätze und werden nicht in Kommunikation oder Chronik gespiegelt. Nach Entfernen aller Kästen bleibt die Leiste mit „Keine offenen Leitstellenhinweise“ sichtbar. Spätere Ereignisquellen können `hinweisHinzufuegen` verwenden; ihre Fachlogik wird in diesem Schritt noch nicht implementiert.
