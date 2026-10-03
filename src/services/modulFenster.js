// Erst das echte HTTP-Dokument abwarten. about:blank ist keine geeignete
// Herkunftsadresse für Kartenanfragen an externe Server.
export function fensterDokumentAbwarten(fenster, url) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const pruefen = () => {
      if (fenster.closed || Date.now() - start > 10000) {
        clearInterval(timer)
        reject(new Error('Modulfenster konnte nicht geladen werden'))
        return
      }
      try {
        if (fenster.location.href === url && fenster.document.readyState === 'complete') {
          clearInterval(timer)
          resolve()
        }
      } catch {
        clearInterval(timer)
        reject(new Error('Modulfenster hat eine unerwartete Herkunft'))
      }
    }
    const timer = setInterval(pruefen, 50)
    pruefen()
  })
}

// Nur Styles übernehmen: Im Zusatzfenster startet keine zweite Simulation.
export function fensterVorbereiten(fenster, titel, quelle = document) {
  const doc = fenster.document
  doc.title = `${titel} – Leitstellensimulator`
  doc.documentElement.lang = 'de'
  const basis = doc.createElement('base')
  basis.href = quelle.baseURI
  doc.head.append(basis)
  const host = doc.createElement('div')
  host.id = 'modul-fenster-host'
  doc.body.replaceChildren(host)
  const layout = doc.createElement('style')
  layout.textContent = 'html,body{margin:0!important;width:100%;height:100%;min-width:0!important;overflow:hidden;background:#d7dce0;color:#111}#modul-fenster-host{position:fixed;inset:0;display:flex;flex-direction:column;min-height:0}'
  const kopien = []
  function stylesKopieren() {
    for (const kopie of kopien) kopie.remove()
    kopien.length = 0
    for (const original of quelle.querySelectorAll('style,link[rel="stylesheet"]')) {
      const kopie = original.cloneNode(true)
      if (original.tagName === 'LINK') kopie.href = original.href
      doc.head.append(kopie)
      kopien.push(kopie)
    }
    doc.head.append(layout)
  }
  stylesKopieren()
  const beobachter = new MutationObserver(() => { if (!fenster.closed) stylesKopieren() })
  beobachter.observe(quelle.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'media'] })
  return { host, beenden: () => beobachter.disconnect() }
}

export function tabHerausgezogen(start, ende, leiste) {
  if (!start || !leiste) return false
  const strecke = Math.hypot(ende.clientX - start.clientX, ende.clientY - start.clientY)
  return strecke >= 45 && (ende.clientY > leiste.bottom + 24 || ende.clientY < leiste.top - 24 ||
    ende.clientX < leiste.left - 24 || ende.clientX > leiste.right + 24)
}
