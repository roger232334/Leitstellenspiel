import { haupteinsatzZu, untereinsaetzeZu } from './einsatzHierarchie.js'
import { fahrzeugHatFaehigkeit } from './ausruestung/beladung.js'
import { simulationsTyp } from './fahrzeugArten.js'

export const einsatzPhasen = { alarmiert: 'Alarmiert', anfahrt: 'Anfahrt', eingetroffen: 'Eingetroffen', erkundung: 'Erkundung', massnahmen: 'Maßnahmen', abschluss: 'Abschluss', beendet: 'Beendet' }
export const zeitStandards = { basisMinuten: 30, schwankungMinuten: 0, ausrueckenSekunden: 60, anfahrtSekunden: 300 }
export const phasenAnteile = { erkundung: 0.1, massnahmen: 0.75, abschluss: 0.15 }

export function zeitplanungErstellen(dauer = zeitStandards, zufall = Math.random) {
  const { basisMinuten, schwankungMinuten = 0 } = dauer
  const anteile = dauer.phasenAnteile ?? phasenAnteile
  if (!Number.isFinite(basisMinuten) || !Number.isFinite(schwankungMinuten) || schwankungMinuten < 0 || basisMinuten <= schwankungMinuten) throw new Error('Ungültige Einsatzdauer.')
  if (Object.keys(anteile).length !== 3 || Object.keys(phasenAnteile).some(p => !Number.isFinite(anteile[p]) || anteile[p] <= 0) || Math.abs(Object.values(anteile).reduce((a, b) => a + b, 0) - 1) > 0.000001) throw new Error('Ungültige Phasenanteile.')
  const wert = schwankungMinuten ? zufall() : 0.5
  if (!Number.isFinite(wert) || wert < 0 || wert >= 1) throw new Error('Ungültiger Zufallswert für die Einsatzdauer.')
  const dauerSekunden = Math.max(3, Math.round((basisMinuten + (wert * 2 - 1) * schwankungMinuten) * 60))
  const erkundung = Math.max(1, Math.min(dauerSekunden - 2, Math.floor(dauerSekunden * anteile.erkundung)))
  const massnahmen = Math.max(1, Math.min(dauerSekunden - erkundung - 1, Math.floor(dauerSekunden * anteile.massnahmen)))
  return { dauerSekunden, phasenSekunden: { erkundung, massnahmen, abschluss: dauerSekunden - erkundung - massnahmen } }
}

export const lebenszyklusTraeger = (einsaetze, einsatz) => haupteinsatzZu(einsaetze, einsatz) || einsatz
function familie(einsaetze, einsatz) { return [einsatz, ...untereinsaetzeZu(einsaetze, einsatz)] }
function statusSetzen(f, status, zeit) {
  f.status = status
  f.statusZeiten ??= {}
  f.statusZeiten[status] = new Date(zeit).toLocaleTimeString('de-DE')
}
function ereignis(e, typ, zeit, hook) {
  const event = { typ, einsatzId: e.id, zeit }
  e.lebenszyklus.ereignisse.push(event)
  hook?.(event)
}
function phase(e, id, zeit, hook) {
  e.lebenszyklus.phase = id
  e.lebenszyklus.phaseSeit = zeit
  ereignis(e, { alarmiert: 'einsatzAlarmiert', anfahrt: 'anfahrtGestartet', eingetroffen: 'erstesFahrzeugEingetroffen', erkundung: 'erkundungGestartet', massnahmen: 'massnahmenGestartet', abschluss: 'einsatzAbschluss', beendet: 'einsatzBeendet' }[id], zeit, hook)
}

export function einsatzAlarmiert(einsaetze, einsatz, zeit, hook) {
  const e = lebenszyklusTraeger(einsaetze, einsatz)
  if (!e || e.status === 'abgeschlossen' || e.lebenszyklus) return
  e.zeitplanung ??= zeitplanungErstellen(e.dauer)
  e.lebenszyklus = { phase: 'alarmiert', alarmiertAm: zeit, phaseSeit: zeit, arbeitsbeginn: null, beendetAm: null, ereignisse: [] }
  e.status = 'alarmiert'
  phase(e, 'alarmiert', zeit, hook)
}

export function fahrzeugAlarmieren(f, einsatzId, zeit) {
  f.einsatzId = einsatzId
  statusSetzen(f, 3, zeit)
  f.fahrt = { alarmiertAm: zeit, abfahrtAm: zeit + zeitStandards.ausrueckenSekunden * 1000, dauerSekunden: zeitStandards.anfahrtSekunden, eingetroffenAm: null }
  f.route = []; f.routeSchritt = 0; f.routeSchritte = 0
  f.naechsterStatusIn = zeitStandards.ausrueckenSekunden + zeitStandards.anfahrtSekunden
}

