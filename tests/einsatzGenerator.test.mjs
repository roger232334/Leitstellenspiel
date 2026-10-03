import test from 'node:test'
import assert from 'node:assert/strict'
import { generiereEinsatz, gewichteteAuswahl } from '../src/data/einsaetze/einsatzGenerator.js'
import { einsatzKatalog } from '../src/data/einsaetze/einsatzKatalog.js'
import { pruefeEinsatzBedarf } from '../src/data/einsatzBedarf.js'
import { stichwortKatalog } from '../src/data/stichwortKatalog.js'
import { katalogStichwoerter } from '../src/data/einsatzStichwoerter.js'

const folge = (...werte) => () => {
  assert.ok(werte.length, 'Generator verbraucht nur die erwarteten Zufallswerte')
  return werte.shift()
}

test('Gewichtete Auswahl berücksichtigt Grenzen, Nullgewichte und ungültige Daten', () => {
  const daten = [{ id: 'nie', gewicht: 0 }, { id: 'a', gewicht: 20 }, { id: 'b', gewicht: 80 }]
  assert.equal(gewichteteAuswahl(daten, () => 0).id, 'a')
  assert.equal(gewichteteAuswahl(daten, () => 0.19999).id, 'a')
  assert.equal(gewichteteAuswahl(daten, () => 0.2).id, 'b')
  assert.equal(gewichteteAuswahl(daten, () => 0.99999).id, 'b')
  for (const falsch of [[], [{ gewicht: 0 }], [{ gewicht: -1 }], [{ gewicht: Infinity }]]) assert.throws(() => gewichteteAuswahl(falsch))
  for (const wert of [-1, 1, NaN]) assert.throws(() => gewichteteAuswahl(daten, () => wert))
})

test('Alle fünf Lagen erreichbar; Meldebild/AAO bleibt bei identischer Meldung unabhängig von realer Lage', () => {
  const meldebild = stichwortKatalog.find(e => e.id === 'B-11-23')
  for (const [index, wert] of [0, 0.2, 0.6, 0.85, 0.95].entries()) {
    const e = generiereEinsatz('zimmerbrand', { zufall: folge(wert, 0, 0.99, 0.99, 0.5) })
    assert.equal(e.szenario.lageVarianteId, einsatzKatalog.lageVarianten[index].id)
    assert.equal(e.meldebildId, 'B-11-23')
    assert.deepEqual(e.stichwoerter, katalogStichwoerter(meldebild).stichwoerter)
    assert.equal(e.szenario.notrufVarianteId, 'nachbar-rauch')
  }
})

test('Notrufrestriktionen verhindern sichtbare Flammen beim angebrannten Essen', () => {
  const klein = generiereEinsatz('zimmerbrand', { zufall: folge(0, 0.999, 0.99, 0.99, 0.5) })
  const gross = generiereEinsatz('zimmerbrand', { zufall: folge(0.99, 0.999, 0.99, 0.99, 0.5) })
  assert.notEqual(klein.szenario.notrufVarianteId, 'fenster-flammen')
  assert.equal(gross.szenario.notrufVarianteId, 'fenster-flammen')
})

test('Modifikatoren addieren Ressourcen und vereinigen Anforderungen; Katalog und andere Einsätze bleiben unverändert', () => {
  const vorher = JSON.stringify(einsatzKatalog)
  const e = generiereEinsatz('zimmerbrand', { zufall: folge(0.7, 0, 0, 0, 0.5) })
  assert.equal(e.bedarf.ressourcen.wasserLiter, 4800)
  assert.deepEqual(e.bedarf.faehigkeiten, ['beleuchtung'])
  assert.equal(e.szenario.modifikatoren.length, 2)
  const b = generiereEinsatz('zimmerbrand', { zufall: folge(0.7, 0, 0.99, 0.99, 0.5) })
  e.bedarf.ressourcen.wasserLiter = 1
  e.szenario.notruf.bekannteInformationen.push('test')
  e.stichwoerter.B.stichwort = 'test'
  assert.equal(b.bedarf.ressourcen.wasserLiter, 3200)
  assert.equal(JSON.stringify(einsatzKatalog), vorher)
  assert.equal(stichwortKatalog.find(e => e.id === 'B-11-23').stichwort, 'B 3')
  assert.deepEqual(JSON.parse(JSON.stringify(b)), b, 'Szenario bleibt serialisierbar und stabil')
})

test('Bedarf bleibt bis zur Erkundung verborgen, auch im Untereinsatz; Altbestand funktioniert weiter', () => {
  const e = { ...generiereEinsatz('zimmerbrand', { zufall: folge(0.7, 0, 0.99, 0.99, 0.5) }), id: 10 }
  const kind = { id: 11, parentId: 10, typ: 'unter' }, einsaetze = [e, kind]
  assert.equal(pruefeEinsatzBedarf(e, []).definiert, false)
  assert.deepEqual(pruefeEinsatzBedarf(kind, [], { einsaetze }).ressourcen, {})
  e.szenario.lageBekannt = true
  assert.equal(pruefeEinsatzBedarf(kind, [], { einsaetze }).ressourcen.wasserLiter.fehlt, 3200)
  assert.equal(pruefeEinsatzBedarf({ id: 1 }, []).definiert, false)
  assert.equal(pruefeEinsatzBedarf({ id: 1, bedarf: { ressourcen: { wasserLiter: 10 } } }, []).ressourcen.wasserLiter.fehlt, 10)
})

test('Generatorkern ist ohne Feuerwehrtyp auch für medizinische Anforderungen nutzbar', () => {
  const rd = stichwortKatalog.find(e => e.bereich === 'RD')
  const katalog = {
    grundtypen: [{ id: 'medizin' }], einsatzArten: [{ id: 'rd-test', name: 'Medizin-Test', grundtyp: 'medizin', meldebildId: rd.id, lageVarianten: ['stabil'], notrufVarianten: ['patient'] }],
    lageVarianten: [{ id: 'stabil', name: 'Stabil', gewicht: 1, bedarf: { faehigkeiten: ['notfallversorgung'] } }],
    notrufVarianten: [{ id: 'patient', einstieg: 'Mir geht es nicht gut.' }], modifikatoren: [],
  }
  const e = generiereEinsatz('rd-test', { katalog, zufall: () => 0 })
  assert.deepEqual(e.bedarf.faehigkeiten, ['notfallversorgung'])
  assert.equal(e.meldebildId, rd.id)
})

test('Fehlerhafte Referenzen, Bedarfe und Modifikatoren führen zu verständlichen Fehlern', () => {
  assert.throws(() => generiereEinsatz('unbekannt'), /Katalog-ID/)
  const katalog = structuredClone(einsatzKatalog)
  katalog.einsatzArten[0].meldebildId = 'falsch'
  assert.throws(() => generiereEinsatz('zimmerbrand', { katalog }), /Katalog-ID/)
  katalog.einsatzArten[0].meldebildId = 'B-11-23'
  katalog.lageVarianten[0].bedarf = { ressourcen: { falsch: 2 } }
  assert.throws(() => generiereEinsatz('zimmerbrand', { katalog }), /Ressourcenanforderung/)
  katalog.lageVarianten[0].bedarf = {}
  katalog.einsatzArten[0].modifikatoren[0].wahrscheinlichkeit = 2
  assert.throws(() => generiereEinsatz('zimmerbrand', { katalog }), /Modifikatorwahrscheinlichkeit/)
})
