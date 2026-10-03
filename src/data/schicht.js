export const einsatzFrequenzen = [100, 75, 50, 25]

export function schichtStartzeit(datum, zeit) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(zeit)) return NaN
  const start = new Date(`${datum}T${zeit}:00`)
  const [jahr, monat, tag] = datum.split('-').map(Number)
  const [stunde, minute] = zeit.split(':').map(Number)
  return start.getFullYear() === jahr && start.getMonth() === monat - 1 && start.getDate() === tag &&
    start.getHours() === stunde && start.getMinutes() === minute ? start.getTime() : NaN
}

export function notrufWartezeit(frequenz, zufall = Math.random()) {
  if (!einsatzFrequenzen.includes(frequenz)) throw new Error('Ungültige Einsatzfrequenz')
  return (Math.floor(zufall * 41) + 20) * 100 / frequenz
}
