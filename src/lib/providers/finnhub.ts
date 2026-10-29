import { z } from "zod";
import { cached, env, fetchJson, ProviderError } from "./http";

/**
 * Finnhub — ações americanas e notícias globais. Requer FINNHUB_API_KEY.
 * O plano gratuito cobre cotação e notícias, mas não candles históricos.
 * Uso comercial exige plano pago: https://finnhub.io/pricing
 */
const BASE = "https://finnhub.io/api/v1";

function key() {
  if (!env.finnhubKey) throw new ProviderError("finnhub", "Requer FINNHUB_API_KEY configurada no servidor.", "not_configured");
  return env.finnhubKey;
}

const FQuote = z.object({ c: z.number(), d: z.number().nullable(), dp: z.number().nullable(), h: z.number(), l: z.number(), pc: z.number(), t: z.number() });

export function finnhubQuote(ticker: string) {
  const token = key();
  return cached(`fh:q:${ticker}`, 60_000, async () => {
    const q = FQuote.parse(await fetchJson("finnhub", `${BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${token}`, { perMinute: 50 }));
    if (!q.c) throw new ProviderError("finnhub", "Ticker sem cotação no Finnhub", "http");
    return q;
  });
}

const FNews = z.array(
  z.object({
    id: z.number(),
    headline: z.string(),
    summary: z.string(),
    source: z.string(),
    url: z.string(),
    image: z.string().nullable().optional(),
    datetime: z.number(),
    related: z.string().optional(),
  }),
);

export function finnhubNews(category: "general" | "crypto") {
  const token = key();
  return cached(`fh:news:${category}`, 10 * 60_000, async () =>
    FNews.parse(await fetchJson("finnhub", `${BASE}/news?category=${category}&token=${token}`, { perMinute: 20 })),
  );
}
