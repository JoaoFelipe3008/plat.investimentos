"use client";

import { useEffect, useMemo } from "react";
import { getAsset } from "@/data/assets";
import { useMacro, useNews, useQuotes } from "@/hooks/use-market";
import { formatMoney, formatPct, todayISO } from "@/lib/format";
import { useApp, type Alert } from "@/lib/store";

export const ALERT_KIND_LABEL: Record<Alert["kind"], string> = {
  preco_acima: "Preço acima de",
  preco_abaixo: "Preço abaixo de",
  variacao: "Variação diária maior que",
  noticia: "Nova notícia sobre",
  selic: "Nova decisão da Selic",
};

const COOLDOWN_MS = 60 * 60_000;

function inQuietHours(a: Alert, now = new Date()) {
  if (!a.quietStart || !a.quietEnd) return false;
  const hm = now.toTimeString().slice(0, 5);
  return a.quietStart <= a.quietEnd ? hm >= a.quietStart && hm < a.quietEnd : hm >= a.quietStart || hm < a.quietEnd;
}

function canFire(a: Alert) {
  if (!a.active) return false;
  if (!a.lastTriggeredAt) return true;
  if (a.frequency === "uma_vez") return false;
  if (a.frequency === "diario") return a.lastTriggeredAt.slice(0, 10) !== todayISO();
  return Date.now() - new Date(a.lastTriggeredAt).getTime() > COOLDOWN_MS;
}

export function describeAlert(a: Alert) {
  const asset = a.symbol ? getAsset(a.symbol) : undefined;
  if (a.kind === "selic") return "Mudança na meta da taxa Selic";
  if (a.kind === "noticia") return `Notícias relacionadas a ${asset?.name ?? a.symbol}`;
  if (a.kind === "variacao") return `${asset?.name ?? a.symbol} variar mais de ${formatPct(a.threshold ?? 0, { signed: false })} no dia`;
  return `${asset?.name ?? a.symbol} ${a.kind === "preco_acima" ? "acima de" : "abaixo de"} ${formatMoney(a.threshold ?? 0, asset?.unit === "PTS" ? "PTS" : asset?.unit === "USD" ? "USD" : "BRL")}`;
}

/**
 * Motor de alertas no cliente: avalia enquanto o app está aberto, usando as mesmas
 * consultas em cache da interface. Para avaliação contínua (app fechado, e-mail, push via
 * service worker), o mesmo algoritmo deve rodar em um job no servidor — ver README.
 */
export function useAlertEngine() {
  const alerts = useApp((s) => s.alerts);
  const seen = useApp((s) => s.seen);
  const active = alerts.filter((a) => a.active);

  const symbols = useMemo(
    () => [...new Set(active.filter((a) => a.symbol && a.kind !== "noticia").map((a) => a.symbol!))],
    [active],
  );
  const { data: quotes } = useQuotes(symbols);
  const needsMacro = active.some((a) => a.kind === "selic");
  const needsNews = active.some((a) => a.kind === "noticia");
  const macro = useMacro();
  const news = useNews();

  useEffect(() => {
    if (!quotes && !needsMacro && !needsNews) return;
    const st = useApp.getState();

    const fire = (a: Alert, title: string, body: string, value: number | null, href?: string) => {
      st.pushNotification({ alertId: a.id, title, body, href });
      st.logAlert({ alertId: a.id, value, detail: body });
      st.updateAlert(a.id, { lastTriggeredAt: new Date().toISOString(), ...(a.frequency === "uma_vez" ? { active: false } : {}) });
      if (a.channels.push && !inQuietHours(a) && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(title, { body, tag: a.id });
        } catch {}
      }
    };

    for (const a of st.alerts) {
      if (!canFire(a)) continue;
      const asset = a.symbol ? getAsset(a.symbol) : undefined;

      if ((a.kind === "preco_acima" || a.kind === "preco_abaixo" || a.kind === "variacao") && a.symbol) {
        const q = quotes?.[a.symbol];
        if (!q || q.price == null || q.status === "unavailable") continue;
        const unit = q.unit;
        if (a.kind === "preco_acima" && q.price >= (a.threshold ?? Infinity)) {
          fire(a, `${asset?.name ?? a.symbol} acima de ${formatMoney(a.threshold!, unit)}`, `Cotação atual: ${formatMoney(q.price, unit)} · ${q.source}`, q.price, `/explorar/${a.symbol}`);
        } else if (a.kind === "preco_abaixo" && q.price <= (a.threshold ?? -Infinity)) {
          fire(a, `${asset?.name ?? a.symbol} abaixo de ${formatMoney(a.threshold!, unit)}`, `Cotação atual: ${formatMoney(q.price, unit)} · ${q.source}`, q.price, `/explorar/${a.symbol}`);
        } else if (a.kind === "variacao" && q.changePct != null && Math.abs(q.changePct) >= (a.threshold ?? Infinity)) {
          fire(a, `${asset?.name ?? a.symbol} ${q.changePct > 0 ? "sobe" : "cai"} ${formatPct(q.changePct, { signed: false })}`, `Variação no período informado pela fonte (${q.source}).`, q.changePct, `/explorar/${a.symbol}`);
        }
      }

      if (a.kind === "selic" && macro.data?.selic.price != null) {
        const current = macro.data.selic.price;
        if (seen.selic != null && current !== seen.selic) {
          fire(a, "Nova meta para a taxa Selic", `A meta passou de ${formatPct(seen.selic, { signed: false })} para ${formatPct(current, { signed: false })} (BCB, série 432).`, current, "/mercado");
        }
      }

      if (a.kind === "noticia" && a.symbol && news.data) {
        const fresh = news.data.items.filter(
          (n) => n.related.includes(a.symbol!) && !seen.newsIds.includes(n.id) && new Date(n.publishedAt) > new Date(a.createdAt),
        );
        const n = fresh[0];
        if (n) fire(a, `Notícia sobre ${asset?.name ?? a.symbol}`, `${n.title} — ${n.source}`, null, n.url);
      }
    }

    if (macro.data?.selic.price != null && seen.selic !== macro.data.selic.price) {
      st.setSeen({ selic: macro.data.selic.price });
    }
    if (news.data) {
      const ids = news.data.items.filter((n) => n.related.length).map((n) => n.id);
      const merged = [...new Set([...seen.newsIds, ...ids])].slice(-400);
      if (merged.length !== seen.newsIds.length) st.setSeen({ newsIds: merged });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, macro.data, news.data]);
}
