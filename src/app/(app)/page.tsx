"use client";

import * as P from "@radix-ui/react-popover";
import { ArrowRight, BellRing, BookOpen, Newspaper, SlidersHorizontal, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Donut, TimeAreaChart, CATEGORY_COLORS } from "@/components/charts/charts";
import { formatAssetValue, IndicatorTile, NewsRow, QuoteChange } from "@/components/market";
import { PageHeader } from "@/components/shell/app-shell";
import { Term } from "@/components/term";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { AnimatedNumber, Switch, Tooltip } from "@/components/ui/interactive";
import { Badge, Change, EmptyState, Skeleton, Stat } from "@/components/ui/primitives";
import { getAsset, MARKET_INDICATORS } from "@/data/assets";
import { useNews, useQuotes } from "@/hooks/use-market";
import { useMask, usePortfolio } from "@/hooks/use-portfolio";
import { buildTrail, nextLessons } from "@/lib/finance/trail";
import { formatBRL, timeAgo } from "@/lib/format";
import { DASHBOARD_WIDGETS, useApp, type WidgetId } from "@/lib/store";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default function Dashboard() {
  const profile = useApp((s) => s.profile)!;
  const widgets = useApp((s) => s.settings.widgets);
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        eyebrow={today.charAt(0).toUpperCase() + today.slice(1)}
        title={`${greeting()}, ${profile.name.split(" ")[0]}`}
        description="Seu resumo do dia: patrimônio acompanhado, mercado e próximos passos no seu aprendizado."
        actions={<CustomizeButton />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {widgets.patrimonio && <PortfolioCard />}
        {widgets.alocacao && <AllocationCard />}
        {widgets.indices && (
          <div className="lg:col-span-3">
            <IndicatorsStrip />
          </div>
        )}
        {widgets.favoritos && <FavoritesCard />}
        {widgets.licoes && <LessonsCard />}
        {widgets.alertas && <AlertsCard />}
        {widgets.noticias && <NewsCard />}
      </div>
      <p className="mt-8 text-2xs leading-relaxed text-subtle">
        O Lastro é uma plataforma educacional e de acompanhamento. Não intermediamos operações e nada aqui é recomendação de compra ou venda.
        Rentabilidade passada não garante resultados futuros.
      </p>
    </>
  );
}

