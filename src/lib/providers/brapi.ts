import { z } from "zod";
import { cached, env, fetchJson, ProviderError } from "./http";

/**
 * Brapi — cotações da B3. Sem token, apenas PETR4, VALE3, ITUB4 e MGLU3 respondem (tickers de teste).
 * Com token (BRAPI_TOKEN) o acesso depende do plano. Limites, atraso das cotações e uso comercial:
 * https://brapi.dev/pricing — confirme antes de ir para produção.
 */
const BASE = "https://brapi.dev/api";

const QuoteResult = z.object({
  symbol: z.string(),
  longName: z.string().nullable().optional(),
  regularMarketPrice: z.number().nullable().optional(),
  regularMarketChange: z.number().nullable().optional(),
  regularMarketChangePercent: z.number().nullable().optional(),
  regularMarketTime: z.string().nullable().optional(),
  regularMarketDayHigh: z.number().nullable().optional(),
  regularMarketDayLow: z.number().nullable().optional(),
  regularMarketVolume: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  priceEarnings: z.number().nullable().optional(),
  earningsPerShare: z.number().nullable().optional(),
  fiftyTwoWeekLow: z.number().nullable().optional(),
  fiftyTwoWeekHigh: z.number().nullable().optional(),
  logourl: z.string().nullable().optional(),
  historicalDataPrice: z
    .array(z.object({ date: z.number(), close: z.number().nullable() }))
    .nullable()
    .optional(),
});
export type BrapiQuote = z.infer<typeof QuoteResult>;

function withToken(url: string) {
  if (!env.brapiToken) return url;
  return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(env.brapiToken)}`;
}

function ensureAccess(ticker: string, free?: boolean) {
  if (!env.brapiToken && !free) {
    throw new ProviderError("brapi", "Este ativo requer BRAPI_TOKEN configurado no servidor.", "not_configured");
  }
  void ticker;
}

export function brapiQuote(ticker: string, free?: boolean) {
  ensureAccess(ticker, free);
  return cached(`brapi:q:${ticker}`, 60_000, async () => {
    const raw = await fetchJson<{ results: unknown[] }>("brapi", withToken(`${BASE}/quote/${encodeURIComponent(ticker)}`), {
      perMinute: 40,
    });
    const r = QuoteResult.parse(raw.results?.[0]);
    return r;
  });
}

const RANGE: Record<string, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "15m" },
  "5d": { range: "5d", interval: "1h" },
  "1m": { range: "1mo", interval: "1d" },
  "6m": { range: "6mo", interval: "1d" },
  "1a": { range: "1y", interval: "1d" },
  "5a": { range: "5y", interval: "1wk" },
};

export function brapiHistory(ticker: string, range: string, free?: boolean) {
  ensureAccess(ticker, free);
  const r = RANGE[range] ?? RANGE["1m"];
  return cached(`brapi:h:${ticker}:${range}`, 15 * 60_000, async () => {
    const raw = await fetchJson<{ results: unknown[] }>(
      "brapi",
      withToken(`${BASE}/quote/${encodeURIComponent(ticker)}?range=${r.range}&interval=${r.interval}`),
      { perMinute: 40 },
    );
    const q = QuoteResult.parse(raw.results?.[0]);
    return (q.historicalDataPrice ?? [])
      .filter((p) => p.close != null)
      .map((p) => ({ t: p.date * 1000, v: p.close as number }))
      .sort((a, b) => a.t - b.t);
  });
}

const ListRow = z.object({
  stock: z.string(),
  name: z.string().nullable().optional(),
  close: z.number().nullable(),
  change: z.number().nullable(),
  volume: z.number().nullable(),
  logo: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
});

/** 100 ações mais negociadas (por volume). Exclui o mercado fracionário (sufixo F). */
export function brapiMostTraded() {
  return cached("brapi:list:volume", 5 * 60_000, async () => {
    const raw = await fetchJson<{ stocks: unknown[] }>(
      "brapi",
      withToken(`${BASE}/quote/list?type=stock&sortBy=volume&sortOrder=desc&limit=100`),
      { perMinute: 20 },
    );
    return z
      .array(ListRow)
      .parse(raw.stocks)
      .filter((r) => r.close != null && r.change != null && !/F$/.test(r.stock))
      .map((r) => ({
        symbol: r.stock,
        name: r.name ?? r.stock,
        price: r.close as number,
        changePct: r.change as number,
        volume: r.volume ?? 0,
        logo: r.logo ?? undefined,
      }));
  });
}
