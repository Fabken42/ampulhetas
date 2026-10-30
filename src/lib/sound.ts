// Beep curto gerado com a Web Audio API — sem arquivo de áudio.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

/** Alguns navegadores exigem retomar o contexto após um gesto do usuário. */
export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume()
}

/** Toca um beep duplo curto, respeitando o volume (0 a 1). */
export function playBeep(volume = 0.5) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()

  const vol = Math.max(0, Math.min(1, volume))
  if (vol === 0) return

  const now = c.currentTime
  const notes = [
    { freq: 880, start: 0, dur: 0.14 },
    { freq: 1175, start: 0.16, dur: 0.2 },
  ]

  for (const note of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = note.freq
    const t0 = now + note.start
    const t1 = t0 + note.dur
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(vol * 0.4, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t1)
    osc.connect(gain).connect(c.destination)
    osc.start(t0)
    osc.stop(t1 + 0.02)
  }
}
