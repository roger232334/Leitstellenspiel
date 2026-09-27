export const aaoRegeln = {
  // Testregel Zimmerbrand / B 3
  'B-11-23': [
    {
      typ: 'HLF',
      anzahl: 1,
    },
  ],

  // Testregel Bewusstlose Person / RD 2
  'RD-10-10': [
    {
      typ: 'RTW',
      anzahl: 1,
    },
    {
      typ: 'NEF',
      anzahl: 1,
    },
  ],
}


export function findeAaoRegel(
  stichwort,
) {
  if (!stichwort?.id) {
    return []
  }

  return (
    aaoRegeln[
      stichwort.id
    ] ?? []
  )
}