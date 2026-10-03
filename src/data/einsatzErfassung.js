export function leereEinsatzErfassung() {
  return {
    eroeffnetAm: new Date().toISOString(),
    objekt: '', station: '', strasse: '', hausnummer: '', ort: '', ortsteil: '',
    anrufer: '', rueckrufnummer: '', meldung: '', stichwort: '', meldebildId: null,
    schlagwort: '', stichwoerter: {}, rdVerknuepfung: null,
    sondersignal: false, prioritaet: '0', notiz: '', position: null, gebietId: null,
  }
}

export function einsatzAdresse(daten) {
  return [
    [daten.strasse, daten.hausnummer].filter(Boolean).join(' '),
    daten.ortsteil,
    daten.ort,
  ].filter(Boolean).join(', ')
}
