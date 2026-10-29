"use client";

import { useEffect, useRef } from "react";
import { log } from "@/lib/log";
import { useApp } from "@/lib/store";
import { getSupabase } from "./client";

/**
 * Espelha o estado local nas tabelas do Supabase quando há usuário autenticado.
 * Estratégia simples para o MVP: carrega tudo no login; depois envia upserts
 * (com debounce) e remove linhas apagadas localmente. RLS garante o isolamento por usuário.
 */
type Row = Record<string, unknown> & { id: string };

const TABLES = {
  transactions: (s: ReturnType<typeof useApp.getState>) =>
    s.transactions.map((t) => ({ id: t.id, symbol: t.symbol, type: t.type, quantity: t.quantity, price: t.price, fees: t.fees, date: t.date, note: t.note ?? null, example: !!t.example })),
  incomes: (s: ReturnType<typeof useApp.getState>) =>
    s.incomes.map((i) => ({ id: i.id, symbol: i.symbol, kind: i.kind, amount: i.amount, date: i.date, example: !!i.example })),
  alerts: (s: ReturnType<typeof useApp.getState>) =>
    s.alerts.map((a) => ({
      id: a.id,
      kind: a.kind,
      symbol: a.symbol ?? null,
      threshold: a.threshold ?? null,
      channels: a.channels,
      frequency: a.frequency,
      quiet_start: a.quietStart ?? null,
      quiet_end: a.quietEnd ?? null,
      active: a.active,
      created_at: a.createdAt,
      last_triggered_at: a.lastTriggeredAt ?? null,
    })),
} as const;

export function useRemoteSync() {
  const userId = useRef<string | null>(null);
  const pushed = useRef<Record<string, Set<string>>>({});

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) return;
      userId.current = data.user.id;

      const [profile, favorites, lessons, txs, incomes, alerts] = await Promise.all([
        sb.from("profiles").select("data").maybeSingle(),
        sb.from("favorites").select("symbol"),
        sb.from("lesson_progress").select("lesson_key, score, completed_at"),
        sb.from("transactions").select("*"),
        sb.from("incomes").select("*"),
        sb.from("alerts").select("*"),
      ]);
      if (profile.error || txs.error) {
        log("warn", "sync_pull_failed", { error: profile.error?.message ?? txs.error?.message });
        return;
      }
      useApp.getState().hydrateFromRemote({
        profile: (profile.data?.data as never) ?? useApp.getState().profile,
        favorites: favorites.data?.length ? favorites.data.map((f) => f.symbol as string) : undefined,
        lessons: lessons.data?.length
          ? Object.fromEntries(lessons.data.map((l) => [l.lesson_key, { score: l.score, completedAt: l.completed_at }]))
          : undefined,
        transactions: txs.data?.length ? (txs.data as never) : undefined,
        incomes: incomes.data?.length ? (incomes.data as never) : undefined,
        alerts: alerts.data?.length
          ? alerts.data.map((a) => ({
              id: a.id,
              kind: a.kind,
              symbol: a.symbol ?? undefined,
              threshold: a.threshold ?? undefined,
              channels: a.channels,
              frequency: a.frequency,
              quietStart: a.quiet_start ?? undefined,
              quietEnd: a.quiet_end ?? undefined,
              active: a.active,
              createdAt: a.created_at,
              lastTriggeredAt: a.last_triggered_at ?? undefined,
            }))
          : undefined,
      });
      for (const k of Object.keys(TABLES)) pushed.current[k] = new Set(((k === "transactions" ? txs.data : k === "incomes" ? incomes.data : alerts.data) ?? []).map((r) => r.id as string));

      unsub = useApp.subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(push, 1500);
      });
    })();

    async function push() {
      const s = useApp.getState();
      if (!userId.current || !sb) return;
      try {
        if (s.profile) await sb.from("profiles").upsert({ user_id: userId.current, data: s.profile });
        await sb.from("favorites").delete().eq("user_id", userId.current);
        if (s.favorites.length) await sb.from("favorites").insert(s.favorites.map((symbol) => ({ symbol })));
        const lessons = Object.entries(s.lessons).map(([lesson_key, v]) => ({ lesson_key, score: v.score, completed_at: v.completedAt }));
        if (lessons.length) await sb.from("lesson_progress").upsert(lessons, { onConflict: "user_id,lesson_key" });

        for (const [table, map] of Object.entries(TABLES)) {
          const rows = map(s) as Row[];
          const ids = new Set(rows.map((r) => r.id));
          const removed = [...(pushed.current[table] ?? [])].filter((id) => !ids.has(id));
          if (rows.length) await sb.from(table).upsert(rows);
          if (removed.length) await sb.from(table).delete().in("id", removed);
          pushed.current[table] = ids;
        }
      } catch (err) {
        log("warn", "sync_push_failed", { error: String(err) });
      }
    }

    return () => {
      clearTimeout(timer);
      unsub?.();
    };
  }, []);
}
