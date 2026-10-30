import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './useAppStore'
import { getRemainingMs, getTotalRemainingMs, HOUR, MINUTE } from '@/lib/time'

let nowValue = 0
function setNow(ms: number) {
  nowValue = ms
}

beforeEach(() => {
  setNow(1_000_000)
  vi.spyOn(Date, 'now').mockImplementation(() => nowValue)
  useAppStore.getState().resetSession()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function ids() {
  return useAppStore.getState().session.activities.map((a) => a.id)
}

describe('fluxo de sessão', () => {
  it('cenário completo: ativar, trocar, pausar, retomar, zerar', () => {
    const store = useAppStore.getState()
    store.setAvailable(4 * HOUR)
    store.addActivity('Leitura', 30 * MINUTE)
    store.addActivity('Videogame', 90 * MINUTE)
    store.addActivity('Trabalho', 2 * HOUR)
    store.startSession()

    const [leitura, videogame] = ids()

    // ativa leitura
    useAppStore.getState().activate(leitura)
    expect(useAppStore.getState().session.activeId).toBe(leitura)
    expect(useAppStore.getState().session.startedAt).toBe(nowValue)

    // 20 min depois, troca para videogame
    setNow(nowValue + 20 * MINUTE)
    useAppStore.getState().activate(videogame)
    const s1 = useAppStore.getState().session
    expect(s1.activeId).toBe(videogame)
    // leitura consolidou 20min -> restam 10min
    const leituraAct = s1.activities.find((a) => a.id === leitura)!
    expect(leituraAct.usedMs).toBe(20 * MINUTE)
    expect(getRemainingMs(leituraAct, s1, nowValue)).toBe(10 * MINUTE)

    // 10 min de videogame, depois pausa tudo
    setNow(nowValue + 10 * MINUTE)
    useAppStore.getState().pauseAll()
    const s2 = useAppStore.getState().session
    expect(s2.activeId).toBeNull()
    expect(s2.activities.find((a) => a.id === videogame)!.usedMs).toBe(10 * MINUTE)

    // 30 min de pausa não consomem tempo das atividades
    const remainingBeforePause = getTotalRemainingMs(s2, nowValue)
    setNow(nowValue + 30 * MINUTE)
    const remainingAfterPause = getTotalRemainingMs(useAppStore.getState().session, nowValue)
    expect(remainingAfterPause).toBe(remainingBeforePause)

    // retoma: volta para videogame (lastActiveId)
    useAppStore.getState().resume()
    expect(useAppStore.getState().session.activeId).toBe(videogame)
    // pausa consolidada ~30min
    expect(useAppStore.getState().session.pausedMs).toBe(30 * MINUTE)

    // deixa o videogame zerar (restavam 80min)
    setNow(nowValue + 90 * MINUTE)
    const events = useAppStore.getState().tick(nowValue)
    expect(events).toEqual([
      { type: 'activity-finished', activityId: videogame, at: expect.any(Number) },
    ])
    const s3 = useAppStore.getState().session
    expect(s3.activeId).toBeNull()
    expect(s3.activities.find((a) => a.id === videogame)!.usedMs).toBe(90 * MINUTE)
  })

  it('não permite ativar atividade zerada', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('A', 10 * MINUTE)
    store.startSession()
    const [a] = ids()
    useAppStore.getState().activate(a)
    setNow(nowValue + 10 * MINUTE)
    useAppStore.getState().tick(nowValue) // zera
    expect(useAppStore.getState().session.activeId).toBeNull()
    // tenta reativar
    useAppStore.getState().activate(a)
    expect(useAppStore.getState().session.activeId).toBeNull()
  })

  it('desfazer troca restaura o estado anterior (activeSince original)', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('A', 30 * MINUTE)
    store.addActivity('B', 30 * MINUTE)
    store.startSession()
    const [a, b] = ids()
    useAppStore.getState().activate(a)
    const activeSinceA = useAppStore.getState().session.activeSince
    setNow(nowValue + 5 * MINUTE)
    useAppStore.getState().activate(b) // troca acidental
    expect(useAppStore.getState().session.activeId).toBe(b)
    useAppStore.getState().undoLastSwitch()
    const s = useAppStore.getState().session
    expect(s.activeId).toBe(a)
    expect(s.activeSince).toBe(activeSinceA)
    // tempo decorrido desde a troca volta a contar para A
    expect(getRemainingMs(s.activities.find((x) => x.id === a)!, s, nowValue)).toBe(25 * MINUTE)
  })

  it('allocação excedente é permitida (apenas aviso)', () => {
    const store = useAppStore.getState()
    store.setAvailable(4 * HOUR)
    store.addActivity('A', 4 * HOUR + 15 * MINUTE)
    store.startSession()
    expect(useAppStore.getState().screen).toBe('session')
  })

  it('mini-timer de bloco pausa a atividade deixando tempo restante', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('Leitura', 30 * MINUTE)
    store.startSession()
    const [leitura] = ids()
    useAppStore.getState().activate(leitura, 20 * MINUTE) // bloco de 20min
    setNow(nowValue + 25 * MINUTE)
    const events = useAppStore.getState().tick(nowValue)
    expect(events[0]).toMatchObject({ type: 'block-finished', activityId: leitura })
    const s = useAppStore.getState().session
    expect(s.activeId).toBeNull()
    const a = s.activities.find((x) => x.id === leitura)!
    expect(a.usedMs).toBe(20 * MINUTE) // sobram 10min
    expect(getRemainingMs(a, s, nowValue)).toBe(10 * MINUTE)
  })

  it('bloco é limitado ao restante da atividade', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('A', 10 * MINUTE)
    store.startSession()
    const [a] = ids()
    useAppStore.getState().activate(a, 30 * MINUTE) // pede 30, só há 10
    const s = useAppStore.getState().session
    expect(s.blockEndsAt).toBe(nowValue + 10 * MINUTE)
  })

  it('transferir tempo limita ao restante da origem', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('A', 20 * MINUTE)
    store.addActivity('B', 10 * MINUTE)
    store.startSession()
    const [a, b] = ids()
    useAppStore.getState().transferTime(a, b, 999 * MINUTE)
    const s = useAppStore.getState().session
    expect(s.activities.find((x) => x.id === a)!.plannedMs).toBe(0)
    expect(s.activities.find((x) => x.id === b)!.plannedMs).toBe(30 * MINUTE)
  })

  it('concluir atividade ativa consolida e zera o restante', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('A', 30 * MINUTE)
    store.addActivity('B', 30 * MINUTE)
    store.startSession()
    const [a] = ids()
    useAppStore.getState().activate(a)
    setNow(nowValue + 10 * MINUTE)
    useAppStore.getState().completeActivity(a)
    const s = useAppStore.getState().session
    expect(s.activeId).toBeNull()
    const aAct = s.activities.find((x) => x.id === a)!
    expect(aAct.usedMs).toBe(30 * MINUTE) // marcada como se todo o tempo tivesse passado
    expect(getRemainingMs(aAct, s, nowValue)).toBe(0)
  })

  it('concluir atividade inativa a marca como concluída', () => {
    const store = useAppStore.getState()
    store.setAvailable(HOUR)
    store.addActivity('A', 20 * MINUTE)
    store.startSession()
    const [a] = ids()
    useAppStore.getState().completeActivity(a)
    const aAct = useAppStore.getState().session.activities.find((x) => x.id === a)!
    expect(aAct.usedMs).toBe(20 * MINUTE)
  })

  it('distribuir sobra proporcionalmente', () => {
    const store = useAppStore.getState()
    store.setAvailable(120 * MINUTE)
    store.addActivity('A', 30 * MINUTE)
    store.addActivity('B', 30 * MINUTE)
    useAppStore.getState().distributeUnallocated('proportional')
    const s = useAppStore.getState().session
    // 60min de sobra divididos igualmente -> 60min cada
    expect(s.activities.find((x) => x.name === 'A')!.plannedMs).toBe(60 * MINUTE)
    expect(s.activities.find((x) => x.name === 'B')!.plannedMs).toBe(60 * MINUTE)
  })
})
