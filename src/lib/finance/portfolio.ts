import { CATEGORY_LABEL, getAsset, isPriced } from "@/data/assets";
import type { Income, Transaction } from "@/lib/store";
import type { AssetCategory, Quote } from "@/lib/types";

export interface Position {
  symbol: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  avgPrice: number; // em moeda do ativo
  cost: number; // BRL
  price: number | null; // BRL por unidade
  value: number; // BRL (usa custo quando não há cotação)
  pnl: number | null;
  pnlPct: number | null;
  dayChangePct: number | null;
  realized: number;
  priced: boolean;
  example: boolean;
  income: number;
}

/**
 * Consolida movimentações pelo método do preço médio:
 * compras atualizam o preço médio; vendas reduzem a quantidade e realizam lucro/prejuízo.
 * Ativos em USD são convertidos pela PTAX quando disponível.
 */
export function buildPositions(txs: Transaction[], incomes: Income[], quotes: Record<string, Quote> | undefined) {
  const usd = quotes?.USDBRL?.price ?? null;
  const map = new Map<string, { qty: number; avg: number; realized: number; example: boolean }>();

  for (const t of [...txs].sort((a, b) => a.date.localeCompare(b.date))) {
    const cur = map.get(t.symbol) ?? { qty: 0, avg: 0, realized: 0, example: true };
    cur.example = cur.example && !!t.example;
    if (t.type === "compra") {
      const total = cur.qty * cur.avg + t.quantity * t.price + t.fees;
      cur.qty += t.quantity;
      cur.avg = cur.qty > 0 ? total / cur.qty : 0;
    } else {
      const q = Math.min(t.quantity, cur.qty);
      cur.realized += q * (t.price - cur.avg) - t.fees;
      cur.qty -= q;
    }
    map.set(t.symbol, cur);
  }

  const positions: Position[] = [];
  for (const [symbol, p] of map) {
    if (p.qty <= 1e-12) continue;
    const asset = getAsset(symbol);
    if (!asset) continue;
    const fx = asset.unit === "USD" ? usd : 1;
    const q = quotes?.[symbol];
    const priced = isPriced(asset) && q?.price != null && fx != null;
    const price = priced ? q!.price! * fx! : null;
    const cost = p.qty * p.avg * (asset.unit === "USD" ? (usd ?? 0) : 1);
    const value = price != null ? price * p.qty : cost;
    positions.push({
      symbol,
      name: asset.name,
      category: asset.category,
      quantity: p.qty,
      avgPrice: p.avg,
      cost,
      price,
      value,
      pnl: price != null ? value - cost : null,
      pnlPct: price != null && cost > 0 ? (value / cost - 1) * 100 : null,
      dayChangePct: priced ? (q?.changePct ?? null) : null,
      realized: p.realized,
      priced,
      example: p.example,
      income: incomes.filter((i) => i.symbol === symbol).reduce((s, i) => s + i.amount, 0),
    });
  }
  positions.sort((a, b) => b.value - a.value);

  const total = positions.reduce((s, p) => s + p.value, 0);
  const invested = positions.reduce((s, p) => s + p.cost, 0);
  const pricedPositions = positions.filter((p) => p.priced);
  const dayBase = pricedPositions.reduce((s, p) => s + p.value / (1 + (p.dayChangePct ?? 0) / 100), 0);
  const dayValue = pricedPositions.reduce((s, p) => s + p.value, 0);

  const byCategory = Object.entries(
    positions.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + p.value;
      return acc;
    }, {}),
  )
    .map(([cat, value]) => ({ category: cat as AssetCategory, name: CATEGORY_LABEL[cat as AssetCategory], value, pct: total ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  // Índice Herfindahl-Hirschman normalizado: 0 = muito diversificado, 1 = concentrado em um ativo.
  const hhi = total ? positions.reduce((s, p) => s + (p.value / total) ** 2, 0) : 0;

  return {
    positions,
    total,
    invested,
    pnl: total - invested,
    pnlPct: invested ? (total / invested - 1) * 100 : 0,
    dayChange: dayValue - dayBase,
    dayChangePct: dayBase ? (dayValue / dayBase - 1) * 100 : null,
    byCategory,
    hhi,
    largest: positions[0] ? { symbol: positions[0].symbol, pct: total ? (positions[0].value / total) * 100 : 0 } : null,
    incomeTotal: incomes.reduce((s, i) => s + i.amount, 0),
    unpricedCount: positions.filter((p) => !p.priced).length,
    usdMissing: usd == null && positions.some((p) => getAsset(p.symbol)?.unit === "USD"),
  };
}

export function diversificationLabel(hhi: number, count: number) {
  if (count === 0) return { label: "—", tone: "neutral" as const, text: "Adicione ativos para ver a análise." };
  if (hhi > 0.5) return { label: "Concentrada", tone: "warn" as const, text: "Mais da metade do risco depende de poucos ativos." };
  if (hhi > 0.25) return { label: "Moderada", tone: "neutral" as const, text: "Há concentração relevante em alguns ativos." };
  return { label: "Diversificada", tone: "neutral" as const, text: "O patrimônio está distribuído entre vários ativos." };
}

/** Série do valor investido acumulado (custo), um ponto por movimentação. */
export function investedSeries(txs: Transaction[], usd: number | null) {
  let acc = 0;
  const pts: { t: number; v: number }[] = [];
  for (const t of [...txs].sort((a, b) => a.date.localeCompare(b.date))) {
    const fx = getAsset(t.symbol)?.unit === "USD" ? (usd ?? 0) : 1;
    acc += (t.type === "compra" ? 1 : -1) * (t.quantity * t.price + (t.type === "compra" ? t.fees : -t.fees)) * fx;
    pts.push({ t: new Date(`${t.date}T12:00:00`).getTime(), v: Math.max(0, acc) });
  }
  return pts;
}
