// Quelle: vom Nutzer bereitgestellte bayerische Funkrufnamenrichtlinie,
// 06.11.2014, Änderungsnachweis 30.01.2015, Anlagen 2.1–2.9.
// Gleiche Typen mehrerer Organisationen sind zusammengefasst; Varianten bleiben getrennt.
const gruppen = [
  'Führung und Mannschaftstransport', 'Tanklöschfahrzeuge', 'Hubrettung, Wechsellader und Krane',
  'Lösch- und Tragkraftspritzenfahrzeuge', 'Geräte- und Schlauchwagen', 'Rüst- und Gerätewagen',
  'Landrettungsdienst', 'Berg- und Höhlenrettung', 'Wasserrettung',
]
// Kennzahl | Kurzbezeichnung | Langtext | bisherige Simulationsklasse (optional)
const zeilen = `
10|KdoW|Kommandowagen
11|MZF|Mehrzweckfahrzeug
12|ELW 1|Einsatzleitwagen 1|ELW
12|ELW UG SANEL 1|Einsatzleitwagen 1 der UG SAN EL|ELW
12|ELW UG ÖEL 1|Einsatzleitwagen 1 der UG ÖEL|ELW
13|ELW 2|Einsatzleitwagen 2|ELW
13|ELW UG SANEL 2|Einsatzleitwagen 2 der UG SAN EL|ELW
13|ELW UG ÖEL 2|Einsatzleitwagen 2 der UG ÖEL|ELW
14|MTW|Mannschaftstransportwagen
14|MTW Betr.|MTW Betreuung|MTW
14|MTW SAN|MTW Sanitätsdienst|MTW
14|MTW RD|Mannschaftstransportwagen Rettungsdienst|MTW
15|LFZ|Luftfahrzeug
15|LuBeo|Luftbeobachter (Funktion)
15|FLUGH|Flughelfer (Funktion)
15|LRT|Luftretter (Funktion)
16|FMKW|Fernmeldekraftwagen
17|Krad|Kraftrad
18|FSW-Trp|Feuersicherheitswache-Trupp
20|TLF16/25-RS|Tanklöschfahrzeug 16/25 mit Rettungssatz|TLF
21|TLF16/25|Tanklöschfahrzeug 16/25|TLF
21|TLF3000|Tanklöschfahrzeug 3000|TLF
22|TLF16/24|Tanklöschfahrzeug 16/24|TLF
22|TLF2000|Tanklöschfahrzeug 2000|TLF
22|TLF8/18|Tanklöschfahrzeug 8/18|TLF
23|TLF24/48|Tanklöschfahrzeug 24/48|TLF
23|TLF24/50|Tanklöschfahrzeug 24/50|TLF
23|TLF4000|Tanklöschfahrzeug 4000|TLF
25|TroLF|Trockenlöschfahrzeug
27|SonLF|Sonderlöschmittelfahrzeug
29|SonTLF|Sondertanklöschfahrzeug
29|FLF|Flugfeldlöschfahrzeug
30|DLK23|Drehleiter 23/12 mit Korb|DLK
30|DL23|Drehleiter 23/12 ohne Korb
31|DLK18|Drehleiter 18/12 mit Korb|DLK
31|DL18|Drehleiter 18/12 ohne Korb
32|DLK12|Drehleiter 12/9 mit Korb|DLK
32|DL12|Drehleiter 12/9 ohne Korb
32|DLK16|Drehleiter 16/4 mit Korb|DLK
32|DL16|Drehleiter 16/4 ohne Korb
33|GM|Gelenkmast
33|HRFSON|Sonstiges Hubrettungsfahrzeug
33|TM|Teleskopmast
33|TGM|Teleskopgelenkmast
34|KW|Kranwagen
35|WLF|Wechselladerfahrzeug kurz ohne Kran
35|WLFK|Wechselladerfahrzeug kurz mit Kran
36|WLFL|Wechselladerfahrzeug lang ohne Kran
36|WLFLK|Wechselladerfahrzeug lang mit Kran
38|RTREPE|Rettungstreppe
39|Bagger|Bagger
39|Stapler|Stapler
39|Teleskoplader|Teleskoplader
39|HAGER|Hubarbeitsgerät (kein Rettungsgerät)
40|HLF20|Hilfeleistungslöschgruppenfahrzeug 20|HLF
40|LF16/12-RS|Löschgruppenfahrzeug 16/12 mit Rettungssatz|LF
41|LF20/12|Löschgruppenfahrzeug LF 20 ohne Rettungssatz|LF
41|LF16/12|Löschgruppenfahrzeug 16/12 ohne Rettungssatz|LF
41|LF20-KatS|LF-Katastrophenschutz|LF
42|HLF10|Hilfeleistungslöschgruppenfahrzeug 10|HLF
42|LF10/6-RS|Löschgruppenfahrzeug 10/6 mit Rettungssatz|LF
42|LF8/6-RS|Löschgruppenfahrzeug 8/6 mit Rettungssatz|LF
43|LF10|Löschgruppenfahrzeug LF10|LF
43|LF10/6|Löschgruppenfahrzeug 10/6 ohne Rettungssatz|LF
43|LF8/6|Löschgruppenfahrzeug 8/6 ohne Rettungssatz|LF
44|TSF|Tragkraftspritzenfahrzeug
44|TSF-PA|Tragkraftspritzenfahrzeug mit Pressluftatmern
45|TSA|Tragkraftspritzenanhänger
46|TSF-W|Tragkraftspritzenfahrzeug-Wasser
47|MLF|Mittleres Löschfahrzeug
47|StLF|Staffellöschfahrzeug
48|LF16-TS|Löschgruppenfahrzeug LF16-TS|LF
48|LF8-1|Löschgruppenfahrzeug LF8-1|LF
48|LF8-2|Löschgruppenfahrzeug LF8-2|LF
49|LFSON|Sonstiges Löschfahrzeug
49|KLF|Kleinlöschfahrzeug
50|GW|Gerätewagen
50|PKW|Personenkraftwagen
50|PKW-Kombi|Personenkraftwagen Kombi
51|GW-Öl|Gerätewagen Öl
51|RW-Öl|Rüstwagen Öl
52|GW-GSG|Gerätewagen GSG
52|GW-G|Gerätewagen Gefahrgut
53|GW-A|Gerätewagen Atemschutz
53|GW-AS|Gerätewagen Atemschutz / Strahlenschutz
53|GW-S|Gerätewagen Strahlenschutz
53|GW-TuS|Gerätewagen Technik und Sicherheit
54|GW-SAN25|Gerätewagen San 25
55|GW-L1|Gerätewagen Logistik 1
55|GW-SAN50|Gerätewagen San 50
55|LKW<7,5t|Lastkraftwagen unter 7,5 t
56|Btr-LKW|Betreuungs-LKW
56|GW-L2|Gerätewagen Logistik 2
56|LKW>7,5t|Lastkraftwagen über 7,5 t
57|SW1000|Schlauchwagen 1000
58|SW2000|Schlauchwagen 2000
59|GWSON|Sonstiger Gerätewagen
59|GW-HÖRG|Gerätewagen Höhenrettung
59|GW-Tier|Gerätewagen Tierrettung
59|GW-Tiertransport|Gerätewagen Tiertransport
59|GW-U|Gerätewagen Umwelt
60|RW3|Rüstwagen 3|RW
61|RW|Rüstwagen neue Norm
61|RW2|Rüstwagen 2|RW
62|RW1|Rüstwagen 1|RW
62|VRW|Vorausrüstwagen
63|LIMA|Lichtmastfahrzeug
63|RWSON|Sonstiger Rüstwagen
63|Generator|Stromgeneratorfahrzeug
65|KLAF|Kleinalarmfahrzeug
66|ABC-Erkunder|ABC-Erkunder
66|GW-Mess|Gerätewagen Messtechnik
67|DMF|Dekontaminationsmehrzweckfahrzeug
67|Dekon-P|Gerätewagen Dekon-P
68|Dekon-V|Gerätewagen Dekon-V
70|ITW|Intensiv-Transportwagen
70|NAW|Notarztwagen
71|I-RTW|Infektions-Rettungswagen|RTW
71|RTW-SEG|Organisationseigener RTW (SEG)|RTW
71|RTW|Rettungswagen
71|S-RTW|Schwerlast-Rettungswagen|RTW
72|KTW|Krankentransportwagen
72|KTW-SEG|Organisationseigener KTW (SEG)|KTW
73|KTW-4Tr|Krankentransportwagen 4 Tragen|KTW
73|KTW-B|Krankentransportwagen Typ B|KTW
74|RDSON|Sonstiges Rettungsdienstfahrzeug
75|G-RTW|Großraum-Rettungswagen
76|NEF|Notarzteinsatzfahrzeug
76|VEF|Verlegungsarzteinsatzfahrzeug
77|ATW|Arzttruppwagen
78|SAN-Trupp|Sanitätstrupp
79|FR|First Responder
79|HvO|Helfer vor Ort
80|EMEK|Einsatzmittel / Einsatzkraft Bergrettung
81|RFZ|Bergrettungsfahrzeug
82|GSFZ|Schneefahrzeug Bergrettung
83|GW LKLD|Gerätewagen LKLD
84|BW GW|Gerätewagen Höhlen / Bergrettung
85|SUCH|Such- / Lawinenteam
86|NA BWHÖ|Notarzt Berg- / Höhlenrettung
87|CRHR|Canyon- / Höhlenretter
88|FACHB|Fachberater Bergrettung
89|BW sons|Sonstiges Einsatzmittel Bergwacht
90|PKW WR|Zubringer-PKW Wasserrettung
90|KdoW WR|Kommandowagen Wasserrettung
91|GW Taucher|Gerätewagen Taucher
91|GW WR|Gerätewagen Wasserrettung
91|GW Boot|Gerätewagen Boot
92|WRSONS|Sonstiges Einsatzfahrzeug Wasserrettung
94|MTW WR|MTW Wasserrettung|MTW
95|ATV WR|Geländefahrzeug Wasserrettung
95|ATV|Geländefahrzeug
98|Wasserretter-Trp|Wasserrettung-Trupp
98|Rettungsschwimmer|Rettungsschwimmer
98|Wasserretter|Wasserretter
98|Streife|Streife Wasserrettung
99|Boot|Boot
`
export const fahrzeugArten = zeilen.trim().split('\n').map(zeile => {
  const [kennzahl, kurz, name, basis] = zeile.split('|')
  const anlage = `2.${kennzahl[0]}`
  return { id: `${kennzahl}-${kurz}`, kennzahl, kurz, name, basis: basis || kurz.toUpperCase(), gruppe: gruppen[Number(kennzahl[0]) - 1], anlage }
})
// Vorhandene Führungsfunktion aus Anlage 2.0 bleibt ebenfalls auswählbar.
fahrzeugArten.push({ id: '07-ELRD', kennzahl: '07', kurz: 'ELRD', name: 'Einsatzleiter Rettungsdienst (Funktion)', basis: 'ELRD', gruppe: 'Funktionen', anlage: '2.0' })
export const fahrzeugArtZu = id => fahrzeugArten.find(a => a.id === id)
// Ergänzungen der Simulation, keine Teilkennzahlen aus der hochgeladenen Richtlinie.
fahrzeugArten.push(
  { id: 'LUFT-RTH', kennzahl: '', kurz: 'RTH', name: 'Rettungshubschrauber', basis: 'RTH', gruppe: 'Hubschrauber', anlage: null },
  { id: 'LUFT-ITH', kennzahl: '', kurz: 'ITH', name: 'Intensivtransporthubschrauber', basis: 'ITH', gruppe: 'Hubschrauber', anlage: null },
  { id: 'LUFT-HUB', kennzahl: '', kurz: 'HUB', name: 'Sonstiger Hubschrauber', basis: 'HUB', gruppe: 'Hubschrauber', anlage: null },
)
export const simulationsTyp = fahrzeug => fahrzeugArtZu(fahrzeug.fahrzeugArtId)?.basis || fahrzeug.typ