// Späte Netzantworten dürfen ein angekommenes/freigegebenes Fahrzeug nicht zurücksetzen.
export function fahrzeugRouteUebernehmen(f, fahrt, route) {
  if (f.fahrt !== fahrt || f.einsatzId == null || f.status !== 3 || fahrt.eingetroffenAm != null) return false
  if (!Number.isFinite(route.dauerSekunden) || route.dauerSekunden <= 0 || !route.punkte?.length) return false
  f.route = route.punkte
  fahrt.dauerSekunden = route.dauerSekunden
  return true
}

export function fahrzeugeFortschreiben(fahrzeuge, jetzt) {
  for (const f of fahrzeuge) {
    if (f.einsatzId == null || f.status !== 3) continue
    if (!f.fahrt) fahrzeugAlarmieren(f, f.einsatzId, jetzt)
    const fahrt = f.fahrt
    const ankunft = fahrt.abfahrtAm + fahrt.dauerSekunden * 1000
    const fortschritt = Math.min(1, Math.max(0, (jetzt - fahrt.abfahrtAm) / (fahrt.dauerSekunden * 1000)))
    f.naechsterStatusIn = Math.max(0, Math.ceil((ankunft - jetzt) / 1000))
    f.routeSchritte = fahrt.dauerSekunden
    f.routeSchritt = fortschritt * fahrt.dauerSekunden
    if (f.route?.length) f.position = { ...f.route[Math.min(f.route.length - 1, Math.floor(fortschritt * (f.route.length - 1)))] }
    if (jetzt >= ankunft) {
      fahrt.eingetroffenAm = ankunft
      statusSetzen(f, 4, ankunft)
      f.route = []
    }
  }
}

export function fahrzeugFreigeben(f, zeit) {
  statusSetzen(f, ['RTW', 'NEF', 'KTW'].includes(simulationsTyp(f)) ? 1 : 2, zeit)
  f.einsatzId = null; f.fahrt = null; f.naechsterStatusIn = 0
  f.route = []; f.routeSchritt = 0; f.routeSchritte = 0
}

export function lebenszyklenFortschreiben(einsaetze, fahrzeuge, jetzt, hook) {
  for (const e of einsaetze) {
    if (lebenszyklusTraeger(einsaetze, e) !== e || e.status === 'abgeschlossen') continue
    const gruppe = familie(einsaetze, e), ids = new Set(gruppe.map(e => e.id))
    const gebunden = fahrzeuge.filter(f => ids.has(f.einsatzId))
    if (!e.lebenszyklus && gebunden.length) einsatzAlarmiert(einsaetze, e, jetzt, hook)
    const l = e.lebenszyklus
    if (!l || l.phase === 'beendet') continue
    if (l.phase === 'alarmiert' && gebunden.some(f => f.status === 4 || (f.fahrt && jetzt >= f.fahrt.abfahrtAm))) {
      phase(e, 'anfahrt', Math.min(jetzt, ...gebunden.map(f => f.fahrt?.abfahrtAm ?? jetzt)), hook)
    }
    // Standard: jedes tatsächlich zugeordnete Fahrzeug kann erkunden.
    // Optional lässt sich eine vorhandene Fähigkeit verlangen, ohne Fahrzeugtyp-Sonderfall.
    const angekommen = gebunden.filter(f => f.status === 4 && (!e.erkundungsFaehigkeit || fahrzeugHatFaehigkeit(f, e.erkundungsFaehigkeit)))
    if (l.arbeitsbeginn == null && angekommen.length) {
      const zeit = Math.max(l.alarmiertAm, Math.min(...angekommen.map(f => f.fahrt?.eingetroffenAm ?? jetzt)))
      l.arbeitsbeginn = zeit
      phase(e, 'eingetroffen', zeit, hook)
      phase(e, 'erkundung', zeit, hook)
    }
    if (l.arbeitsbeginn == null) continue
    const p = e.zeitplanung.phasenSekunden
    const erkundet = l.arbeitsbeginn + p.erkundung * 1000
    const abschluss = erkundet + p.massnahmen * 1000
    const ende = abschluss + p.abschluss * 1000
    if (l.phase === 'erkundung' && jetzt >= erkundet) {
      for (const teil of gruppe) if (teil.szenario) {
        teil.szenario.erkundet = true
        if (!teil.szenario.lageDurchFunk) teil.szenario.lageBekannt = true
      }
      ereignis(e, 'erkundungAbgeschlossen', erkundet, hook)
      phase(e, 'massnahmen', erkundet, hook)
    }
    // Ansatzpunkt für späteres Pausieren bei Fehlbedarf; derzeit rein zeitgesteuert.
    if (l.phase === 'massnahmen' && jetzt >= abschluss) phase(e, 'abschluss', abschluss, hook)
    if (l.phase === 'abschluss' && jetzt >= ende) {
      l.beendetAm = ende
      for (const f of gebunden) fahrzeugFreigeben(f, ende)
      for (const teil of gruppe) { teil.status = 'abgeschlossen'; teil.fahrzeuge = [] }
      phase(e, 'beendet', ende, hook)
    }
  }
}
