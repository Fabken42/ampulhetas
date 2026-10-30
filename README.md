# Ampulhetas

**Orçamento de tempo com alternância livre entre atividades.**

Você informa quanto tempo tem disponível, cadastra atividades com a duração que
quer dedicar a cada uma, e durante a sessão cada atividade vira uma "ampulheta"
com o próprio cronômetro regressivo. Clique numa atividade para ativá-la: o tempo
dela começa a escorrer e qualquer outra atividade ativa pausa automaticamente.
Só uma atividade corre por vez; você alterna à vontade até gastar os tempos.

Site 100% frontend, sem backend, sem login e **funciona offline** (PWA).

## Conceito e regras

- **Pausar não consome o tempo disponível.** O tempo é um orçamento de atividades,
  não um relógio de parede. O tempo pausado é apenas registrado para estatística.
- **Pode-se alocar mais do que o disponível** — a interface mostra um aviso, mas
  não bloqueia o início.
- **Quando o cronômetro de uma atividade zera, ela para sozinha:** a sessão fica
  pausada, você é notificado e a atividade aparece como concluída. Para continuar,
  adicione tempo a ela (+5 min, editar duração ou transferir de outra atividade).
- O tempo é sempre calculado **a partir de timestamps**, nunca subtraindo a cada
  tick. Por isso, dar F5 ou fechar e reabrir o navegador mantém o tempo correto —
  se uma atividade deveria ter zerado enquanto o site estava fechado, ela para no
  instante exato e o restante conta como pausa.

## Como rodar

Requer Node 18+.

```bash
npm install     # instala dependências
npm run dev     # servidor de desenvolvimento (http://localhost:5173)
npm test        # testes unitários (Vitest)
npm run build   # build de produção + checagem de tipos (sem erros)
npm run preview # pré-visualiza o build de produção
```

## Funcionalidades

- **Configuração**: tempo disponível, atividades (nome, cor, duração), hora limite
  opcional ("Livre até"), indicador de alocação (sobra / tudo alocado / excedente)
  e botão para distribuir a sobra.
- **Sessão**: cards com tempo restante grande, visual de "areia" esvaziando, estado
  ativo evidente; previsão de término ("Termina às 17:06"), tempo total restante,
  tempo pausado acumulado, pausar tudo / retomar.
- **Mini-timer de bloco**: "ativar por um tempo" (ex.: ler por 20 min); ao terminar
  o bloco a atividade pausa sozinha.
- **Ajustes**: +5/−5 min, transferir tempo entre atividades, distribuir sobra,
  editar e adicionar atividades durante a sessão.
- **Desfazer** a última troca (toast por 30s ou `Ctrl/⌘+Z`), mantendo o tempo
  decorrido com a atividade anterior.
- **Feedback**: título da aba dinâmico, favicon com anel de progresso, beep via
  Web Audio, notificações do sistema (agendadas para o instante exato) e toasts.
- **Presets**: salvar/carregar/renomear/duplicar/excluir configurações.
- **Resumo e histórico**: ao encerrar (ou quando tudo zera), um resumo com
  planejado × gasto, proporções, linha do tempo das trocas; histórico das sessões
  com estatísticas por atividade (7 e 30 dias).
- **Exportar / importar** todos os dados em `.json` (mesclar ou substituir).
- **Picture-in-Picture**: janela flutuante compacta (onde houver suporte).
- **Atalhos**: `1`–`9` ativam atividades, `Espaço` pausa/retoma, `Ctrl/⌘+Z` desfaz,
  `N` adiciona atividade, `?` mostra a ajuda.
- **Temas** claro/escuro/sistema, responsivo (mobile e desktop), acessível e
  respeitando `prefers-reduced-motion`.

## Stack

- **Vite + React + TypeScript** (modo `strict`)
- **Zustand** com `persist` (localStorage, com `version`/`migrate`)
- **Tailwind CSS**
- **vite-plugin-pwa** (manifest + cache offline)
- **Vitest** para as funções puras de tempo e o fluxo da store
- Gráficos em SVG/CSS à mão; sem chamadas de rede.

## Arquitetura

- `src/lib/time.ts` — funções puras de tempo (restante, alocação, ETA, parse,
  formatação) e a reconciliação `reconcile(session, now)`, que para a atividade no
  instante exato do fim. Totalmente testada em `src/lib/time.test.ts`.
- `src/store/useAppStore.ts` — store única (sessão, presets, histórico,
  configurações, desfazer). Toda ação que muda a atividade ativa reconcilia,
  consolida o tempo, atualiza o log e reagenda as notificações.
- `src/hooks/` — `useNow` (re-render a cada 1s + `visibilitychange`), `useEngine`
  (tick/reconcile + eventos), título, favicon, atalhos, tema, Picture-in-Picture.
- `src/components/` — telas (`setup`, `session`, `summary`), painéis (`presets`,
  `history`, `settings`) e componentes comuns.

As telas são controladas por estado (`setup | session | summary`); histórico,
presets e configurações abrem como modal a partir do menu (☰) em qualquer tela.
