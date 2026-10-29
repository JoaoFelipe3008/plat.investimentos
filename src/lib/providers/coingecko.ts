import { z } from "zod";
import { cached, env, fetchJson, ProviderError } from "./http";

/**
 * CoinGecko — API pública (sem chave) ou plano Demo (COINGECKO_DEMO_API_KEY).
 * A API pública tem limite baixo e variável de chamadas; o plano Demo exige atribuição.
 * Uso comercial: verifique os planos pagos em https://www.coingecko.com/en/api/pricing
 */
const BASE = "https://api.coingecko.com/api/v3";

function headers(): Record<string, string> {
  return env.coingeckoKey ? { "x-cg-demo-api-key": env.coingeckoKey } : {};
}
const perMinute = () => (env.coingeckoKey ? 25 : 8);

const Price = z.record(
  z.string(),
  z.object({
    brl: z.number(),
    usd: z.number().optional(),
    brl_24h_change: z.number().nullable().optional(),
    brl_24h_vol: z.number().nullable().optional(),
    brl_market_cap: z.number().nullable().optional(),
    last_updated_at: z.number().optional(),
  }),
);

/** Busca todos os ids juntos em uma chamada; o cache é por conjunto ordenado de ids. */
export function cgPrices(ids: string[]) {
  const key = [...new Set(ids)].sort().join(",");
  return cached(`cg:price:${key}`, 60_000, async () => {
    const url = `${BASE}/simple/price?ids=${key}&vs_currencies=brl,usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`;
    return Price.parse(await fetchJson("coingecko", url, { headers: headers(), perMinute: perMinute() }));
  });
}

const CG_DAYS = { "1d": 1, "5d": 7, "1m": 30, "6m": 180, "1a": 365 } as const;

export function cgHistory(id: string, range: string) {
  const days = CG_DAYS[range as keyof typeof CG_DAYS];
  if (!days) {
    return Promise.reject(new ProviderError("coingecko", "A API pública da CoinGecko fornece no máximo 365 dias de histórico.", "unsupported"));
  }
  return cached(`cg:hist:${id}:${days}`, days <= 1 ? 5 * 60_000 : 30 * 60_000, async () => {
    const raw = await fetchJson<{ prices: [number, number][] }>(
      "coingecko",
      `${BASE}/coins/${id}/market_chart?vs_currency=brl&days=${days}`,
      { headers: headers(), perMinute: perMinute() },
    );
    return raw.prices.map(([t, v]) => ({ t, v }));
  });
}
