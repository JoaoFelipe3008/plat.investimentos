import { XMLParser } from "fast-xml-parser";
import { ASSETS } from "@/data/assets";
import type { NewsCategory, NewsFeed, NewsItem } from "@/lib/types";
import { normalize } from "@/lib/utils";
import { finnhubNews } from "./finnhub";
import { cached, env, fetchText, log, ProviderError } from "./http";

/**
 * Notícias — somente fontes reais. Nada é gerado ou reescrito por IA:
 * o resumo é um trecho extraído do início do texto original, com link e crédito.
 *
 * 1) Agência Brasil (EBC), RSS público. Conteúdo sob licença Creative Commons com atribuição
 *    (confira os termos em https://agenciabrasil.ebc.com.br). Imagens podem ter créditos próprios.
 * 2) Finnhub (opcional, FINNHUB_API_KEY): notícias globais e de cripto, em inglês.
 */
const ABR_FEEDS: { url: string; categories: NewsCategory[] }[] = [
  { url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml", categories: ["brasil", "economia"] },
  { url: "https://agenciabrasil.ebc.com.br/rss/internacional/feed.xml", categories: ["internacional"] },
];

const RULES: { cat: NewsCategory; re: RegExp; weight: number }[] = [
  { cat: "juros", re: /\b(selic|copom|juros|ipca|infla[cç][aã]o|cdi|banco central|interest rate|fed|inflation)\b/i, weight: 3 },
  { cat: "cripto", re: /\b(bitcoin|cripto\w*|blockchain|ethereum|crypto\w*|stablecoin)\b/i, weight: 3 },
  { cat: "empresas", re: /\b(a[cç][oõ]es|lucro|balan[cç]o|dividendos|resultado trimestral|ipo|b3|bolsa|earnings|shares)\b/i, weight: 2 },
  { cat: "economia", re: /\b(pib|d[oó]lar|c[aâ]mbio|fiscal|arrecada[cç][aã]o|emprego|desemprego|gdp|economy|tesouro)\b/i, weight: 1 },
];

const ASSET_MATCHERS = ASSETS.map((a) => ({
  symbol: a.symbol,
  res: a.keywords.filter((k) => k.length >= 4).map((k) => new RegExp(`\\b${normalize(k).replace(/[.*+?^${}()|[\]\\&]/g, "\\$&")}\\b`, "i")),
}));

function stripHtml(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trecho inicial do texto original (até 2 frases / 280 caracteres). */
function excerpt(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 280) break;
    out += s;
    if (out.split(/[.!?]/).length > 2) break;
  }
  out = out.trim() || text.slice(0, 260).trim();
  return out.length < text.length && !/[.!?]$/.test(out) ? `${out}…` : out;
}

function enrich(item: Omit<NewsItem, "related" | "relevance" | "categories">, baseCats: NewsCategory[]): NewsItem {
  const hay = normalize(`${item.title} ${item.summary}`);
  const cats = new Set<NewsCategory>(baseCats);
  let score = 0;
  for (const r of RULES) {
    if (r.re.test(hay) || r.re.test(`${item.title} ${item.summary}`)) {
      cats.add(r.cat);
      score += r.weight;
    }
  }
  const related = ASSET_MATCHERS.filter((m) => m.res.some((re) => re.test(hay))).map((m) => m.symbol);
  score += related.length * 2;
  const hours = (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
  const relevance = Math.max(0, Math.round((score * 10 - Math.min(hours, 72) * 0.6) * 10) / 10);
  return { ...item, categories: [...cats], related: related.slice(0, 5), relevance };
}

const parser = new XMLParser({ ignoreAttributes: true, processEntities: true, htmlEntities: true });

async function agenciaBrasil(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    ABR_FEEDS.map((f) =>
      cached(`abr:${f.url}`, 10 * 60_000, async () => {
        const xml = await fetchText("agencia-brasil", f.url);
        const doc = parser.parse(xml) as { rss?: { channel?: { item?: unknown } } };
        const raw = doc.rss?.channel?.item;
        const items = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
        return items.map((it) => {
          const link = String(it.link ?? "");
          const text = stripHtml(String(it.description ?? "")).replace(/^Logo Agência Brasil\s*/i, "");
          const img = typeof it["imagem-destaque"] === "string" ? (it["imagem-destaque"] as string) : null;
          return enrich(
            {
              id: `abr:${link}`,
              title: stripHtml(String(it.title ?? "")),
              url: link,
              source: "Agência Brasil",
              sourceHome: "https://agenciabrasil.ebc.com.br",
              publishedAt: new Date(String(it.pubDate ?? Date.now())).toISOString(),
              summary: excerpt(text),
              image: img && img.startsWith("https://imagens.ebc.com.br/") ? img : null,
              license: "Creative Commons — Agência Brasil/EBC",
            },
            f.categories,
          );
        });
      }),
    ),
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  if (!ok.length) throw new ProviderError("agencia-brasil", "Feeds indisponíveis");
  return ok.flatMap((r) => r.value.value);
}

async function finnhub(): Promise<NewsItem[]> {
  const [general, crypto] = await Promise.all([finnhubNews("general"), finnhubNews("crypto")]);
  const map = (rows: typeof general.value, cats: NewsCategory[]) =>
    rows.slice(0, 30).map((n) =>
      enrich(
        {
          id: `fh:${n.id}`,
          title: n.headline,
          url: n.url,
          source: n.source,
          sourceHome: "https://finnhub.io",
          publishedAt: new Date(n.datetime * 1000).toISOString(),
          summary: excerpt(n.summary),
          // Imagens de terceiros via agregador: não exibimos sem confirmação de licença.
          image: null,
          license: "Via Finnhub — direitos do veículo original",
        },
        cats,
      ),
    );
  return [...map(general.value, ["internacional"]), ...map(crypto.value, ["cripto", "internacional"])];
}

export async function getNews(): Promise<NewsFeed> {
  const providers: NewsFeed["providers"] = [];
  const all: NewsItem[] = [];

  try {
    all.push(...(await agenciaBrasil()));
    providers.push({ name: "Agência Brasil", status: "ok" });
  } catch (err) {
    log("warn", "news_provider_failed", { provider: "abr", message: String(err) });
    providers.push({ name: "Agência Brasil", status: "error", detail: "Feed indisponível no momento" });
  }

  if (env.finnhubKey) {
    try {
      all.push(...(await finnhub()));
      providers.push({ name: "Finnhub", status: "ok" });
    } catch {
      providers.push({ name: "Finnhub", status: "error", detail: "Falha ao consultar" });
    }
  } else {
    providers.push({ name: "Finnhub", status: "not_configured", detail: "Notícias internacionais e cripto em inglês (FINNHUB_API_KEY)" });
  }

  const seen = new Set<string>();
  const items = all
    .filter((n) => n.title && n.url && !seen.has(n.url) && seen.add(n.url))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

  return { items, providers, fetchedAt: new Date().toISOString() };
}
