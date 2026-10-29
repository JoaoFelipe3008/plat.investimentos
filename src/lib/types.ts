export type AssetCategory =
  | "acoes-br"
  | "acoes-int"
  | "etf"
  | "fii"
  | "tesouro"
  | "renda-fixa"
  | "cripto"
  | "indice"
  | "cambio"
  | "macro";

/**
 * live        — dado do provedor dentro do intervalo de cache
 * delayed     — o provedor publica com atraso conhecido (ex.: PTAX diária, B3 com 15 min+)
 * stale       — falha na última consulta; exibindo o último valor válido em cache
 * unavailable — sem fonte configurada ou erro sem cache. Nunca preenchemos com valor inventado.
 */
export type QuoteStatus = "live" | "delayed" | "stale" | "unavailable";

export type Unit = "BRL" | "USD" | "PCT" | "PTS";

export interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  unit: Unit;
  asOf: string | null;
  fetchedAt: string;
  source: string;
  sourceUrl?: string;
  delayNote?: string;
  status: QuoteStatus;
  reason?: string;
  volume?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  marketCap?: number | null;
  extra?: Record<string, number | null>;
}

export interface HistoryPoint {
  t: number;
  v: number;
}

export type HistoryRange = "1d" | "5d" | "1m" | "6m" | "1a" | "5a";

export interface History {
  symbol: string;
  range: HistoryRange;
  unit: Unit;
  points: HistoryPoint[];
  source: string;
  status: QuoteStatus;
  reason?: string;
  fetchedAt: string;
}

export type NewsCategory = "brasil" | "internacional" | "cripto" | "economia" | "empresas" | "juros";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceHome: string;
  publishedAt: string;
  summary: string;
  image: string | null;
  categories: NewsCategory[];
  related: string[];
  relevance: number;
  license?: string;
}

export interface NewsFeed {
  items: NewsItem[];
  providers: { name: string; status: "ok" | "error" | "not_configured"; detail?: string }[];
  fetchedAt: string;
}

export interface MacroSnapshot {
  selic: Quote;
  cdi: Quote;
  ipca12m: Quote;
  ipcaMonth: Quote;
  usdbrl: Quote;
  focus: {
    year: number;
    ipca: number | null;
    selic: number | null;
    pib: number | null;
    cambio: number | null;
    asOf: string | null;
    status: QuoteStatus;
  };
  /** Última mudança da meta Selic encontrada na série 432 (janela de ~2 anos). */
  lastSelicChange: { date: string; rate: number; previous: number } | null;
}

export interface Mover {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  logo?: string;
}

export interface MoversResponse {
  gainers: Mover[];
  losers: Mover[];
  mostTraded: Mover[];
  source: string;
  status: QuoteStatus;
  reason?: string;
  fetchedAt: string;
}