function CustomizeButton() {
  const widgets = useApp((s) => s.settings.widgets);
  const toggle = useApp((s) => s.toggleWidget);
  return (
    <P.Root>
      <P.Trigger asChild>
        <Button variant="secondary" size="sm">
          <SlidersHorizontal /> Personalizar
        </Button>
      </P.Trigger>
      <P.Portal>
        <P.Content align="end" sideOffset={8} className="z-50 w-64 rounded-lg border border-line-strong bg-surface p-2 shadow-2xl shadow-black/50">
          <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted">Exibir no painel</p>
          {(Object.keys(DASHBOARD_WIDGETS) as WidgetId[]).map((id) => (
            <label key={id} className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-[13px] hover:bg-elevated">
              {DASHBOARD_WIDGETS[id]}
              <Switch checked={widgets[id]} onCheckedChange={() => toggle(id)} aria-label={DASHBOARD_WIDGETS[id]} />
            </label>
          ))}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

function PortfolioCard() {
  const pf = usePortfolio();
  const mask = useMask();
  const loadExample = useApp((s) => s.loadExamplePortfolio);
  const loading = pf.hasData && pf.quotes.isLoading;
  const month = pf.periodChange(30);
  const year = pf.periodChange(365);
  const hasExample = pf.positions.some((p) => p.example);

  const chartData = useMemo(() => {
    const snaps = new Map(pf.snapshots.map((s) => [new Date(`${s.date}T12:00:00`).getTime(), s.value]));
    const pts = pf.investedHistory.map((p) => ({ t: p.t, v: p.v, ...(snaps.has(p.t) ? { m: snaps.get(p.t)! } : {}) }));
    for (const [t, m] of snaps) if (!pts.some((p) => p.t === t)) pts.push({ t, v: pf.investedHistory.filter((x) => x.t <= t).at(-1)?.v ?? 0, m });
    pts.sort((a, b) => a.t - b.t);
    if (pts.length) pts.push({ t: Date.now(), v: pf.investedHistory.at(-1)?.v ?? 0, m: pf.total });
    return pts.map((p) => ({ t: p.t, v: p.v, ...("m" in p && p.m != null ? { m: p.m } : {}) }));
  }, [pf.investedHistory, pf.snapshots, pf.total]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Patrimônio acompanhado"
        description={hasExample ? "Inclui a carteira de exemplo (valores de compra fictícios)." : "Soma dos ativos registrados em Minha carteira."}
        action={
          <Link href="/carteira" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
            Ver carteira <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      {!pf.hasData ? (
        <EmptyState
          icon={Wallet}
          title="Sua carteira ainda está vazia"
          description="Registre seus investimentos para acompanhar a evolução, ou explore a interface com uma carteira de exemplo."
          action={
            <>
              <Link href="/carteira?novo=1">
                <Button variant="primary" size="sm">Registrar investimento</Button>
              </Link>
              <Button size="sm" onClick={loadExample}>Carregar exemplo</Button>
            </>
          }
        />
      ) : (
        <div className="px-5 pb-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              {loading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <p className="num text-[32px] font-semibold leading-none tracking-[-0.02em]">
                  <AnimatedNumber value={pf.total} format={(v) => mask(formatBRL(v))} />
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                Investido {mask(formatBRL(pf.invested))}
                {hasExample && (
                  <Badge tone="warn" className="ml-2">
                    Exemplo
                  </Badge>
                )}
              </p>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-4 sm:max-w-md">
              <Stat label="Hoje" value={<Change value={pf.dayChangePct} />} sub={<span className="text-subtle">ativos com cotação</span>} />
              <Stat
                label="30 dias"
                value={<Change value={month} />}
                sub={month == null ? <Tooltip content="A variação mensal aparece depois que o Lastro registrar 30 dias de histórico da sua carteira."><span className="cursor-help text-subtle">sem histórico</span></Tooltip> : null}
              />
              <Stat
                label="12 meses"
                value={<Change value={year} />}
                sub={year == null ? <span className="text-subtle">sem histórico</span> : null}
              />
            </div>
          </div>
          <div className="mt-5">
            {chartData.length > 1 ? (
              <TimeAreaChart
                data={chartData}
                dataKey="v"
                mainLabel="Investido"
                compareKey={chartData.some((d) => "m" in d) ? "m" : undefined}
                compareLabel="Valor de mercado"
                tone="neutral"
                curve="stepAfter"
                height={200}
                format={(v) => mask(formatBRL(v, { compact: true }))}
              />
            ) : (
              <Skeleton className="h-[200px]" />
            )}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-2xs text-subtle">
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-fg" /> Total investido</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 border-t border-dashed border-muted" /> Valor de mercado (registrado diariamente)</span>
              {pf.unpricedCount > 0 && <span>Renda fixa e Tesouro aparecem pelo valor aplicado.</span>}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function AllocationCard() {
  const pf = usePortfolio();
  const mask = useMask();
  return (
    <Card delay={0.04}>
      <CardHeader title="Distribuição por classe" description={<><Term id="diversificacao">Diversificação</Term> da carteira</>} />
      {!pf.byCategory.length ? (
        <EmptyState icon={Wallet} title="Sem ativos" description="A distribuição aparece quando houver ativos na carteira." />
      ) : (
        <div className="flex flex-col items-center gap-5 px-5 pb-5 sm:flex-row lg:flex-col xl:flex-row">
          <Donut data={pf.byCategory.map((c) => ({ name: c.name, value: c.value }))} size={136} />
          <ul className="w-full space-y-2">
            {pf.byCategory.map((c, i) => (
              <li key={c.category} className="flex items-center gap-2 text-[13px]">
                <span className="size-2 shrink-0 rounded-[2px]" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                <span className="truncate text-muted">{c.name}</span>
                <span className="num ml-auto font-medium">{c.pct.toFixed(1).replace(".", ",")}%</span>
                <span className="num hidden w-20 text-right text-xs text-subtle sm:inline">{mask(formatBRL(c.value, { compact: true }))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function IndicatorsStrip() {
  const { data, isLoading } = useQuotes(MARKET_INDICATORS);
  return (
    <section aria-label="Principais indicadores">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Principais indicadores</h2>
        <Link href="/mercado" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
          Mercado <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {MARKET_INDICATORS.map((s) => (
          <IndicatorTile key={s} symbol={s} quote={data?.[s]} loading={isLoading} />
        ))}
      </div>
    </section>
  );
}

function FavoritesCard() {
  const favorites = useApp((s) => s.favorites);
  const { data, isLoading } = useQuotes(favorites);
  return (
    <Card delay={0.06}>
      <CardHeader title="Favoritos" action={<Link href="/explorar" className="text-xs text-muted hover:text-fg">Explorar</Link>} />
      {!favorites.length ? (
        <EmptyState icon={Star} title="Nenhum favorito" description="Marque ativos com a estrela para acompanhá-los aqui." />
      ) : (
        <ul className="pb-2">
          {favorites.slice(0, 7).map((s) => {
            const a = getAsset(s);
            const q = data?.[s];
            return (
              <li key={s}>
                <Link href={`/explorar/${s}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-elevated/40">
                  <div className="min-w-0 flex-1">
                    <p className="num text-[13px] font-medium">{s}</p>
                    <p className="truncate text-xs text-subtle">{a?.name}</p>
                  </div>
                  <div className="text-right">
                    {isLoading && !q ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <>
                        <p className={cn("num text-[13px]", q?.price == null && "text-subtle")}>{q?.price == null ? "—" : formatAssetValue(a, q.price)}</p>
                        <QuoteChange asset={a} quote={q} />
                      </>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function LessonsCard() {
  const profile = useApp((s) => s.profile);
  const lessons = useApp((s) => s.lessons);
  const trail = useMemo(() => buildTrail(profile), [profile]);
  const next = nextLessons(trail, lessons, 3);
  const done = Object.keys(lessons).length;
  const total = trail.order.length;
  return (
    <Card delay={0.08}>
      <CardHeader
        title="Próximas lições"
        description={`${done} de ${total} concluídas`}
        action={<Link href="/guia" className="text-xs text-muted hover:text-fg">Meu guia</Link>}
      />
      <div className="mx-5 mb-3 h-1 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-fg transition-[width] duration-700" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {next.length === 0 ? (
        <EmptyState icon={BookOpen} title="Trilha concluída" description="Você completou todas as lições disponíveis." />
      ) : (
        <ul className="pb-2">
          {next.map(({ key, module, lesson }) => (
            <li key={key}>
              <Link href={`/guia/${module.id}/${lesson.id}`} className="group flex items-center gap-3 px-5 py-2.5 hover:bg-elevated/40">
                <span className="num grid size-7 shrink-0 place-items-center rounded-md border border-line text-2xs text-muted">{module.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{lesson.title}</p>
                  <p className="text-xs text-subtle">{lesson.minutes} min · {module.title}</p>
                </div>
                <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AlertsCard() {
  const notifications = useApp((s) => s.notifications);
  const activeAlerts = useApp((s) => s.alerts.filter((a) => a.active).length);
  return (
    <Card delay={0.1}>
      <CardHeader
        title="Alertas"
        description={`${activeAlerts} ${activeAlerts === 1 ? "alerta ativo" : "alertas ativos"}`}
        action={<Link href="/alertas" className="text-xs text-muted hover:text-fg">Gerenciar</Link>}
      />
      {!notifications.length ? (
        <EmptyState
          icon={BellRing}
          title="Nenhum disparo ainda"
          description="Configure alertas de preço, variação, notícias ou Selic."
          action={<Link href="/alertas?novo=1"><Button size="sm">Criar alerta</Button></Link>}
        />
      ) : (
        <ul className="pb-2">
          {notifications.slice(0, 4).map((n) => (
            <li key={n.id} className="flex gap-3 px-5 py-2.5">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-line-strong" : "bg-fg")} />
              <div className="min-w-0">
                <p className="truncate text-[13px]">{n.title}</p>
                <p className="text-xs text-subtle">{timeAgo(n.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NewsCard() {
  const { data, isLoading } = useNews();
  const items = useMemo(() => {
    if (!data) return [];
    const recent = data.items.filter((n) => Date.now() - new Date(n.publishedAt).getTime() < 72 * 3_600_000);
    return [...(recent.length >= 4 ? recent : data.items)].sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }, [data]);
  return (
    <Card delay={0.12} className="lg:col-span-3">
      <CardHeader
        title="Notícias relevantes"
        description="Selecionadas por relação com mercado, juros e ativos acompanhados"
        action={<Link href="/noticias" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">Todas <ArrowRight className="size-3.5" /></Link>}
      />
      {isLoading ? (
        <div className="space-y-3 px-5 pb-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState icon={Newspaper} title="Sem notícias no momento" description="As fontes configuradas não retornaram itens. Tente novamente em alguns minutos." />
      ) : (
        <div>
          {items.map((n) => (
            <NewsRow key={n.id} item={n} />
          ))}
        </div>
      )}
    </Card>
  );
}
