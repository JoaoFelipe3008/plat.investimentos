"use client";

import { AlertCircle, BellPlus, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getAsset, type Asset } from "@/data/assets";
import { useHistory } from "@/hooks/use-market";
import { formatMoney, formatNumber, timeAgo } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { HistoryRange, NewsItem, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateAlertDialog } from "./alert-dialog";
import { TimeAreaChart } from "./charts/charts";
import { Button } from "./ui/button";
import { Segmented, SourceTag, Tooltip } from "./ui/interactive";
import { Badge, Change, Skeleton } from "./ui/primitives";

export function formatAssetValue(asset: Asset | undefined, v: number | null | undefined) {
  if (!asset) return formatNumber(v);
  if (asset.unit === "PCT") {
    if (v == null) return "—";
    const suffix = asset.symbol === "IPCA" ? " 12m" : " a.a.";
    return `${formatNumber(v, 2)}%${suffix}`;
  }
  if (asset.unit === "PTS") return v == null ? "—" : `${formatNumber(v, 0)} pts`;
  if (asset.symbol === "USDBRL") return v == null ? "—" : `R$ ${formatNumber(v, 4)}`;
  return formatMoney(v, asset.unit);
}

/** Variação exibida: em p.p. para taxas, em % para preços. */
export function QuoteChange({ asset, quote, pill }: { asset?: Asset; quote?: Quote; pill?: boolean }) {
  if (!quote) return <span className="text-subtle">—</span>;
  if (asset?.unit === "PCT") {
    if (quote.change == null || quote.change === 0) return <span className="num text-xs text-muted">estável</span>;
    return (
      <span className={cn("num text-xs font-medium", quote.change > 0 ? "text-up" : "text-down")}>
        {quote.change > 0 ? "+" : "−"}
        {formatNumber(Math.abs(quote.change), 2)} p.p.
      </span>
    );
  }
  return <Change value={quote.changePct} pill={pill} className="text-xs" />;
}

export function IndicatorTile({ symbol, quote, loading }: { symbol: string; quote?: Quote; loading?: boolean }) {
  const asset = getAsset(symbol);
  return (
    <Link
      href={`/explorar/${symbol}`}
      className="group flex min-w-0 flex-col justify-between gap-2 rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-elevated/50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted group-hover:text-fg">{asset?.name ?? symbol}</span>
        {quote?.status === "unavailable" && (
          <Tooltip content={quote.reason ?? "Fonte indisponível"}>
            <AlertCircle className="size-3.5 shrink-0 text-subtle" />
          </Tooltip>
        )}
      </div>
      {loading && !quote ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className={cn("num text-[15px] font-medium", quote?.price == null ? "text-subtle" : "text-fg")}>
            {quote?.price == null ? "Indisponível" : formatAssetValue(asset, quote.price)}
          </span>
          {quote?.price != null && <QuoteChange asset={asset} quote={quote} />}
        </div>
      )}
    </Link>
  );
}

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "5d", label: "5D" },
  { value: "1m", label: "1M" },
  { value: "6m", label: "6M" },
  { value: "1a", label: "1A" },
  { value: "5a", label: "5A" },
];

export function HistoryChart({ symbol, defaultRange = "1m", height = 260 }: { symbol: string; defaultRange?: HistoryRange; height?: number }) {
  const asset = getAsset(symbol);
  const isMacro = asset?.category === "macro" || asset?.category === "tesouro" || asset?.category === "renda-fixa";
  const ranges = isMacro ? RANGES.filter((r) => ["6m", "1a", "5a"].includes(r.value)) : RANGES;
  const [range, setRange] = useState<HistoryRange>(isMacro ? "1a" : defaultRange);
  const { data, isLoading, isFetching } = useHistory(symbol, range);
  const points = data?.points ?? [];
  const first = points[0]?.v;
  const last = points.at(-1)?.v;
  const periodChange = first && last ? (last / first - 1) * 100 : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted">
          {asset?.unit !== "PCT" && periodChange != null && (
            <>
              <span>No período</span>
              <Change value={periodChange} pill />
            </>
          )}
          {isFetching && !isLoading && <span className="text-subtle">atualizando…</span>}
        </div>
        <Segmented value={range} onChange={setRange} options={ranges} label="Período do gráfico" />
      </div>
      {isLoading ? (
        <div style={{ height }}>
          <Skeleton className="h-full w-full" />
        </div>
      ) : points.length < 2 ? (
        <div style={{ height }} className="grid place-items-center rounded-md border border-dashed border-line text-center">
          <div className="max-w-xs px-6">
            <p className="text-[13px] text-muted">Histórico indisponível para este período.</p>
            {data?.reason && <p className="mt-1 text-xs text-subtle">{data.reason}</p>}
          </div>
        </div>
      ) : (
        <TimeAreaChart
          data={points}
          height={height}
          tone={asset?.unit === "PCT" ? "neutral" : "auto"}
          format={(v) => (asset?.unit === "PCT" ? `${formatNumber(v, 2)}%` : asset?.unit === "PTS" ? formatNumber(v, 0) : formatMoney(v, asset?.unit ?? "BRL"))}
        />
      )}
      {data && (
        <div className="mt-3 flex items-center justify-between">
          <SourceTag source={data.source} asOf={data.points.at(-1) ? new Date(data.points.at(-1)!.t).toISOString() : null} status={data.status} note={data.reason} />
          <span className="text-2xs text-subtle">Rentabilidade passada não garante resultados futuros.</span>
        </div>
      )}
    </div>
  );
}

export function FavoriteButton({ symbol, withLabel }: { symbol: string; withLabel?: boolean }) {
  const fav = useApp((s) => s.favorites.includes(symbol));
  const toggle = useApp((s) => s.toggleFavorite);
  return (
    <Button variant={withLabel ? "secondary" : "ghost"} size={withLabel ? "md" : "icon-sm"} onClick={() => toggle(symbol)} aria-pressed={fav} aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
      <Star className={cn(fav && "fill-fg text-fg")} />
      {withLabel && (fav ? "Favorito" : "Favoritar")}
    </Button>
  );
}

export function AlertButton({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <BellPlus /> Criar alerta
      </Button>
      <CreateAlertDialog open={open} onOpenChange={setOpen} defaultSymbol={symbol} />
    </>
  );
}

export function NewsRow({ item, compact }: { item: NewsItem; compact?: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 border-b border-line px-5 py-4 last:border-0 hover:bg-elevated/40"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-subtle">
          <span className="font-medium text-muted">{item.source}</span>
          <span aria-hidden>·</span>
          <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
          {item.related.slice(0, compact ? 2 : 4).map((r) => (
            <Badge key={r} tone="outline">
              {r}
            </Badge>
          ))}
        </div>
        <h3 className="text-[14px] font-medium leading-snug text-fg group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
          {item.title}
        </h3>
        {!compact && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{item.summary}</p>}
      </div>
      {!compact && item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" loading="lazy" decoding="async" className="hidden h-20 w-32 shrink-0 rounded-md border border-line object-cover sm:block" />
      )}
      <ExternalLink className="mt-1 size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </a>
  );
}
