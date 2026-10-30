// Favicon dinâmico desenhado num <canvas> 64×64.
// Atualiza no máximo quando o desenho muda (chave de estado).

type FaviconState =
  | { kind: 'none' }
  | { kind: 'paused' }
  | { kind: 'active'; color: string; fraction: number }

let lastKey = ''
let canvas: HTMLCanvasElement | null = null
const DEFAULT_HREF = '/favicon.svg'

function getLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  return link
}

function getCanvas(): HTMLCanvasElement {
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
  }
  return canvas
}

function keyOf(state: FaviconState): string {
  if (state.kind === 'active') {
    // arredonda a fração para ~1% para evitar redesenhos imperceptíveis
    return `active:${state.color}:${Math.round(state.fraction * 100)}`
  }
  return state.kind
}

export function updateFavicon(state: FaviconState) {
  const key = keyOf(state)
  if (key === lastKey) return
  lastKey = key

  const link = getLink()

  if (state.kind === 'none') {
    link.type = 'image/svg+xml'
    link.href = DEFAULT_HREF
    return
  }

  const c = getCanvas()
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 64, 64)

  // fundo
  ctx.fillStyle = '#0c0a09'
  roundRect(ctx, 0, 0, 64, 64, 14)
  ctx.fill()

  const cx = 32
  const cy = 32
  const r = 22
  const lw = 7

  // trilho
  ctx.lineWidth = lw
  ctx.strokeStyle = '#44403c'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  if (state.kind === 'paused') {
    // duas barras de pausa
    ctx.fillStyle = '#a8a29e'
    ctx.fillRect(25, 22, 6, 20)
    ctx.fillRect(34, 22, 6, 20)
    link.type = 'image/png'
    link.href = c.toDataURL('image/png')
    return
  }

  // arco de progresso (restante)
  const start = -Math.PI / 2
  const end = start + Math.PI * 2 * Math.max(0, Math.min(1, state.fraction))
  ctx.lineCap = 'round'
  ctx.strokeStyle = state.color
  ctx.beginPath()
  ctx.arc(cx, cy, r, start, end)
  ctx.stroke()

  link.type = 'image/png'
  link.href = c.toDataURL('image/png')
}

export function resetFavicon() {
  lastKey = ''
  updateFavicon({ kind: 'none' })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
