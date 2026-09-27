// Automatisch aus:
// "2024-04-18 ABeK Rettungsdienst und Feuerwehr Änderungen (Quelle ZRF)"
// Tabellenblatt: "ABeK RDB R FW"
// Maßgeblich ist die Spalte "Verknüpfung RD NEU".
//
// Enthalten sind ausschließlich Zeilen, in denen "Verknüpfung RD NEU"
// einen Wert enthält. Stand der Quelldatei: 18.04.2024.
//
// Diese Datei dient als Datenbasis. Die konkrete Übersetzung von z. B.
// "RD 1 + ELRD", "2 RTW + ELRD" oder "RD 4 + SanEL" in konkrete
// Fahrzeug-/Funktionsanforderungen erfolgt separat in der AAO-Logik.

export const rdVerknuepfungen = [
  {
    "id": "FW-RD-001",
    "quellzeile": 19,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 2 PERSON",
    "schlagwort": "Bau-, Wohncontainer / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-002",
    "quellzeile": 20,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 2 PERSON",
    "schlagwort": "Gartenhütte, Schuppen / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-003",
    "quellzeile": 21,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 2 PERSON",
    "schlagwort": "Person",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-004",
    "quellzeile": 22,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 2 PERSON",
    "schlagwort": "PKW / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-005",
    "quellzeile": 23,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 2 PERSON",
    "schlagwort": "PKW / Person in Gefahr auf BAB",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-006",
    "quellzeile": 24,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Am Gebäude",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-007",
    "quellzeile": 25,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Brandgeruch (im Gebäude)",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-008",
    "quellzeile": 26,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Dachstuhl",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-009",
    "quellzeile": 27,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Dehnfuge",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-010",
    "quellzeile": 28,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Garage",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-011",
    "quellzeile": 29,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Keller",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-012",
    "quellzeile": 30,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Rauchentwicklung (im Gebäude)",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-013",
    "quellzeile": 31,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Zimmer",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-014",
    "quellzeile": 32,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Berghütte",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + BW + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD + EL-BW"
  },
  {
    "id": "FW-RD-015",
    "quellzeile": 33,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "Fahrzeug / Maschine",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-016",
    "quellzeile": 34,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "LKW/Bus außerorts",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-017",
    "quellzeile": 35,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "LKW/Bus auf BAB",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-018",
    "quellzeile": 36,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "auf B3",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-019",
    "quellzeile": 37,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3",
    "schlagwort": "überhitzter Heustock",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-020",
    "quellzeile": 38,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "Dachstuhl / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-021",
    "quellzeile": 39,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "Garage / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-022",
    "quellzeile": 40,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "Keller / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-023",
    "quellzeile": 41,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "Rauchentwicklung / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-024",
    "quellzeile": 42,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "Zimmer / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-025",
    "quellzeile": 43,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "LKW / Person in Gefahr",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-026",
    "quellzeile": 44,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "LKW / Person in Gefahr auf BAB",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-027",
    "quellzeile": 45,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 3 PERSON",
    "schlagwort": "auf B 3 Person",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-028",
    "quellzeile": 46,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "ausgedehnt / hoch bis 6.OG",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-029",
    "quellzeile": 47,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Tiefgarage",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-030",
    "quellzeile": 48,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Wohnheim",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-031",
    "quellzeile": 49,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Behinderteneinrichtung",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL + SEG Beh"
  },
  {
    "id": "FW-RD-032",
    "quellzeile": 50,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Hochhaus ab 7. OG",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-033",
    "quellzeile": 51,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Supermarkt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-034",
    "quellzeile": 52,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Kindergarten",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-035",
    "quellzeile": 53,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Kino",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-036",
    "quellzeile": 54,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Kirche",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-037",
    "quellzeile": 55,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Schule",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-038",
    "quellzeile": 56,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Theater",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-039",
    "quellzeile": 57,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Zirkus",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-040",
    "quellzeile": 58,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Sägewerk / Schreinerei",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-041",
    "quellzeile": 59,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Lagerhalle",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-042",
    "quellzeile": 60,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Silo (kein Gefahrstoff)",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-043",
    "quellzeile": 61,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "große Höhe -Turm",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-044",
    "quellzeile": 62,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "große Höhe -Windrad",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-045",
    "quellzeile": 63,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Bauernhof",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-046",
    "quellzeile": 64,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Stall / Scheune",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-047",
    "quellzeile": 65,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Aussiedlerhof",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-048",
    "quellzeile": 66,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "auf B4",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-049",
    "quellzeile": 67,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Hotel",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-050",
    "quellzeile": 68,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 4",
    "schlagwort": "Industriegebäude",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-051",
    "quellzeile": 69,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 5",
    "schlagwort": "Pflege-/Altenheim",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL + SEG Beh"
  },
  {
    "id": "FW-RD-052",
    "quellzeile": 70,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 5",
    "schlagwort": "Kaufhaus",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-053",
    "quellzeile": 71,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 5",
    "schlagwort": "Krankenhaus",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "RD 4 + SanEL + SEG Beh"
  },
  {
    "id": "FW-RD-054",
    "quellzeile": 72,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 5",
    "schlagwort": "auf B5",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-055",
    "quellzeile": 73,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 6",
    "schlagwort": "auf B6",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-056",
    "quellzeile": 74,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 7",
    "schlagwort": "auf B7",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-057",
    "quellzeile": 75,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B 8",
    "schlagwort": "auf B8",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-058",
    "quellzeile": 77,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B BMA",
    "schlagwort": "Rauchwarnmelder Hausnotruf",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0"
  },
  {
    "id": "FW-RD-059",
    "quellzeile": 78,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B BMA",
    "schlagwort": "Rauchwarnmelder",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0"
  },
  {
    "id": "FW-RD-060",
    "quellzeile": 79,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B BOOT",
    "schlagwort": "Boot / Yacht / Floß",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + EL-WR",
    "verknuepfungNeu": "RD 0 + ELRD + EL-WR"
  },
  {
    "id": "FW-RD-061",
    "quellzeile": 81,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B SCHIENENTUNNEL",
    "schlagwort": "Zug im Tunnel",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-062",
    "quellzeile": 82,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B SCHIENENTUNNEL",
    "schlagwort": "S-Bahn im Tunnel",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-063",
    "quellzeile": 83,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B SCHIENENTUNNEL",
    "schlagwort": "U-Bahn im Tunnel",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-064",
    "quellzeile": 84,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B SCHIFF",
    "schlagwort": "Passagierschiff",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5 + WR",
    "verknuepfungNeu": "RD 4 + SanEL + WR"
  },
  {
    "id": "FW-RD-065",
    "quellzeile": 85,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B SCHIFF",
    "schlagwort": "Frachtschiff",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3 + WR",
    "verknuepfungNeu": "2 RTW + ELRD + WR"
  },
  {
    "id": "FW-RD-066",
    "quellzeile": 86,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B STRAßENTUNNEL",
    "schlagwort": "Tunnel",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-067",
    "quellzeile": 87,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B WALD",
    "schlagwort": "Wald groß (>1,000m²)",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-068",
    "quellzeile": 88,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B WALD",
    "schlagwort": "Bergwald",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + BW + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD + EL-BW"
  },
  {
    "id": "FW-RD-069",
    "quellzeile": 89,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B ZUG",
    "schlagwort": "Personenzug",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-070",
    "quellzeile": 90,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B ZUG",
    "schlagwort": "Güterzug",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-071",
    "quellzeile": 91,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B ZUG",
    "schlagwort": "Zug nur Lokomotive",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-072",
    "quellzeile": 92,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B ZUG",
    "schlagwort": "Straßenbahn",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-073",
    "quellzeile": 93,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B ZUG",
    "schlagwort": "U-Bahn im Freien",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1 + ELRD",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-074",
    "quellzeile": 94,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B ZUG",
    "schlagwort": "S-Bahn im Freien",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-075",
    "quellzeile": 95,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL AMOK FW",
    "schlagwort": "Amoklage",
    "bemerkung": null,
    "verknuepfungAlt": "RD Amok",
    "verknuepfungNeu": "RD Amok"
  },
  {
    "id": "FW-RD-076",
    "quellzeile": 97,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL BOMBENDROHUNG",
    "schlagwort": "Bombendrohung",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "ELRD"
  },
  {
    "id": "FW-RD-077",
    "quellzeile": 98,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL BOMBENFUND",
    "schlagwort": "Bombenfund",
    "bemerkung": null,
    "verknuepfungAlt": "Maßnahme ELRD verständigen",
    "verknuepfungNeu": "ELRD"
  },
  {
    "id": "FW-RD-078",
    "quellzeile": 101,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL GEBÄUDEEINSTURZ",
    "schlagwort": "Gebäude eingestürzt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-079",
    "quellzeile": 105,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P RETTUNG H/T",
    "schlagwort": "Person droht zu springen",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-080",
    "quellzeile": 106,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P RETTUNG H/T",
    "schlagwort": "Person absturzgefährdet",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-081",
    "quellzeile": 107,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P RETTUNG H/T",
    "schlagwort": "Person in Höhe",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-082",
    "quellzeile": 108,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P RETTUNG H/T",
    "schlagwort": "Person aus Tiefe / Schacht",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-083",
    "quellzeile": 110,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P RETTUNG H/T",
    "schlagwort": "Person auf Windrad / Kran",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-084",
    "quellzeile": 111,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P RETTUNG H/T",
    "schlagwort": "Paraglider / Fallschirmspringer / Dra- chenflieger abgestürzt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD Maßnahme BW?",
    "verknuepfungNeu": "RD 2 + ELRD + EL-BW"
  },
  {
    "id": "FW-RD-085",
    "quellzeile": 112,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P STRAßENBAHN",
    "schlagwort": "Person unter Straßenbahn",
    "bemerkung": null,
    "verknuepfungAlt": "RD 1",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-086",
    "quellzeile": 113,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P STRAßENBAHN",
    "schlagwort": "Straßenbahn",
    "bemerkung": null,
    "verknuepfungAlt": null,
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-087",
    "quellzeile": 114,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P STROM",
    "schlagwort": "Person Stromunfall",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-088",
    "quellzeile": 115,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P VERSCHÜTTET",
    "schlagwort": "Person verschüttet / Tiefbauunfall",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-089",
    "quellzeile": 116,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P VERSCHÜTTET",
    "schlagwort": "Person in Silo",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-090",
    "quellzeile": 117,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P EINGESCHLOSSEN",
    "schlagwort": "Wohnung öffnen akut",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0"
  },
  {
    "id": "FW-RD-091",
    "quellzeile": 118,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P EINGESCHLOSSEN",
    "schlagwort": "Fahrzeug öffnen akut",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0",
    "verknuepfungNeu": "RD 0"
  },
  {
    "id": "FW-RD-092",
    "quellzeile": 119,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P ZUG",
    "schlagwort": "Person unter Zug",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-093",
    "quellzeile": 120,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P ZUG",
    "schlagwort": "Person unter S-Bahn",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-094",
    "quellzeile": 121,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL P ZUG",
    "schlagwort": "Person vom Zug erfasst",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-095",
    "quellzeile": 137,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 1",
    "schlagwort": "Personensuche",
    "bemerkung": null,
    "verknuepfungAlt": null,
    "verknuepfungNeu": "ELRD"
  },
  {
    "id": "FW-RD-096",
    "quellzeile": 144,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 1",
    "schlagwort": "Waldunfall ohne eingeklemmte Person",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD + BW",
    "verknuepfungNeu": "RD 1 + ELRD + BW"
  },
  {
    "id": "FW-RD-097",
    "quellzeile": 146,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 2",
    "schlagwort": "mehrere PKW",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-098",
    "quellzeile": 147,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 2",
    "schlagwort": "LKW / Bus (leer), ohne eingeklemmte Personen",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-099",
    "quellzeile": 148,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 3",
    "schlagwort": "Person eingeklemmt (nicht VU)",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 2 + ELRD"
  },
  {
    "id": "FW-RD-100",
    "quellzeile": 149,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 3",
    "schlagwort": "1 oder 2 PKW, Person eingeklemmt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-101",
    "quellzeile": 150,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 3",
    "schlagwort": "Bus (besetzt)",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "RD 5"
  },
  {
    "id": "FW-RD-102",
    "quellzeile": 153,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 3",
    "schlagwort": "Kran umgestürzt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-103",
    "quellzeile": 154,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 3",
    "schlagwort": "Waldunfall mit eingeklemmter Person",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2 + ELRD + BW",
    "verknuepfungNeu": "RD 2 + ELRD + BW"
  },
  {
    "id": "FW-RD-104",
    "quellzeile": 155,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 4",
    "schlagwort": "mehrere PKW, Personen eingeklemmt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4",
    "verknuepfungNeu": "RD 4"
  },
  {
    "id": "FW-RD-105",
    "quellzeile": 156,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 4",
    "schlagwort": "LKW / Bus (leer), Person eingeklemmt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "RD 3"
  },
  {
    "id": "FW-RD-106",
    "quellzeile": 157,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 5",
    "schlagwort": "Massenkarambolage, Personen einge-klemmt",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "RD 5"
  },
  {
    "id": "FW-RD-107",
    "quellzeile": 158,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 5",
    "schlagwort": "Bus besetzt mit eingeklemmten Per-sonen",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5",
    "verknuepfungNeu": "MANV 10-15 + SEG Beh + SEG Betr"
  },
  {
    "id": "FW-RD-108",
    "quellzeile": 159,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 5",
    "schlagwort": "mehrere LKW mit eingeklemmten Personen",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4",
    "verknuepfungNeu": "RD 4"
  },
  {
    "id": "FW-RD-109",
    "quellzeile": 163,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL WASSER",
    "schlagwort": "Bergung Sache / Leiche",
    "bemerkung": null,
    "verknuepfungAlt": "Wassernot 0",
    "verknuepfungNeu": "Wassernot 0"
  },
  {
    "id": "FW-RD-110",
    "quellzeile": 165,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL WASSER",
    "schlagwort": "Rettung Person",
    "bemerkung": null,
    "verknuepfungAlt": "Wassernot 3",
    "verknuepfungNeu": "Wassernot 3"
  },
  {
    "id": "FW-RD-111",
    "quellzeile": 166,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL WASSER",
    "schlagwort": "Tauchereinsatz ohne Rettung",
    "bemerkung": null,
    "verknuepfungAlt": "Wassernot 0",
    "verknuepfungNeu": "Wassernot 0"
  },
  {
    "id": "FW-RD-112",
    "quellzeile": 184,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 1",
    "schlagwort": "Notlandung",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-113",
    "quellzeile": 185,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 1",
    "schlagwort": "Ballon",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-114",
    "quellzeile": 186,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 1",
    "schlagwort": "Hubschrauber",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-115",
    "quellzeile": 187,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 1",
    "schlagwort": "Kleinflugzeug",
    "bemerkung": null,
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL"
  },
  {
    "id": "FW-RD-116",
    "quellzeile": 188,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 2",
    "schlagwort": "Frachtflugzeug",
    "bemerkung": null,
    "verknuepfungAlt": "MANV 10-15",
    "verknuepfungNeu": "MANV 10-15"
  },
  {
    "id": "FW-RD-117",
    "quellzeile": 189,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 2",
    "schlagwort": "Passagierflugzeug",
    "bemerkung": null,
    "verknuepfungAlt": "MANV 10-15",
    "verknuepfungNeu": "MANV 10-15"
  },
  {
    "id": "FW-RD-118",
    "quellzeile": 190,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU FLUGZEUG 2",
    "schlagwort": "Militärflugzeug",
    "bemerkung": null,
    "verknuepfungAlt": "MANV 10-15",
    "verknuepfungNeu": "MANV 10-15"
  },
  {
    "id": "FW-RD-119",
    "quellzeile": 191,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU SCHIFF KOLLISION",
    "schlagwort": "Kollision Passagierschiff",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5 + WR",
    "verknuepfungNeu": "RD 4 + SanEL + WR"
  },
  {
    "id": "FW-RD-120",
    "quellzeile": 192,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU SCHIFF KOLLISION",
    "schlagwort": "Kollision Frachtschiff",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3 + WR",
    "verknuepfungNeu": "RD 3 + WR"
  },
  {
    "id": "FW-RD-121",
    "quellzeile": 193,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU SCHIFF KOLLISION",
    "schlagwort": "Kollision Boot / Yacht / Floß",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3 + WR",
    "verknuepfungNeu": "RD 3 + WR"
  },
  {
    "id": "FW-RD-122",
    "quellzeile": 194,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU SCHIFF LECK",
    "schlagwort": "Schiff leck Passagierschiff",
    "bemerkung": null,
    "verknuepfungAlt": "RD 5 + WR",
    "verknuepfungNeu": "RD 4 + SanEL + WR"
  },
  {
    "id": "FW-RD-123",
    "quellzeile": 195,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU SCHIFF LECK",
    "schlagwort": "Schiff leck Frachtschiff",
    "bemerkung": null,
    "verknuepfungAlt": "RD 3 + WR",
    "verknuepfungNeu": "RD 3 + WR"
  },
  {
    "id": "FW-RD-124",
    "quellzeile": 196,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL VU ZUG",
    "schlagwort": "Zug",
    "bemerkung": null,
    "verknuepfungAlt": "MANV 10-15",
    "verknuepfungNeu": "MANV 16-25"
  },
  {
    "id": "FW-RD-125",
    "quellzeile": 208,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC 3",
    "schlagwort": "große Menge",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-126",
    "quellzeile": 209,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC 3",
    "schlagwort": "Gasaustritt brennbar",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-127",
    "quellzeile": 210,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC 3",
    "schlagwort": "Gasaustritt im Gebäude",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 2 + ELRD",
    "verknuepfungNeu": "RD 1 + ELRD"
  },
  {
    "id": "FW-RD-128",
    "quellzeile": 211,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B ATOM",
    "schlagwort": "Brand Atom im Gebäude",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL"
  },
  {
    "id": "FW-RD-129",
    "quellzeile": 212,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B ATOM",
    "schlagwort": "Brand Atom im Freien",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL"
  },
  {
    "id": "FW-RD-130",
    "quellzeile": 213,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B ATOM",
    "schlagwort": "Brand Atom PKW / LKW",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL"
  },
  {
    "id": "FW-RD-131",
    "quellzeile": 214,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B ATOM",
    "schlagwort": "Brand Atomkraftwerk (AKW)",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "SanEL"
  },
  {
    "id": "FW-RD-132",
    "quellzeile": 215,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B",
    "schlagwort": "Brand Tankstelle",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-133",
    "quellzeile": 216,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B",
    "schlagwort": "Brand Biogasanlage",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 3",
    "verknuepfungNeu": "2 RTW + ELRD"
  },
  {
    "id": "FW-RD-134",
    "quellzeile": 217,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B",
    "schlagwort": "Brand Raffinerie",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-135",
    "quellzeile": 218,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B",
    "schlagwort": "Brand Tanklager",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-136",
    "quellzeile": 219,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B",
    "schlagwort": "Brand Tankwagen",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-137",
    "quellzeile": 220,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Bio im Gebäude",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-138",
    "quellzeile": 221,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Bio im Freien",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-139",
    "quellzeile": 222,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Bio PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-140",
    "quellzeile": 223,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Chemie im Gebäude",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-141",
    "quellzeile": 224,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Chemie im Freien",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-142",
    "quellzeile": 225,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Chemie Zug",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-143",
    "quellzeile": 226,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC B BIO / CHEMIE",
    "schlagwort": "Brand Chemie LKW",
    "bemerkung": "CHA: FB CBRN E / SEG-CBRNE",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-144",
    "quellzeile": 227,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL ATOM",
    "schlagwort": "THL Atom Austritt im Gebäude",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-145",
    "quellzeile": 228,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL ATOM",
    "schlagwort": "THL Atom Austritt im Freien",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-146",
    "quellzeile": 229,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL ATOM",
    "schlagwort": "THL Atom PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-147",
    "quellzeile": 230,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL ATOM",
    "schlagwort": "THL VU Atom PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-148",
    "quellzeile": 231,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL Bio Austritt im Freien",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-149",
    "quellzeile": 232,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL Bio Austritt im Gebäude",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-150",
    "quellzeile": 233,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL Bio PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-151",
    "quellzeile": 234,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL Chemie Austritt im Gebäude",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-152",
    "quellzeile": 235,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL Chemie Austritt im Freien",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-153",
    "quellzeile": 236,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL Chemie PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-154",
    "quellzeile": 237,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL VU Bio PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E) + SEG Infekt Leiter"
  },
  {
    "id": "FW-RD-155",
    "quellzeile": 238,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL VU Chemie PKW / LKW",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-156",
    "quellzeile": 239,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC THL BIO / CHEMIE",
    "schlagwort": "THL VU Chemie Zug",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 3 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-157",
    "quellzeile": 240,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC EXPLOSION",
    "schlagwort": "Explosion / Verpuffung",
    "bemerkung": "CHA: FB CBRN E",
    "verknuepfungAlt": "RD 4 + SAN EL",
    "verknuepfungNeu": "RD 4 + SanEL + Fachberater CBRN(E)"
  },
  {
    "id": "FW-RD-158",
    "quellzeile": 241,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC ÖL WASSER",
    "schlagwort": "Öl auf fließendem Gewässer",
    "bemerkung": null,
    "verknuepfungAlt": "Wassernot 0",
    "verknuepfungNeu": "Wassernot 0"
  },
  {
    "id": "FW-RD-159",
    "quellzeile": 242,
    "bereich": "ABC",
    "oberbegriff": "ABC",
    "einsatzstichwort": "ABC ÖL WASSER",
    "schlagwort": "Öl auf stehendem Gewässer",
    "bemerkung": null,
    "verknuepfungAlt": "Wassernot 0",
    "verknuepfungNeu": "Wassernot 0"
  },
  {
    "id": "FW-RD-160",
    "quellzeile": 253,
    "bereich": "B",
    "oberbegriff": "Brand",
    "einsatzstichwort": "B BMA 2",
    "schlagwort": "BMA Krankenhäuser und Altenheime",
    "bemerkung": null,
    "verknuepfungAlt": "RD 0 + ELRD",
    "verknuepfungNeu": "RD 0 + ELRD"
  },
  {
    "id": "FW-RD-161",
    "quellzeile": 255,
    "bereich": "T",
    "oberbegriff": "THL",
    "einsatzstichwort": "THL 3",
    "schlagwort": "e-call ohne Spracherwiederung",
    "bemerkung": null,
    "verknuepfungAlt": "RD 2",
    "verknuepfungNeu": "RD 1"
  }
];

