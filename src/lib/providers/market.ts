import { ASSETS, getAsset, type Asset } from "@/data/assets";
import type { History, HistoryRange, MacroSnapshot, MoversResponse, Quote, QuoteStatus } from "@/lib/types";
import { focusAnnual, sgsLatest, sgsRange } from "./bcb";
import { brapiHistory, brapiMostTraded, brapiQuote } from "./brapi";
import { cgHistory, cgPrices } from "./coingecko";
import { finnhubQuote } from "./finnhub";
import { ProviderError, type Cached } from "./http";

// Uma única chamada para todas as moedas do catálogo: um só item de cache e menos consumo do limite da API pública.
const CG_IDS = ASSETS.flatMap((a) => (a.provider.kind === "coingecko" ? [a.provider.id] : []));

const SOURCES = {
  bcb: { name: "Banco Central do Brasil (SGS)", url: "https://dadosabertos.bcb.gov.br" },
  brapi: { name: "Brapi", url: "https://brapi.dev" },
  coingecko: { name: "CoinGecko", url: "https://www.coingecko.com" },
  finnhub: { name: "Finnhub", url: "https://finnhub.io" },
};

function base(asset: Asset, source: keyof typeof SOURCES): Quote {
  return {
    symbol: asset.symbol,
    price: null,
    change: null,
    changePct: null,
    unit: asset.unit,
    asOf: null,
    fetchedAt: new Date().toISOString(),
    source: SOURCES[source].name,
    sourceUrl: SOURCES[source].url,
    status: "unavailable",
  };
}

function statusOf<T>(c: Cached<T>, normal: QuoteStatus): Pick<Quote, "status" | "fetchedAt" | "reason"> {
  return {
    status: c.stale ? "stale" : normal,
    fetchedAt: new Date(c.storedAt).toISOString(),
    reason: c.stale ? `Exibindo último valor válido. Erro atual: ${c.error}` : undefined,
  };
}

function reasonOf(err: unknown) {
  if (err instanceof ProviderError) return err.message;
  return "Fonte indisponível no momento.";
}

