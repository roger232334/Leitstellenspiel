import test from 'node:test'
import assert from 'node:assert/strict'
import { testGebiet, installTestGebiet } from './gebietTestdaten.mjs'
import { gebietImportVorbereiten, gebietPruefen, gebietsPruefung, gebietSpeichern, gebietLaden, waehleZufaelligeOrtschaft, zufaelligeGebietsAdresse, punktInGeometrie, objektAutomatischZulaessig } from '../src/data/gebiet.js'
import { notrufImGebiet } from '../src/data/notruf/gebietsNotruf.js'
import { notrufSzenarien } from '../src/data/notrufSzenarien.js'
import { adressVorschlaege as suchen } from '../src/services/adressVorschlaege.js'
const adressVorschlaege = (text, feld) => suchen(text, feld, '', undefined, { onlineFallback: true })

test('Gebietsprüfung bevorzugt Grenzen, lehnt fremde Orte ab; Faktor 0 ist keine Deaktivierung', () => {
  const g = gebietPruefen(testGebiet())
  assert.equal(gebietsPruefung({ position: {lat:49,lng:12} }, g).erlaubt, true)
  assert.equal(gebietsPruefung({ gebietId: 'test-ort', position: {lat:999,lng:12} }, g).erlaubt, false)
  for (const position of [{lat:48.14,lng:11.58},{lat:49.45,lng:11.08},{lat:52.52,lng:13.4}]) assert.equal(gebietsPruefung({ position, ort:'Regensburg' },g).erlaubt,false)
  g.ortschaften[0].einsatzaufkommenFaktor = 0
  assert.equal(gebietsPruefung({position:{lat:49,lng:12}},g).erlaubt,true)
  assert.equal(zufaelligeGebietsAdresse(g), null)
  g.ortschaften[0].aktiv=false
  assert.equal(gebietsPruefung({position:{lat:49,lng:12}},g).erlaubt,false)
  assert.equal(gebietsPruefung({ort:'Regensburg'},{version:1,ortschaften:[],adressen:[]}).erlaubt,false)
})
test('Ohne Grenzen nur eindeutige Verwaltungshierarchie, kein bloßer Ortsname', () => {
  const g=testGebiet();g.ortschaften[0].geometry=null
  const input={land:'de',bundesland:'Bayern',kreis:'Stadt Regensburg',gemeinde:'Regensburg',ortsteil:'Nord'}
  assert.equal(gebietsPruefung(input,g).erlaubt,true)
  assert.equal(gebietsPruefung({...input,kreis:'Berlin'},g).erlaubt,false)
  assert.equal(gebietsPruefung({ort:'Regensburg'},g).erlaubt,false)
})
test('Polygonlöcher und MultiPolygon werden berücksichtigt',()=>{
  const geometry=testGebiet().ortschaften[0].geometry
  geometry.coordinates.push([[11.99,48.99],[12.01,48.99],[12.01,49.01],[11.99,49.01],[11.99,48.99]])
  assert.equal(punktInGeometrie({lat:49,lng:12},geometry),false)
  assert.equal(punktInGeometrie({lat:49,lng:12.1},{type:'MultiPolygon',coordinates:[geometry.coordinates]}),true)
})
test('Gewichtete Auswahl und Notruf verwenden ausschließlich aktive Orte mit Adressen',()=>{
  const g=testGebiet(), zweiter={...g.ortschaften[0],id:'zweiter',einsatzaufkommenFaktor:2}
  g.ortschaften.push(zweiter)
  assert.equal(waehleZufaelligeOrtschaft(g,()=>0).id,'test-ort')
  assert.equal(waehleZufaelligeOrtschaft(g,()=>0.5).id,'zweiter')
  assert.equal(zufaelligeGebietsAdresse(g,()=>0.9).gebietId,'test-ort','Ort ohne Adresse wird nicht ausgewählt')
  const s=notrufImGebiet(notrufSzenarien,g,()=>0)
  assert.equal(s.daten.strasse,'Teststraße');assert.equal(s.gebietId,'test-ort')
  assert.deepEqual(s.position,{lat:49,lng:12})
  assert.match(s.antworten.find(a=>a.schluesselwoerter.includes('adresse')).antwort,/Teststraße/)
  assert.notEqual(notrufSzenarien[0].daten.strasse,'Teststraße')
  g.ortschaften[0].aktiv=false
  assert.equal(notrufImGebiet(notrufSzenarien,g),null)
})
test('POIs verwenden dieselbe Prüfung; Faktor 0 bleibt von Gebietszugehörigkeit getrennt',()=>{
  const g=testGebiet(),o={aktiv:true,position:{lat:49,lng:12}}
  assert.equal(objektAutomatischZulaessig(o,g),true)
  g.ortschaften[0].einsatzaufkommenFaktor=0
  assert.equal(objektAutomatischZulaessig(o,g),false)
})
test('Persistenz validiert IDs, Faktoren und Adressreferenzen',()=>{
  const restore=installTestGebiet()
  try {
    const g=gebietLaden();g.ortschaften[0].aktiv=false;gebietSpeichern(g)
    assert.equal(gebietLaden().ortschaften[0].aktiv,false)
    assert.throws(()=>gebietPruefen({...g,ortschaften:[g.ortschaften[0],g.ortschaften[0]]}))
    for(const faktor of [-1,NaN,Infinity,'1']) { const d=testGebiet();d.ortschaften[0].einsatzaufkommenFaktor=faktor;assert.throws(()=>gebietPruefen(d)) }
    const d=testGebiet();d.adressen[0].gebietId='falsch';assert.throws(()=>gebietPruefen(d))
  } finally {restore()}
})
test('Späterer Adressimport löst Bestandsreferenzen auf und erhält Ortsfaktoren',()=>{
  const g=testGebiet();g.ortschaften[0].einsatzaufkommenFaktor=0.5;g.ortschaften[0].aktiv=false
  const result=gebietImportVorbereiten({version:1,ortschaften:[],adressen:[{...g.adressen[0],id:'zweite-adresse'}]},g)
  assert.equal(result.adressen.length,2)
  assert.equal(result.ortschaften[0].einsatzaufkommenFaktor,0.5)
  assert.equal(result.ortschaften[0].aktiv,false)
  assert.throws(()=>gebietImportVorbereiten({version:1,ortschaften:[],adressen:[g.adressen[0],g.adressen[0]]},g))
})
test('Suchcache wird nach Deaktivierung erneut gefiltert; fremde Treffer werden nie angeboten',async()=>{
  const restore=installTestGebiet(),fetchAlt=globalThis.fetch
  let anfragen=0
  globalThis.fetch=async()=>{anfragen++;return {ok:true,json:async()=>({features:[
    {geometry:{coordinates:[12,49]},properties:{osm_id:1,type:'street',name:'GebietTest'}},
    {geometry:{coordinates:[13.4,52.52]},properties:{osm_id:2,type:'street',name:'BerlinTest'}},
  ]})}}
  try {
    assert.equal((await adressVorschlaege('GebietTest','strasse')).length,1)
    const g=gebietLaden();g.ortschaften[0].aktiv=false;gebietSpeichern(g)
    assert.deepEqual(await adressVorschlaege('GebietTest','strasse'),[])
    assert.equal(anfragen,1)
  }finally{globalThis.fetch=fetchAlt;restore()}
})
