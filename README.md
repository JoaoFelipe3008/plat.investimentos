# Lastro

Plataforma de educação e acompanhamento de investimentos para quem está começando. Next.js (App Router) + TypeScript, Tailwind CSS v4, Motion, Recharts, TanStack Query, Zod e Supabase (opcional).

```bash
npm install
cp .env.example .env.local   # opcional: chaves dos provedores e Supabase
npm run dev                  # http://localhost:3000
```

Sem nenhuma variável configurada o app funciona em **modo local**: sem login, dados do usuário no `localStorage`, e só as fontes públicas ativas (BCB, CoinGecko, Agência Brasil e os 4 tickers gratuitos da Brapi).

## Arquitetura

```
src/
  app/
    (app)/            telas autenticadas (shell com sidebar)
      page.tsx        Visão geral (dashboard personalizável)
      guia/           trilha, lições com widgets interativos e questionários, glossário
      explorar/       catálogo, filtros, comparação lado a lado e página de cada ativo
      mercado/        indicadores, maiores altas/quedas, macro, Focus, agenda
      noticias/       central de notícias com filtros e relevância
      simulador/      projeção com 3 cenários, IR, taxas e inflação
      carteira/       movimentações, preço médio, proventos, diversificação
      alertas/        central de notificações, regras e registro de disparos
      configuracoes/  perfil, acessibilidade, painel, fontes, LGPD
    bem-vindo/        onboarding (perfil educacional)
    entrar/ auth/     login por link mágico (Supabase)
    api/              route handlers: market/{quotes,history,macro,movers}, news, status
  lib/
    providers/        integrações externas (somente servidor): cache, rate limit, timeout, fallback
    finance/          regras de negócio puras: carteira, simulador, trilha
    alerts.ts         motor de alertas (dedupe, frequência, horário de silêncio)
    store.ts          estado do usuário (Zustand + persistência)
    supabase/         cliente e sincronização com as tabelas
  components/         design system (ui/), gráficos, shell, widgets
  data/               catálogo de ativos, lições, glossário, calendário
supabase/schema.sql   tabelas + RLS por usuário
```

## Fontes de dados

| Fonte | Uso | Chave | Observações |
|---|---|---|---|
| Banco Central (SGS + Olinda/Focus) | Selic, CDI, IPCA, PTAX, expectativas | não | Oficial e gratuita. Publicação diária/mensal (não é tempo real). `ultimos/N` aceita no máximo 20. |
| CoinGecko | BTC, ETH, SOL (preço, 24h, histórico até 365 dias) | opcional (`COINGECKO_DEMO_API_KEY`) | A API pública tem limite baixo; o plano Demo exige atribuição. Uso comercial pede plano pago. |
| Brapi | Ações, ETFs, FIIs, índices B3, maiores altas/quedas | `BRAPI_TOKEN` | Sem token só PETR4, VALE3, ITUB4, MGLU3 e a listagem. Atraso e limites dependem do plano. |
| Finnhub | Ações dos EUA, S&P 500/Nasdaq via ETFs SPY/QQQ, notícias globais | `FINNHUB_API_KEY` | Plano grátis sem histórico; uso comercial pede plano pago. |
| Agência Brasil (RSS) | Notícias de economia e internacional | não | Licença Creative Commons com atribuição: confirme os termos e os créditos de imagem antes do uso comercial. |

Regras aplicadas em todo o código:

- Chaves só no servidor (`src/lib/providers/http.ts` → `env`). O endpoint `/api/status` informa apenas *se* cada chave existe.
- Cache em memória com TTL por fonte, deduplicação de chamadas simultâneas, limitador por minuto e fallback para o último valor válido (`stale`).
- Todo valor exibe fonte, horário de referência e situação (`live`, `delayed`, `stale`, `unavailable`).
- **Nenhum preço é inventado.** Sem fonte, o app mostra "Indisponível" com o motivo. Os únicos dados fictícios são a *carteira de exemplo* (marcada como Exemplo) e as simulações educacionais (marcadas como ilustrativas).
- Notícias: título, fonte, data e link originais. O resumo é um trecho do início do texto, sem reescrita. Categorias e ativos relacionados vêm de palavras-chave e podem errar.

## Supabase (opcional)

1. Crie um projeto e execute `supabase/schema.sql` (tabelas com RLS `auth.uid() = user_id`).
2. Defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Em Authentication → URL Configuration, adicione `http://localhost:3000/auth/callback`.

Com isso, o middleware exige login em todas as telas, o acesso é por link mágico e `useRemoteSync` espelha perfil, favoritos, lições, movimentações, proventos e alertas nas tabelas.

## O que está pronto e o que falta

Pronto e testado no navegador (modo local): onboarding, trilha personalizada com 26 lições, 7 widgets interativos e questionários, dashboard personalizável, mercado com dados reais do BCB, CoinGecko e Brapi, notícias reais, explorar com comparação, página de ativo, simulador, carteira manual com preço médio e proventos, alertas na plataforma e no navegador (com dedupe, frequência e horário de silêncio), busca global (Ctrl K), glossário contextual, layout responsivo e suporte a redução de movimento.

Limitações conhecidas:

- **Supabase não foi testado com um projeto real.** Login, middleware e sincronização estão implementados, mas não validados de ponta a ponta.
- **Alertas só são avaliados com o app aberto.** E-mail e push com o app fechado exigem um job no servidor (cron + service role) que leia `alerts`, grave em `alert_events` (que já tem chave única para dedupe) e envie por um provedor de e-mail e Web Push. A interface mostra o e-mail como indisponível.
- **Calendário econômico** gerado por regras: o Focus (segundas-feiras) é recorrente; IPCA e Payroll aparecem como "data estimada", com links para os calendários oficiais. Copom e FOMC ficam só como link.
- Ibovespa, IFIX, ETFs, FIIs e as demais ações exigem `BRAPI_TOKEN`; ativos dos EUA exigem `FINNHUB_API_KEY`.
- Renda fixa e Tesouro entram na carteira pelo valor aplicado, sem marcação a mercado.
- O cache em memória vale por instância; em produção com várias instâncias, use Redis/Upstash.
- Observabilidade básica (logs JSON estruturados). Para produção, conecte Sentry/OpenTelemetry em `src/lib/log.ts` e `src/lib/providers/http.ts`.
- Sem testes automatizados nesta versão.

## Aviso

Conteúdo educacional. O Lastro não é instituição financeira, não intermedia operações e não faz recomendação individual de investimentos. Rentabilidade passada não garante resultados futuros.
