/**
 * Infraestrutura comum dos provedores (somente servidor):
 * - cache em memória com TTL e fallback "stale" em caso de erro
 * - deduplicação de requisições simultâneas
 * - limitador de chamadas por provedor (janela deslizante)
 * - timeout e log estruturado
 *
 * Em produção com múltiplas instâncias, troque o Map por Redis/Upstash mantendo a mesma interface.
 */

type Entry = { value: unknown; storedAt: number; expires: number };

const g = globalThis as unknown as {
  __lastroCache?: Map<string, Entry>;
  __lastroInflight?: Map<string, Promise<unknown>>;
  __lastroCalls?: Map<string, number[]>;
};
const cache = (g.__lastroCache ??= new Map());
const inflight = (g.__lastroInflight ??= new Map());
const calls = (g.__lastroCalls ??= new Map());

const STALE_MAX_MS = 24 * 60 * 60 * 1000;

export class ProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
    public code: "rate_limited" | "http" | "timeout" | "parse" | "not_configured" | "unsupported" = "http",
  ) {
    super(message);
  }
}

export interface Cached<T> {
  value: T;
  stale: boolean;
  storedAt: number;
  error?: string;
}

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<Cached<T>> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return { value: hit.value as T, stale: false, storedAt: hit.storedAt };

  let p = inflight.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fn().finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  try {
    const value = await p;
    cache.set(key, { value, storedAt: Date.now(), expires: Date.now() + ttlMs });
    return { value, stale: false, storedAt: Date.now() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("warn", "provider_error", { key, message });
    if (hit && now - hit.storedAt < STALE_MAX_MS) {
      return { value: hit.value as T, stale: true, storedAt: hit.storedAt, error: message };
    }
    throw err;
  }
}

/** Janela deslizante de 60 s. Lança ProviderError("rate_limited") antes de estourar o limite do provedor. */
export function takeToken(provider: string, perMinute: number) {
  const now = Date.now();
  const list = (calls.get(provider) ?? []).filter((t: number) => now - t < 60_000);
  if (list.length >= perMinute) {
    calls.set(provider, list);
    throw new ProviderError(provider, "Limite de chamadas atingido; tente novamente em instantes.", "rate_limited");
  }
  list.push(now);
  calls.set(provider, list);
}

export async function fetchJson<T>(
  provider: string,
  url: string,
  init?: RequestInit & { perMinute?: number; timeoutMs?: number },
): Promise<T> {
  takeToken(provider, init?.perMinute ?? 30);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(init?.timeoutMs ?? 8000),
      headers: { accept: "application/json", ...(init?.headers ?? {}) },
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    throw new ProviderError(provider, timeout ? "Tempo de resposta esgotado" : "Falha de conexão", timeout ? "timeout" : "http");
  }
  if (res.status === 429) throw new ProviderError(provider, "O provedor limitou as requisições (429).", "rate_limited");
  const text = await res.text();
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { message?: string; error?: string };
      detail = body.message ?? body.error ?? detail;
    } catch {}
    throw new ProviderError(provider, detail, "http");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ProviderError(provider, "Resposta inválida do provedor", "parse");
  }
}

export async function fetchText(provider: string, url: string, perMinute = 20) {
  takeToken(provider, perMinute);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) }).catch(() => {
    throw new ProviderError(provider, "Falha de conexão", "http");
  });
  if (!res.ok) throw new ProviderError(provider, `HTTP ${res.status}`, "http");
  return res.text();
}

export function log(level: "info" | "warn" | "error", event: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...data });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (process.env.NODE_ENV !== "production") console.info(line);
}

export const env = {
  brapiToken: process.env.BRAPI_TOKEN || "",
  coingeckoKey: process.env.COINGECKO_DEMO_API_KEY || "",
  finnhubKey: process.env.FINNHUB_API_KEY || "",
};
