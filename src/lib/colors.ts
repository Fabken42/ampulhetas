export type PaletteColor = {
  key: string
  name: string
  hex: string // tom base, usado em SVG/canvas (favicon)
  hexLight: string // variação para tema claro
}

// 8 cores pensadas para funcionar no tema escuro e no claro.
export const PALETTE: PaletteColor[] = [
  { key: 'amber', name: 'Âmbar', hex: '#f59e0b', hexLight: '#d97706' },
  { key: 'coral', name: 'Coral', hex: '#fb7185', hexLight: '#e11d48' },
  { key: 'rose', name: 'Rosa', hex: '#f472b6', hexLight: '#db2777' },
  { key: 'violet', name: 'Violeta', hex: '#a78bfa', hexLight: '#7c3aed' },
  { key: 'blue', name: 'Azul', hex: '#60a5fa', hexLight: '#2563eb' },
  { key: 'cyan', name: 'Ciano', hex: '#22d3ee', hexLight: '#0891b2' },
  { key: 'green', name: 'Verde', hex: '#34d399', hexLight: '#059669' },
  { key: 'lime', name: 'Lima', hex: '#a3e635', hexLight: '#65a30d' },
]

const BY_KEY = new Map(PALETTE.map((c) => [c.key, c]))

export function getColor(key: string): PaletteColor {
  return BY_KEY.get(key) ?? PALETTE[0]
}

/** Resolve o hex de uma cor conforme o tema atual (claro/escuro). */
export function colorHex(key: string, light = false): string {
  const c = getColor(key)
  return light ? c.hexLight : c.hex
}

/** Próxima cor da paleta a ser atribuída, evitando repetição quando possível. */
export function nextColor(usedKeys: string[]): string {
  const free = PALETTE.find((c) => !usedKeys.includes(c.key))
  if (free) return free.key
  // todas usadas: cicla pela ordem
  return PALETTE[usedKeys.length % PALETTE.length].key
}
