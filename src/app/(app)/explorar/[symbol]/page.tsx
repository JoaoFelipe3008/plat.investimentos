"use client";

import { AlertTriangle, ArrowLeft, GraduationCap, Newspaper, Plus } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";
import { AlertButton, FavoriteButton, formatAssetValue, HistoryChart, NewsRow, QuoteChange } from "@/components/market";
import { Term } from "@/components/term";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SourceTag } from "@/components/ui/interactive";
import { Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { CATEGORY_LABEL, getAsset, isPriced } from "@/data/assets";
import { ALL_LESSONS } from "@/data/lessons";
import { useNews, useQuotes } from "@/hooks/use-market";
import { formatBRL, formatCompact, formatMoney, formatNumber } from "@/lib/format";

const LESSON_FOR: Record<string, string> = {
  "acoes-br": "bolsa/acoes",
  "acoes-int": "bolsa/acoes",
  etf: "bolsa/etfs",
  fii: "bolsa/fiis",
  tesouro: "renda-fixa/tesouro-direto",
  "renda-fixa": "renda-fixa/cdb",
  cripto: "cripto/bitcoin",
  indice: "bolsa/b3",
  cambio: "primeiros-passos/risco-retorno",
  macro: "primeiros-passos/inflacao",
};

export default function AssetPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const asset = getAsset(decodeURIComponent(symbol));
  const extraSymbols = asset?.unit === "USD" ? [asset.symbol, "USDBRL"] : asset ? [asset.symbol] : [];
  const { data: quotes, isLoading } = useQuotes(extraSymbols);
  const news = useNews();
  const related = useMemo(() => (news.data?.items ?? []).filter((n) => asset && n.related.includes(asset.symbol)).slice(0, 5), [news.data, asset]);
  if (!asset) notFound();

  const q = quotes?.[asset.symbol];
  const usd = quotes?.USDBRL?.price;
  const lessonKey = LESSON_FOR[asset.category];
  const lesson = ALL_LESSONS.find((l) => `${l.moduleId}/${l.id}` === lessonKey);
  const isBenchmark = asset.provider.kind === "benchmark";
  const ref = isBenchmark ? getAsset(asset.provider.kind === "benchmark" ? asset.provider.of : "")! : asset;

  const stats: { label: React.ReactNode; value: string }[] = [];
  if (q && !isBenchmark) {
    if (q.dayHigh != null && q.dayLow != null) stats.push({ label: "Mínima e máxima do dia", value: `${formatMoney(q.dayLow, asset.unit)} – ${formatMoney(q.dayHigh, asset.unit)}` });
    if (q.extra?.min52 != null && q.extra?.max52 != null) stats.push({ label: "Faixa de 52 semanas", value: `${formatMoney(q.extra.min52, asset.unit)} – ${formatMoney(q.extra.max52, asset.unit)}` });
    if (q.volume != null) stats.push({ label: <Term id="volume">Volume</Term>, value: asset.category === "cripto" ? formatBRL(q.volume, { compact: true }) : formatCompact(q.volume) });
    if (q.marketCap != null) stats.push({ label: <Term id="valor-de-mercado">Valor de mercado</Term>, value: formatBRL(q.marketCap, { compact: true }) });
    if (q.extra?.pl != null) stats.push({ label: <Term id="pl">P/L</Term>, value: formatNumber(q.extra.pl, 1) });
    if (q.extra?.lpa != null) stats.push({ label: "Lucro por ação (LPA)", value: formatMoney(q.extra.lpa, asset.unit) });
    if (q.extra?.usd != null) stats.push({ label: "Preço em dólar", value: formatMoney(q.extra.usd, "USD") });
    if (asset.unit === "USD" && q.price != null && usd) stats.push({ label: "Equivalente em reais (PTAX)", value: formatBRL(q.price * usd) });
  }

  return (
    <>
      <Link href="/explorar" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Explorar
      </Link>

      <div className="mb-6 mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">{asset.name}</h1>
            <Badge tone="outline">{asset.symbol}</Badge>
            <Badge>{CATEGORY_LABEL[asset.category]}</Badge>
            {asset.sector && <Badge>{asset.sector}</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-[13px] text-muted">{asset.description}</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {isLoading && !q ? (
              <Skeleton className="h-9 w-44" />
            ) : (
              <>
                <span className={`num text-[30px] font-semibold tracking-[-0.02em] ${q?.price == null ? "text-subtle" : ""}`}>
                  {q?.price == null ? "Cotação indisponível" : formatAssetValue(ref, q.price)}
                </span>
                {!isBenchmark && q?.price != null && <QuoteChange asset={asset} quote={q} pill />}
              </>
            )}
          </div>
          {isBenchmark && q?.price != null && <p className="mt-1 text-xs text-muted">Taxa {ref.name} atual, referência de rentabilidade deste produto. Não é o preço de um título específico.</p>}
          {q && (
            <div className="mt-2">
              <SourceTag source={q.source} asOf={q.asOf} status={q.status} note={q.delayNote ?? q.reason} />
              {q.status === "unavailable" && q.reason && <p className="mt-1 text-xs text-subtle">{q.reason}</p>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <FavoriteButton symbol={asset.symbol} withLabel />
          {asset.provider.kind !== "benchmark" && asset.category !== "macro" && <AlertButton symbol={asset.symbol} />}
          {(isPriced(asset) || isBenchmark) && (
            <Link href={`/carteira?novo=1&ativo=${asset.symbol}`}>
              <Button variant="primary"><Plus /> Registrar na carteira</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <HistoryChart symbol={asset.symbol} height={300} />
        </Card>

        <Card delay={0.04}>
          <CardHeader title="Informações" />
          <dl className="divide-y divide-line px-5 pb-3">
            {asset.facts?.map((f) => (
              <div key={f.label} className="py-2.5">
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd className="mt-0.5 text-[13px] leading-relaxed">{f.value}</dd>
              </div>
            ))}
            {stats.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="num text-right text-[13px]">{s.value}</dd>
              </div>
            ))}
            {!asset.facts?.length && !stats.length && <p className="py-4 text-xs text-subtle">Sem indicadores disponíveis para este ativo no momento.</p>}
          </dl>
        </Card>

        <Card delay={0.06} className="p-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-muted" />
            <h2 className="text-[13px] font-medium">Para quem está começando</h2>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{asset.beginner}</p>
          {lesson && (
            <Link href={`/guia/${lesson.moduleId}/${lesson.id}`} className="mt-4 block rounded-md border border-line px-3 py-2.5 hover:border-line-strong">
              <p className="text-2xs text-subtle">Lição relacionada</p>
              <p className="text-[13px] font-medium">{lesson.title}</p>
            </Link>
          )}
        </Card>

        <Card delay={0.08} className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted" />
            <h2 className="text-[13px] font-medium">Principais riscos</h2>
          </div>
          {asset.risks.length ? (
            <ul className="mt-3 space-y-2.5">
              {asset.risks.map((r) => (
                <li key={r} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-muted" />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Este é um indicador de referência, não um ativo negociável.</p>
          )}
        </Card>

        <Card delay={0.1}>
          <CardHeader title="Notícias relacionadas" />
          {news.isLoading ? (
            <div className="space-y-2 px-5 pb-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : related.length ? (
            related.map((n) => <NewsRow key={n.id} item={n} compact />)
          ) : (
            <EmptyState icon={Newspaper} title="Nada recente" description="Nenhuma notícia recente das fontes conectadas menciona este ativo." />
          )}
        </Card>
      </div>
      <p className="mt-6 text-2xs leading-relaxed text-subtle">
        Informações educacionais. Rentabilidade passada não garante resultados futuros. O Lastro não recomenda a compra ou venda de nenhum ativo.
      </p>
    </>
  );
}
