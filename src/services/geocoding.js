const CACHE_KEY =
  'leitstellensimulator-geocoding-v1'

let letzteAnfrage = 0

function warten(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function cacheLaden() {
  try {
    const daten =
      localStorage.getItem(CACHE_KEY)

    return daten
      ? JSON.parse(daten)
      : {}
  } catch {
    return {}
  }
}

function cacheSpeichern(cache) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(cache),
    )
  } catch {
    // Cache ist hilfreich, aber für die
    // Simulation nicht zwingend notwendig.
  }
}

const cache = cacheLaden()

async function rateLimitEinhalten() {
  const jetzt = Date.now()

  const seitLetzterAnfrage =
    jetzt - letzteAnfrage

  if (seitLetzterAnfrage < 1100) {
    await warten(
      1100 - seitLetzterAnfrage,
    )
  }

  letzteAnfrage = Date.now()
}

export async function adresseGeocodieren(
  adresse,
) {
  const suchtext = adresse.trim()

  if (!suchtext) {
    return null
  }

  const cacheKey =
    suchtext.toLowerCase()

  if (cache[cacheKey]) {
    return cache[cacheKey]
  }

  await rateLimitEinhalten()

  const parameter =
    new URLSearchParams({
      q: suchtext,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'de',
      'accept-language': 'de',
    })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${parameter.toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },

      referrerPolicy:
        'strict-origin-when-cross-origin',
    },
  )

  if (!response.ok) {
    throw new Error(
      `Geocoding fehlgeschlagen: HTTP ${response.status}`,
    )
  }

  const daten = await response.json()

  if (!daten.length) {
    return null
  }

  const treffer = daten[0]

  const ergebnis = {
    lat: Number(treffer.lat),
    lng: Number(treffer.lon),
    displayName:
      treffer.display_name,
  }

  cache[cacheKey] = ergebnis
  cacheSpeichern(cache)

  return ergebnis
}