function normalisiereCode(wert) {
  return String(wert ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function normalisiereText(wert) {
  return String(wert ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sucht die aktuelle RD-Verknüpfung zu einem FW-Katalogobjekt.
 *
 * Erwartet z. B. ein Objekt aus stichwortKatalog.js:
 * {
 *   stichwort: 'B 3',
 *   kategorie: 'im Gebäude',
 *   schlagwort: 'Zimmer'
 * }
 *
 * Rückgabe: vollständiger Eintrag aus rdVerknuepfungen oder null.
 */
export function findeRdVerknuepfung(fwStichwort) {
  if (!fwStichwort) {
    return null
  }

  const code = normalisiereCode(
    typeof fwStichwort === 'string'
      ? fwStichwort
      : fwStichwort.stichwort,
  )

  if (!code) {
    return null
  }

  const kandidaten = rdVerknuepfungen.filter(
    (eintrag) =>
      normalisiereCode(eintrag.einsatzstichwort) === code,
  )

  if (kandidaten.length === 0) {
    return null
  }

  if (typeof fwStichwort === 'string') {
    return kandidaten.length === 1
      ? kandidaten[0]
      : null
  }

  const schlagwort = normalisiereText(
    fwStichwort.schlagwort,
  )

  const kategorie = normalisiereText(
    fwStichwort.kategorie,
  )

  const varianten = new Set(
    [
      schlagwort,
      normalisiereText(
        `${fwStichwort.schlagwort ?? ''} ${fwStichwort.kategorie ?? ''}`,
      ),
      normalisiereText(
        `${fwStichwort.kategorie ?? ''} ${fwStichwort.schlagwort ?? ''}`,
      ),
    ].filter(Boolean),
  )

  const exakt = kandidaten.find(
    (eintrag) =>
      varianten.has(
        normalisiereText(eintrag.schlagwort),
      ),
  )

  if (exakt) {
    return exakt
  }

  if (schlagwort) {
    const unscharf = kandidaten.filter(
      (eintrag) => {
        const quelltext =
          normalisiereText(
            eintrag.schlagwort,
          )

        return (
          quelltext.includes(
            schlagwort,
          ) ||
          schlagwort.includes(
            quelltext,
          ) ||
          (
            kategorie &&
            quelltext.includes(
              kategorie,
            ) &&
            quelltext.includes(
              schlagwort,
            )
          )
        )
      },
    )

    if (unscharf.length === 1) {
      return unscharf[0]
    }
  }

  return kandidaten.length === 1
    ? kandidaten[0]
    : null
}

/**
 * Praktisch für Tests oder Adminmasken, wenn die Daten nicht
 * als Katalogobjekt vorliegen.
 */
export function findeRdVerknuepfungNachFwDaten(
  einsatzstichwort,
  schlagwort,
  kategorie = '',
) {
  return findeRdVerknuepfung({
    stichwort: einsatzstichwort,
    schlagwort,
    kategorie,
  })
}

/**
 * Zerlegt nur die Schreibweise der Verknüpfung in Einzelbestandteile.
 * Es erfolgt bewusst noch keine Interpretation in Fahrzeugtypen.
 *
 * "RD 1 + ELRD" -> ["RD 1", "ELRD"]
 * "RD 3 + SanEL + Fachberater CBRN(E)" ->
 * ["RD 3", "SanEL", "Fachberater CBRN(E)"]
 */
export function zerlegeRdVerknuepfung(
  verknuepfung,
) {
  return String(verknuepfung ?? '')
    .split('+')
    .map((teil) => teil.trim())
    .filter(Boolean)
}
