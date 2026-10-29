"use client";

import { useCallback, useEffect, useMemo } from "react";
import { getAsset } from "@/data/assets";
import { buildPositions, investedSeries } from "@/lib/finance/portfolio";
import { todayISO } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useQuotes } from "./use-market";

export function usePortfolio() {
  const transactions = useApp((s) => s.transactions);
  const incomes = useApp((s) => s.incomes);
  const snapshots = useApp((s) => s.snapshots);
  const recordSnapshot = useApp((s) => s.recordSnapshot);

  const symbols = useMemo(() => {
    const set = new Set(transactions.map((t) => t.symbol));
    if ([...set].some((s) => getAsset(s)?.unit === "USD")) set.add("USDBRL");
    return [...set];
  }, [transactions]);

  const quotes = useQuotes(symbols);
  const summary = useMemo(() => buildPositions(transactions, incomes, quotes.data), [transactions, incomes, quotes.data]);
  const investedHistory = useMemo(() => investedSeries(transactions, quotes.data?.USDBRL?.price ?? null), [transactions, quotes.data]);

  // Registra um retrato diário com valores de mercado reais (só quando todas as cotações necessárias chegaram).
  useEffect(() => {
    if (!quotes.data || !summary.positions.length) return;
    const missing = summary.positions.some((p) => {
      const a = getAsset(p.symbol);
      return a && a.provider.kind !== "benchmark" && !p.priced;
    });
    if (missing) return;
    recordSnapshot({ date: todayISO(), value: Math.round(summary.total * 100) / 100, invested: Math.round(summary.invested * 100) / 100 });
  }, [quotes.data, summary, recordSnapshot]);

  const periodChange = useCallback(
    (days: number) => {
      const target = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const base = [...snapshots].reverse().find((s) => s.date <= target);
      if (!base || !summary.total) return null;
      // Desconta aportes feitos no período para medir apenas a variação de preço.
      const flows = summary.invested - base.invested;
      return base.value ? ((summary.total - flows) / base.value - 1) * 100 : null;
    },
    [snapshots, summary],
  );

  return { ...summary, quotes, investedHistory, snapshots, periodChange, hasData: transactions.length > 0 };
}

export function useMask() {
  const hide = useApp((s) => s.settings.hideValues);
  return useCallback((s: string) => (hide ? "R$ ••••••" : s), [hide]);
}
