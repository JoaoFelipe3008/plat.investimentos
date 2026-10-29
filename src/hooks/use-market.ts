"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { History, HistoryRange, MacroSnapshot, MoversResponse, NewsFeed, Quote } from "@/lib/types";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar (${res.status})`);
  return res.json() as Promise<T>;
}

export function useQuotes(symbols: string[]) {
  const key = [...new Set(symbols)].sort();
  return useQuery({
    queryKey: ["quotes", key],
    queryFn: async () => {
      const { quotes } = await get<{ quotes: Quote[] }>(`/api/market/quotes?symbols=${key.join(",")}`);
      return Object.fromEntries(quotes.map((q) => [q.symbol, q])) as Record<string, Quote>;
    },
    enabled: key.length > 0,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useHistory(symbol: string, range: HistoryRange) {
  return useQuery({
    queryKey: ["history", symbol, range],
    queryFn: () => get<History>(`/api/market/history?symbol=${symbol}&range=${range}`),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useMacro() {
  return useQuery({
    queryKey: ["macro"],
    queryFn: () => get<MacroSnapshot>("/api/market/macro"),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  });
}

export function useMovers() {
  return useQuery({
    queryKey: ["movers"],
    queryFn: () => get<MoversResponse>("/api/market/movers"),
    refetchInterval: 5 * 60_000,
  });
}

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: () => get<NewsFeed>("/api/news"),
    staleTime: 5 * 60_000,
    // Os feeds são cacheados por 10 min no servidor; não adianta consultar mais que isso.
    refetchInterval: 10 * 60_000,
  });
}