async function bcbQuote(asset: Asset, series: number): Promise<Quote> {
  const q = base(asset, "bcb");
  try {
    const c = await sgsLatest(series, series === 432 ? 20 : 4);
    const pts = c.value;
    const last = pts.at(-1);
    const prev = pts.length > 1 ? pts.at(-2) : undefined;
    if (!last) throw new ProviderError("bcb", "Série sem dados recentes");
    const isRate = asset.unit === "PCT";
    return {
      ...q,
      ...statusOf(c, "delayed"),
      price: last.value,
      change: prev ? last.value - prev.value : null,
      changePct: prev && !isRate ? (last.value / prev.value - 1) * 100 : null,
      asOf: `${last.date}T12:00:00-03:00`,
      delayNote:
        series === 1
          ? "PTAX: taxa oficial publicada pelo BCB ao longo do dia útil (não é cotação em tempo real)."
          : series === 13522
            ? "Publicação mensal pelo IBGE, disponibilizada pelo BCB."
            : "Publicação diária pelo Banco Central.",
    };
  } catch (err) {
    return { ...q, reason: reasonOf(err) };
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const assets = symbols.map((s) => getAsset(s)).filter((a): a is Asset => !!a);
  const cgAssets = assets.filter((a) => a.provider.kind === "coingecko");
  const cgPromise = cgAssets.length
    ? cgPrices(CG_IDS).catch((e: unknown) => e)
    : null;

  return Promise.all(
    assets.map(async (asset): Promise<Quote> => {
      const p = asset.provider;
      switch (p.kind) {
        case "bcb":
          return bcbQuote(asset, p.series);
        case "benchmark": {
          const of = getAsset(p.of)!;
          const ref = await bcbQuote(of, (of.provider as { series: number }).series);
          return { ...ref, symbol: asset.symbol, reason: ref.reason, extra: { benchmark: ref.price } };
        }
        case "coingecko": {
          const q = base(asset, "coingecko");
          const res = await cgPromise;
          if (!res || res instanceof Error || !(res as Cached<unknown>).value) return { ...q, reason: reasonOf(res) };
          const c = res as Awaited<ReturnType<typeof cgPrices>>;
          const row = c.value[p.id];
          if (!row) return { ...q, reason: "Ativo não retornado pelo provedor" };
          const changePct = row.brl_24h_change ?? null;
          return {
            ...q,
            ...statusOf(c, "live"),
            price: row.brl,
            changePct,
            change: changePct != null ? row.brl - row.brl / (1 + changePct / 100) : null,
            asOf: row.last_updated_at ? new Date(row.last_updated_at * 1000).toISOString() : null,
            volume: row.brl_24h_vol ?? null,
            marketCap: row.brl_market_cap ?? null,
            delayNote: "Variação calculada nas últimas 24 horas (mercado cripto funciona 24/7).",
            extra: { usd: row.usd ?? null },
          };
        }
        case "brapi": {
          const q = base(asset, "brapi");
          try {
            const c = await brapiQuote(p.ticker, p.free);
            const r = c.value;
            return {
              ...q,
              ...statusOf(c, "delayed"),
              price: r.regularMarketPrice ?? null,
              change: r.regularMarketChange ?? null,
              changePct: r.regularMarketChangePercent ?? null,
              asOf: r.regularMarketTime ?? null,
              volume: r.regularMarketVolume ?? null,
              dayHigh: r.regularMarketDayHigh ?? null,
              dayLow: r.regularMarketDayLow ?? null,
              marketCap: r.marketCap ?? null,
              delayNote: "Cotações da B3 podem ter atraso conforme o plano do provedor.",
              extra: {
                pl: r.priceEarnings ?? null,
                lpa: r.earningsPerShare ?? null,
                min52: r.fiftyTwoWeekLow ?? null,
                max52: r.fiftyTwoWeekHigh ?? null,
              },
            };
          } catch (err) {
            return { ...q, reason: reasonOf(err) };
          }
        }
        case "finnhub": {
          const q = base(asset, "finnhub");
          try {
            const c = await finnhubQuote(p.ticker);
            const r = c.value;
            return {
              ...q,
              ...statusOf(c, "live"),
              price: r.c,
              change: r.d,
              changePct: r.dp,
              dayHigh: r.h,
              dayLow: r.l,
              asOf: r.t ? new Date(r.t * 1000).toISOString() : null,
              delayNote: p.proxyNote ?? "Preço em dólar no mercado americano.",
            };
          } catch (err) {
            return { ...q, reason: reasonOf(err) };
          }
        }
      }
    }),
  );
}

const RANGE_DAYS: Record<HistoryRange, number> = { "1d": 7, "5d": 10, "1m": 31, "6m": 183, "1a": 366, "5a": 1830 };

export async function getHistory(symbol: string, range: HistoryRange): Promise<History> {
  const asset = getAsset(symbol);
  const empty = (source: string, reason: string): History => ({
    symbol,
    range,
    unit: asset?.unit ?? "BRL",
    points: [],
    source,
    status: "unavailable",
    reason,
    fetchedAt: new Date().toISOString(),
  });
  if (!asset) return empty("—", "Ativo desconhecido");
  let p = asset.provider;
  if (p.kind === "benchmark") p = getAsset(p.of)!.provider;

  try {
    let c: Cached<{ t: number; v: number }[]>;
    let source = "";
    if (p.kind === "coingecko") {
      c = await cgHistory(p.id, range);
      source = SOURCES.coingecko.name;
    } else if (p.kind === "brapi") {
      c = await brapiHistory(p.ticker, range, p.free);
      source = SOURCES.brapi.name;
    } else if (p.kind === "bcb") {
      // IPCA 12m é mensal: usa janela maior para ter pontos suficientes.
      const days = p.series === 13522 ? Math.max(RANGE_DAYS[range], 730) : RANGE_DAYS[range];
      const r = await sgsRange(p.series, days);
      c = { ...r, value: r.value.map((pt) => ({ t: new Date(`${pt.date}T12:00:00-03:00`).getTime(), v: pt.value })) };
      source = SOURCES.bcb.name;
    } else {
      return empty(SOURCES.finnhub.name, "Histórico de ações americanas requer plano pago do Finnhub ou outro provedor.");
    }
    return {
      symbol,
      range,
      unit: asset.unit,
      points: c.value,
      source,
      status: c.stale ? "stale" : p.kind === "coingecko" ? "live" : "delayed",
      reason: c.stale ? c.error : undefined,
      fetchedAt: new Date(c.storedAt).toISOString(),
    };
  } catch (err) {
    const src = p.kind === "coingecko" ? SOURCES.coingecko.name : p.kind === "brapi" ? SOURCES.brapi.name : SOURCES.bcb.name;
    return empty(src, reasonOf(err));
  }
}

export async function getMacro(): Promise<MacroSnapshot> {
  const [selic, cdi, ipca12m, usdbrl] = await getQuotes(["SELIC", "CDI", "IPCA", "USDBRL"]);
  const ipcaMonthAsset = { ...getAsset("IPCA")!, symbol: "IPCA-M", name: "IPCA no mês" };
  const ipcaMonth = await bcbQuote(ipcaMonthAsset, 433);

  const year = new Date().getFullYear();
  let focus: MacroSnapshot["focus"] = { year, ipca: null, selic: null, pib: null, cambio: null, asOf: null, status: "unavailable" };
  try {
    const f = await focusAnnual(year);
    focus = { ...f.value, status: f.stale ? "stale" : "delayed" };
  } catch {}

  let lastSelicChange: MacroSnapshot["lastSelicChange"] = null;
  try {
    const r = await sgsRange(432, 730);
    const pts = r.value;
    for (let i = pts.length - 1; i > 0; i--) {
      if (pts[i].value !== pts[i - 1].value) {
        lastSelicChange = { date: pts[i].date, rate: pts[i].value, previous: pts[i - 1].value };
        break;
      }
    }
  } catch {}

  return { selic, cdi, ipca12m, ipcaMonth, usdbrl, focus, lastSelicChange };
}

export async function getMovers(): Promise<MoversResponse> {
  try {
    const c = await brapiMostTraded();
    const list = c.value;
    const byChange = [...list].sort((a, b) => b.changePct - a.changePct);
    return {
      gainers: byChange.filter((m) => m.changePct > 0).slice(0, 6),
      losers: byChange.filter((m) => m.changePct < 0).reverse().slice(0, 6),
      mostTraded: list.slice(0, 8),
      source: SOURCES.brapi.name,
      status: c.stale ? "stale" : "delayed",
      fetchedAt: new Date(c.storedAt).toISOString(),
    };
  } catch (err) {
    return {
      gainers: [],
      losers: [],
      mostTraded: [],
      source: SOURCES.brapi.name,
      status: "unavailable",
      reason: reasonOf(err),
      fetchedAt: new Date().toISOString(),
    };
  }
}
