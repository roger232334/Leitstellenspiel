export async function routeBerechnen(start, ziel) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.lng},${start.lat};${ziel.lng},${ziel.lat}` +
    `?overview=full&geometries=geojson&steps=false`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Routing konnte nicht geladen werden.')
  }

  const daten = await response.json()

  const route = daten.routes?.[0]

  if (!route) {
    throw new Error('Keine Route gefunden.')
  }

  const punkte = route.geometry.coordinates.map(
    ([lng, lat]) => ({
      lat,
      lng,
    }),
  )

  return {
    punkte,
    distanzMeter: route.distance,
    dauerSekunden: route.duration,
  }
}