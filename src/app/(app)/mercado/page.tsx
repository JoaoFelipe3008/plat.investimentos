"use client";

import { CalendarDays, ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatAssetValue, HistoryChart, QuoteChange } from "@/components/market";
import { PageHeader } from "@/components/shell/app-shell";
import { Term } from "@/components/term";
import { Card, CardHeader } from "@/components/ui/card";
import { Segmented, SourceTag } from "@/components/ui/interactive";
import { Badge, Change, EmptyState, Skeleton } from "@/components/ui/primitives";
import { getAsset, MARKET_INDICATORS } from "@/data/assets";
import { OFFICIAL_CALENDARS, upcomingEvents } from "@/data/calendar";
import { useMacro, useMovers, useQuotes } from "@/hooks/use-market";
import { formatBRL, formatCompact, formatDate, formatNumber } from "@/lib/format";
import type { Mover } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MarketPage() {
  const [selected, setSelected] = useState("BTC");
  const { data, isLoading } = useQuotes(MARKET_INDICATORS);
  const asset = getAsset(selected);
  const q = data?.[selected];

  return (
    <>
      <PageHeader
        title="Mercado"
        description="Indicadores, maiores movimentos e agenda econômica. Cada valor mostra a fonte, o horário de referência e se há atraso."
      />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="overflow-hidden">
          <ul role="listbox" aria-label="Indicadores">
            {MARKET_INDICATORS.map((s) => {
              const a = getAsset(s);
              const qq = data?.[s];
              const active = s === selected;
              return (
                <li key={s}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => setSelected(s)}
                    className={cn(
                      "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors",
                      active ? "border-fg bg-elevated/60" : "border-transparent hover:bg-elevated/30",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{a?.name}</p>
                      <p className="text-2xs text-subtle">{s}</p>
                    </div>
                    <div className="text-right">
                      {isLoading && !qq ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <>
                          <p className={cn("num text-[13px]", qq?.price == null && "text-subtle")}>{qq?.price == null ? "—" : formatAssetValue(a, qq.price)}</p>
                          {qq?.price != null && <QuoteChange asset={a} quote={qq} />}
                        </>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card delay={0.04}>
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
            <div>
              <p className="text-xs text-muted">{asset?.name}</p>
              <p className={cn("num mt-1 text-[28px] font-semibold tracking-[-0.02em]", q?.price == null && "text-subtle")}>
                {q?.price == null ? "Indisponível" : formatAssetValue(asset, q.price)}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <QuoteChange asset={asset} quote={q} pill />
                {q && <SourceTag source={q.source} asOf={q.asOf} status={q.status} note={q.delayNote ?? q.reason} />}
              </div>
              {q?.status === "unavailable" && q.reason && <p className="mt-2 max-w-md text-xs text-subtle">{q.reason}</p>}
            </div>
            <Link href={`/explorar/${selected}`} className="text-xs text-muted hover:text-fg">
              Detalhes e explicação →
            </Link>
          </div>
          <p className="px-5 pt-2 text-[13px] text-muted">{asset?.beginner}</p>
          <div className="p-5">
            <HistoryChart key={selected} symbol={selected} height={300} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MoversCard />
        <MacroCard />
        <CalendarCard />
      </div>
    </>
  );
}

function MoversCard() {
  const { data, isLoading } = useMovers();
  const [tab, setTab] = useState<"altas" | "quedas" | "volume">("altas");
  const list: Mover[] = !data ? [] : tab === "altas" ? data.gainers : tab === "quedas" ? data.losers : data.mostTraded;

  return (
    <Card className="lg:col-span-2" delay={0.06}>
      <CardHeader
        title="Maiores movimentos da B3"
        description="Entre as 100 ações mais negociadas do dia"
        action={
          <Segmented
            value={tab}
            onChange={setTab}
            label="Lista"
            options={[
              { value: "altas", label: "Altas" },
              { value: "quedas", label: "Quedas" },
              { value: "volume", label: "Mais negociadas" },
            ]}
          />
        }
      />
      {isLoading ? (
        <div className="space-y-2 px-5 pb-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : data?.status === "unavailable" ? (
        <EmptyState icon={TrendingUp} title="Dados indisponíveis" description={data.reason} />
      ) : !list.length ? (
        <EmptyState icon={tab === "quedas" ? TrendingDown : TrendingUp} title="Nenhum ativo nesta lista agora" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y border-line text-left text-2xs uppercase tracking-[0.05em] text-subtle">
                <th className="px-5 py-2 font-medium">Ativo</th>
                <th className="px-3 py-2 text-right font-medium">Preço</th>
                <th className="px-3 py-2 text-right font-medium">Variação</th>
                <th className="px-5 py-2 text-right font-medium"><Term id="volume">Volume</Term></th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.symbol} className="border-b border-line last:border-0 hover:bg-elevated/30">
                  <td className="px-5 py-2.5">
                    <p className="num font-medium">{m.symbol}</p>
                    <p className="max-w-[220px] truncate text-xs text-subtle">{m.name}</p>
                  </td>
                  <td className="num px-3 py-2.5 text-right">{formatBRL(m.price)}</td>
                  <td className="px-3 py-2.5 text-right"><Change value={m.changePct} /></td>
                  <td className="num px-5 py-2.5 text-right text-muted">{formatCompact(m.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <div className="border-t border-line px-5 py-3">
          <SourceTag source={data.source} asOf={data.fetchedAt} status={data.status} note="Lista consultada a cada 5 minutos. Exclui o mercado fracionário." />
        </div>
      )}
    </Card>
  );
}

function MacroCard() {
  const { data, isLoading } = useMacro();
  const rows = data
    ? [
        { label: <Term id="selic">Selic (meta)</Term>, value: data.selic.price, unit: "% a.a.", q: data.selic },
        { label: <Term id="cdi">CDI</Term>, value: data.cdi.price, unit: "% a.a.", q: data.cdi },
        { label: <><Term id="ipca">IPCA</Term> 12 meses</>, value: data.ipca12m.price, unit: "%", q: data.ipca12m },
        { label: "IPCA do mês", value: data.ipcaMonth.price, unit: "%", q: data.ipcaMonth },
        { label: "Dólar PTAX", value: data.usdbrl.price, unit: "R$", q: data.usdbrl },
      ]
    : [];
  return (
    <Card delay={0.08}>
      <CardHeader title="Indicadores macroeconômicos" description="Banco Central do Brasil" />
      {isLoading || !data ? (
        <div className="space-y-2 px-5 pb-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8" />)}</div>
      ) : (
        <div className="px-5 pb-5">
          <dl className="divide-y divide-line">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-[13px]">
                <dt className="text-muted">{r.label}</dt>
                <dd className="num font-medium">
                  {r.value == null ? <span className="text-subtle">—</span> : r.unit === "R$" ? `R$ ${formatNumber(r.value, 4)}` : `${formatNumber(r.value, 2)}${r.unit}`}
                  <span className="ml-2 text-2xs font-normal text-subtle">{r.q.asOf ? formatDate(r.q.asOf, { day: "2-digit", month: "short" }) : ""}</span>
                </dd>
              </div>
            ))}
          </dl>
          {data.lastSelicChange && (
            <p className="mt-3 rounded-md bg-elevated px-3 py-2 text-xs leading-relaxed text-muted">
              Última mudança da Selic: de {formatNumber(data.lastSelicChange.previous, 2)}% para{" "}
              <span className="text-fg">{formatNumber(data.lastSelicChange.rate, 2)}%</span>, vigente desde {formatDate(data.lastSelicChange.date)}.
            </p>
          )}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted">Expectativas do mercado para {data.focus.year} (Focus, mediana)</p>
            {data.focus.status === "unavailable" ? (
              <p className="text-xs text-subtle">Indisponível no momento.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["IPCA", data.focus.ipca, "%"],
                  ["Selic", data.focus.selic, "%"],
                  ["PIB", data.focus.pib, "%"],
                  ["Câmbio", data.focus.cambio, "R$"],
                ].map(([l, v, u]) => (
                  <div key={l as string} className="rounded-md border border-line px-3 py-2">
                    <p className="text-2xs text-subtle">{l}</p>
                    <p className="num text-[13px] font-medium">{v == null ? "—" : u === "R$" ? `R$ ${formatNumber(v as number, 2)}` : `${formatNumber(v as number, 2)}%`}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <SourceTag source="BCB — Focus (Olinda)" asOf={data.focus.asOf ? `${data.focus.asOf}T12:00:00-03:00` : null} status={data.focus.status} note="Expectativas são projeções de analistas, não previsões garantidas." />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function CalendarCard() {
  const events = upcomingEvents(35);
  return (
    <Card delay={0.1} className="lg:col-span-3">
      <CardHeader title="Agenda econômica" description="Próximas 5 semanas" />
      {!events.length ? (
        <EmptyState icon={CalendarDays} title="Nenhum evento no período" />
      ) : (
        <ul className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 9).map((e) => (
            <li key={`${e.date}-${e.title}`} className="bg-surface px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="num text-xs font-medium text-fg">{formatDate(e.date, { weekday: "short", day: "2-digit", month: "short" })}</span>
                <Badge tone="outline">{e.region}</Badge>
                <Badge tone={e.kind === "estimado" ? "warn" : "neutral"}>{e.kind === "estimado" ? "Data estimada" : "Recorrente"}</Badge>
              </div>
              <p className="mt-1.5 text-[13px] font-medium">{e.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{e.description}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-5 py-3">
        <span className="text-2xs text-subtle">Calendários oficiais:</span>
        {OFFICIAL_CALENDARS.map((c) => (
          <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-2xs text-muted hover:text-fg">
            {c.label} <ExternalLink className="size-3" />
          </a>
        ))}
      </div>
    </Card>
  );
}
