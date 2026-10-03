export const simulationsGeschwindigkeiten = [1, 2, 5, 10, 20]
export const SIMULATIONS_TAKT_MS = 250

// Monotone Echtzeit integrieren: Geschwindigkeitswechsel springen nicht zurück/vor.
export function simulationsUhr(start, echtzeit) {
  let zeit = start, zuletzt = echtzeit, faktor = 1
  return {
    tick(jetzt) {
      const delta = Math.max(0, jetzt - zuletzt) * faktor
      zuletzt = Math.max(zuletzt, jetzt)
      zeit += delta
      return { zeit, deltaSekunden: delta / 1000 }
    },
    geschwindigkeit(wert, jetzt) {
      if (!simulationsGeschwindigkeiten.includes(wert)) throw new Error('Ungültige Simulationsgeschwindigkeit.')
      const stand = this.tick(jetzt)
      faktor = wert
      return stand
    },
  }
}
